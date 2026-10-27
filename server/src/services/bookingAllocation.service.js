import mongoose from 'mongoose';
import { Resource } from '../models/Resource.js';
import { Booking } from '../models/Booking.js';
import { ResourceSlot } from '../models/ResourceSlot.js';
import { MaintenanceBlock } from '../models/MaintenanceBlock.js';
import { ApiError } from '../utils/ApiError.js';
import { isIntervalOverlapping } from './availability.service.js';

/**
 * Canonical mapping from Date.getUTCDay() index to day key.
 */
const DAY_INDEX_MAP = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Validates a requested reservation interval against the resource's operating hours
 * and fixed slot duration, calculating the required contiguous slot increments.
 *
 * Invariants:
 * 1. startAt must be strictly before endAt: [startAt, endAt).
 * 2. startAt and endAt must fall on the same operating day.
 * 3. The resource must be open on that day.
 * 4. The interval must fall entirely within [openTime, closeTime).
 * 5. The interval duration and start/end boundaries must align with the resource's slot duration grid.
 *
 * @param {object} resource - Resource document or safe object
 * @param {Date} startAt - Requested reservation start instant
 * @param {Date} endAt - Requested reservation end instant
 * @returns {Array<{ slotStartAt: Date, slotEndAt: Date }>}
 */
export function calculateRequiredSlots(resource, startAt, endAt) {
  if (!(startAt instanceof Date) || Number.isNaN(startAt.getTime())) {
    throw ApiError.badRequest('Invalid start timestamp.', 'INVALID_BOOKING_INTERVAL');
  }

  if (!(endAt instanceof Date) || Number.isNaN(endAt.getTime())) {
    throw ApiError.badRequest('Invalid end timestamp.', 'INVALID_BOOKING_INTERVAL');
  }

  const startMs = startAt.getTime();
  const endMs = endAt.getTime();

  if (startMs >= endMs) {
    throw ApiError.badRequest(
      'Reservation end time must be strictly later than start time [startAt, endAt).',
      'INVALID_BOOKING_INTERVAL',
    );
  }

  // 1. Verify same-day schedule (using UTC representation matching resource schedule model)
  const startYear = startAt.getUTCFullYear();
  const startMonth = startAt.getUTCMonth();
  const startDay = startAt.getUTCDate();

  const endYear = endAt.getUTCFullYear();
  const endMonth = endAt.getUTCMonth();
  const endDay = endAt.getUTCDate();

  // If endAt is exactly at 00:00 of the next calendar day, it could be midnight close.
  // Otherwise, start and end must be on the same calendar day.
  const isNextDayMidnight =
    endAt.getUTCHours() === 0 &&
    endAt.getUTCMinutes() === 0 &&
    endAt.getUTCSeconds() === 0 &&
    new Date(Date.UTC(startYear, startMonth, startDay + 1)).getTime() === new Date(Date.UTC(endYear, endMonth, endDay)).getTime();

  if (!isNextDayMidnight && (startYear !== endYear || startMonth !== endMonth || startDay !== endDay)) {
    throw ApiError.badRequest(
      'Multi-day reservations across closed overnight periods are not supported. Bookings must be within a single operating day.',
      'INVALID_BOOKING_INTERVAL',
    );
  }

  // 2. Resolve operating hours for the day of week
  const dayOfWeek = DAY_INDEX_MAP[startAt.getUTCDay()];
  const schedule = resource.operatingHours?.[dayOfWeek];

  if (!schedule || !schedule.isOpen || !schedule.openTime || !schedule.closeTime) {
    throw ApiError.badRequest(
      `Resource is closed on ${dayOfWeek}s. Reservations cannot be scheduled outside operating hours.`,
      'INVALID_BOOKING_INTERVAL',
    );
  }

  // 3. Resolve opening and closing instants
  const [openHourStr, openMinStr] = schedule.openTime.split(':');
  const [closeHourStr, closeMinStr] = schedule.closeTime.split(':');

  const openInstant = new Date(Date.UTC(startYear, startMonth, startDay, Number(openHourStr), Number(openMinStr), 0, 0));
  const closeInstant = new Date(Date.UTC(startYear, startMonth, startDay, Number(closeHourStr), Number(closeMinStr), 0, 0));

  if (startMs < openInstant.getTime()) {
    throw ApiError.badRequest(
      `Requested start time (${startAt.toISOString()}) is before resource opening time (${openInstant.toISOString()}).`,
      'INVALID_BOOKING_INTERVAL',
    );
  }

  if (endMs > closeInstant.getTime()) {
    throw ApiError.badRequest(
      `Requested end time (${endAt.toISOString()}) extends beyond resource closing time (${closeInstant.toISOString()}).`,
      'INVALID_BOOKING_INTERVAL',
    );
  }

  // 4. Validate slot duration alignment
  const slotDurationMinutes = resource.slotDurationMinutes || 30;
  const durationMs = slotDurationMinutes * 60 * 1000;
  const totalDurationMs = endMs - startMs;

  if (totalDurationMs % durationMs !== 0) {
    throw ApiError.badRequest(
      `Reservation duration must be an integer multiple of the resource slot duration (${slotDurationMinutes} minutes).`,
      'INVALID_BOOKING_INTERVAL',
    );
  }

  // Verify alignment relative to opening time grid
  const startOffsetMs = startMs - openInstant.getTime();
  if (startOffsetMs % durationMs !== 0) {
    throw ApiError.badRequest(
      `Requested start time is not aligned with the resource's ${slotDurationMinutes}-minute slot grid anchored at ${schedule.openTime}.`,
      'INVALID_BOOKING_INTERVAL',
    );
  }

  // 5. Generate contiguous slot records
  const requiredSlots = [];
  let currentMs = startMs;

  while (currentMs < endMs) {
    requiredSlots.push({
      slotStartAt: new Date(currentMs),
      slotEndAt: new Date(currentMs + durationMs),
    });
    currentMs += durationMs;
  }

  return requiredSlots;
}

/**
 * Atomically creates a booking and allocates its fixed-duration resource slots.
 *
 * Uses MongoDB transactions where supported to ensure multi-document atomicity:
 * either both the booking and all required slot allocations are created, or none are.
 * The compound unique index on ResourceSlot (resourceId, slotStartAt) acts as
 * the ultimate concurrency guarantee against race conditions.
 *
 * @param {object} params
 * @param {string} params.userId - Authenticated user ObjectId
 * @param {string} params.resourceId - Target resource ObjectId
 * @param {Date | string} params.startAt - Reservation start instant
 * @param {Date | string} params.endAt - Reservation end instant
 * @param {string} [params.notes=''] - Optional reservation notes
 * @param {import('mongoose').ClientSession} [params.session=null] - Optional external session
 * @returns {Promise<{ booking: object, slots: object[] }>}
 */
export async function allocateBookingWithSlots({
  userId,
  resourceId,
  startAt,
  endAt,
  notes = '',
}, externalSession = null) {
  // Normalize date objects
  const startDate = startAt instanceof Date ? startAt : new Date(startAt);
  const endDate = endAt instanceof Date ? endAt : new Date(endAt);

  // 1. Fetch active resource
  const resource = await Resource.findById(resourceId);

  if (!resource) {
    throw ApiError.notFound('Resource not found.', 'RESOURCE_NOT_FOUND');
  }

  if (resource.status !== 'active') {
    throw ApiError.badRequest(
      'This resource is currently inactive and cannot accept new reservations.',
      'RESOURCE_INACTIVE',
    );
  }

  // 2. Reject past reservations (server is the authority on current time)
  if (startDate.getTime() <= Date.now()) {
    throw ApiError.badRequest(
      'Reservation start time must be in the future.',
      'INVALID_BOOKING_INTERVAL',
    );
  }

  // 3. Validate alignment and calculate required slots
  const requiredSlots = calculateRequiredSlots(resource, startDate, endDate);

  // 4. Execute atomic allocation inside a transaction session
  const ownsSession = !externalSession;
  const session = externalSession || (await mongoose.startSession());

  try {
    let result;

    const executeTransactionWork = async () => {
      // 4a. Check for overlapping maintenance blocks
      const maintenanceConflict = await MaintenanceBlock.findOne({
        resourceId: resource._id,
        startAt: { $lt: endDate },
        endAt: { $gt: startDate },
      }).session(session);

      if (maintenanceConflict) {
        throw ApiError.conflict(
          'The requested time slot overlaps with a scheduled maintenance blackout period.',
          'BOOKING_CONFLICT',
        );
      }

      // 4b. Check for overlapping active bookings
      const bookingConflict = await Booking.findOne({
        resourceId: resource._id,
        status: { $in: ['confirmed', 'completed'] },
        startAt: { $lt: endDate },
        endAt: { $gt: startDate },
      }).session(session);

      if (bookingConflict) {
        throw ApiError.conflict(
          'The requested reservation interval conflicts with an existing confirmed booking.',
          'BOOKING_CONFLICT',
        );
      }

      // 4c. Create the Booking document
      const booking = new Booking({
        userId,
        resourceId: resource._id,
        startAt: startDate,
        endAt: endDate,
        status: 'confirmed',
        notes: typeof notes === 'string' ? notes.trim() : '',
      });

      await booking.save({ session });

      // 4d. Create and insert ResourceSlot allocation records
      const slotDocuments = requiredSlots.map((slot) => ({
        resourceId: resource._id,
        slotStartAt: slot.slotStartAt,
        slotEndAt: slot.slotEndAt,
        bookingId: booking._id,
      }));

      // insertMany with session; unique index enforces atomicity against concurrent requests
      const createdSlots = await ResourceSlot.insertMany(slotDocuments, { session });

      return {
        booking: booking.toSafeObject(),
        slots: createdSlots.map((s) => s.toSafeObject()),
      };
    };

    if (externalSession) {
      // Caller manages transaction lifecycle
      result = await executeTransactionWork();
    } else {
      // Managed transaction boundary with explicit commit/abort
      try {
        session.startTransaction();
        result = await executeTransactionWork();
        await session.commitTransaction();
      } catch (txError) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        throw txError;
      }
    }

    return result;
  } catch (error) {
    // 5. Handle duplicate key error from unique compound index (resourceId, slotStartAt)
    if (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000)) {
      throw ApiError.conflict(
        'One or more requested time slots have already been reserved by a concurrent booking.',
        'BOOKING_CONFLICT',
      );
    }

    // 6. Handle standalone MongoDB without replica set transaction support
    if (
      error.code === 20 ||
      (error.message && error.message.includes('Transaction numbers are only allowed on a replica set member or mongos'))
    ) {
      throw ApiError.serviceUnavailable(
        'Database transactions are unavailable. Multi-document booking allocation requires a MongoDB replica set deployment.',
        'TRANSACTIONS_UNAVAILABLE',
      );
    }

    // Re-throw operational ApiErrors or wrap unexpected errors
    if (error instanceof ApiError) {
      throw error;
    }

    throw ApiError.internal(
      'An unexpected error occurred while allocating booking slots.',
      'BOOKING_ALLOCATION_FAILED',
      error.message,
    );
  } finally {
    if (ownsSession) {
      await session.endSession();
    }
  }
}

/**
 * Releases all active ResourceSlot records associated with a booking.
 * Used during cancellation or rollback to release slot claims while preserving
 * the historical Booking document.
 *
 * @param {string | mongoose.Types.ObjectId} bookingId
 * @param {import('mongoose').ClientSession} [session=null]
 * @returns {Promise<{ deletedCount: number }>}
 */
export async function releaseBookingSlots(bookingId, session = null) {
  const query = { bookingId };
  const options = session ? { session } : {};

  const result = await ResourceSlot.deleteMany(query, options);
  return { deletedCount: result.deletedCount };
}

export default {
  calculateRequiredSlots,
  allocateBookingWithSlots,
  releaseBookingSlots,
};
