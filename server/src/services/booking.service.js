import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Resource } from '../models/Resource.js';
import { ResourceSlot } from '../models/ResourceSlot.js';
import { MaintenanceBlock } from '../models/MaintenanceBlock.js';
import { ApiError } from '../utils/ApiError.js';
import {
  allocateBookingWithSlots,
  releaseBookingSlots,
  calculateRequiredSlots,
} from './bookingAllocation.service.js';

/**
 * Standardized booking formatter populating minimal non-sensitive resource information.
 *
 * @param {object} booking
 * @returns {object}
 */
export function formatBooking(booking) {
  const resDoc = booking.resourceId && typeof booking.resourceId === 'object' && booking.resourceId._id
    ? booking.resourceId
    : null;

  const userDoc = booking.userId && typeof booking.userId === 'object' && booking.userId._id
    ? booking.userId
    : null;

  const cancellerDoc = booking.cancelledBy && typeof booking.cancelledBy === 'object' && booking.cancelledBy._id
    ? booking.cancelledBy
    : null;

  return {
    id: booking._id.toString(),
    userId: userDoc ? userDoc._id.toString() : booking.userId.toString(),
    user: userDoc
      ? {
          id: userDoc._id.toString(),
          name: userDoc.name,
          email: userDoc.email,
        }
      : null,
    resourceId: resDoc ? resDoc._id.toString() : booking.resourceId.toString(),
    resource: resDoc
      ? {
          id: resDoc._id.toString(),
          name: resDoc.name,
          category: resDoc.category,
          location: resDoc.location,
          capacity: resDoc.capacity,
          slotDurationMinutes: resDoc.slotDurationMinutes,
          ...(resDoc.description ? { description: resDoc.description } : {}),
        }
      : null,
    startAt: booking.startAt,
    endAt: booking.endAt,
    status: booking.status,
    notes: booking.notes,
    cancellationReason: booking.cancellationReason || null,
    cancelledAt: booking.cancelledAt || null,
    cancelledBy: cancellerDoc
      ? {
          id: cancellerDoc._id.toString(),
          name: cancellerDoc.name,
          email: cancellerDoc.email,
        }
      : booking.cancelledBy
        ? booking.cancelledBy.toString()
        : null,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

/**
 * Creates a new reservation for an authenticated user with atomic slot allocation.
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
export async function createBooking({
  userId,
  resourceId,
  startAt,
  endAt,
  notes = '',
}, session = null) {
  return allocateBookingWithSlots(
    {
      userId,
      resourceId,
      startAt,
      endAt,
      notes,
    },
    session,
  );
}

/**
 * Retrieves the paginated booking history for an authenticated user.
 *
 * @param {object} params
 * @param {string} params.userId - Authenticated user ObjectId
 * @param {object} params.queryOptions - Validated query parameters
 * @returns {Promise<{ bookings: object[], pagination: object }>}
 */
export async function getUserBookings({ userId, queryOptions = {} }) {
  const {
    page = 1,
    limit = 10,
    status = null,
    resourceId = null,
    fromDate = null,
    toDate = null,
  } = queryOptions;

  // Strict ownership filter: regular user can only access their own bookings
  const query = { userId };

  if (status) {
    query.status = status;
  }

  if (resourceId) {
    query.resourceId = resourceId;
  }

  if (fromDate || toDate) {
    query.startAt = {};
    if (fromDate) {
      query.startAt.$gte = fromDate;
    }
    if (toDate) {
      query.startAt.$lte = toDate;
    }
  }

  const skip = (page - 1) * limit;

  // Deterministic sorting: newest reservation first, secondary sort on createdAt
  const sort = { startAt: -1, createdAt: -1 };

  const [bookings, totalItems] = await Promise.all([
    Booking.find(query)
      .populate('resourceId', 'name category location capacity slotDurationMinutes')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    bookings: bookings.map(formatBooking),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Retrieves details for an individual booking by ID with ownership enforcement.
 *
 * @param {object} params
 * @param {string} params.bookingId - Booking ObjectId
 * @param {string} params.userId - Authenticated user ObjectId
 * @returns {Promise<object>}
 */
export async function getBookingById({ bookingId, userId }) {
  const booking = await Booking.findById(bookingId).populate(
    'resourceId',
    'name description category location capacity slotDurationMinutes',
  );

  // Return consistent 404 if nonexistent OR owned by another user to avoid data enumeration
  if (!booking || booking.userId.toString() !== userId.toString()) {
    throw ApiError.notFound('Booking not found.', 'BOOKING_NOT_FOUND');
  }

  return formatBooking(booking);
}

/**
 * Cancels a confirmed booking and releases active slot allocations atomically.
 *
 * @param {object} params
 * @param {string} params.bookingId - Booking ObjectId
 * @param {string} params.userId - Authenticated user ObjectId
 * @param {string | null} [params.reason=null] - Optional cancellation reason
 * @returns {Promise<object>}
 */
export async function cancelBooking({ bookingId, userId, reason = null }) {
  // 1. Initial read & policy checks outside transaction
  const existingBooking = await Booking.findById(bookingId);

  if (!existingBooking || existingBooking.userId.toString() !== userId.toString()) {
    throw ApiError.notFound('Booking not found.', 'BOOKING_NOT_FOUND');
  }

  if (existingBooking.status === 'cancelled') {
    throw ApiError.conflict('This booking has already been cancelled.', 'BOOKING_ALREADY_CANCELLED');
  }

  if (existingBooking.status === 'completed') {
    throw ApiError.conflict('Completed bookings cannot be cancelled.', 'INVALID_BOOKING_TRANSITION');
  }

  if (existingBooking.status !== 'confirmed') {
    throw ApiError.conflict('Only confirmed bookings can be cancelled.', 'INVALID_BOOKING_TRANSITION');
  }

  // Reject cancellation if the reservation has already started
  if (existingBooking.startAt.getTime() <= Date.now()) {
    throw ApiError.conflict(
      'Bookings that have already started or passed cannot be cancelled.',
      'BOOKING_ALREADY_STARTED',
    );
  }

  // 2. Atomic cancellation and slot release inside a transaction
  const session = await mongoose.startSession();

  try {
    let updatedDoc;

    const executeWork = async () => {
      const booking = await Booking.findById(bookingId).session(session);

      if (!booking || booking.userId.toString() !== userId.toString()) {
        throw ApiError.notFound('Booking not found.', 'BOOKING_NOT_FOUND');
      }

      if (booking.status !== 'confirmed') {
        throw ApiError.conflict(
          'Booking cannot be cancelled because its status has changed.',
          'INVALID_BOOKING_TRANSITION',
        );
      }

      if (booking.startAt.getTime() <= Date.now()) {
        throw ApiError.conflict(
          'Bookings that have already started or passed cannot be cancelled.',
          'BOOKING_ALREADY_STARTED',
        );
      }

      // Mutate booking status and cancellation metadata
      booking.status = 'cancelled';
      booking.cancelledAt = new Date();
      booking.cancellationReason = typeof reason === 'string' && reason.trim() ? reason.trim() : null;

      await booking.save({ session });

      // Atomically delete active slot allocations
      await releaseBookingSlots(booking._id, session);

      updatedDoc = booking;
    };

    try {
      session.startTransaction();
      await executeWork();
      await session.commitTransaction();
    } catch (txError) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw txError;
    }

    await updatedDoc.populate('resourceId', 'name category location capacity slotDurationMinutes');
    return formatBooking(updatedDoc);
  } catch (error) {
    if (
      error.code === 20 ||
      (error.message && error.message.includes('Transaction numbers are only allowed on a replica set member or mongos'))
    ) {
      throw ApiError.serviceUnavailable(
        'Database transactions are unavailable. Booking cancellation requires a MongoDB replica set deployment.',
        'TRANSACTIONS_UNAVAILABLE',
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw ApiError.internal(
      'An unexpected error occurred while cancelling the booking.',
      'BOOKING_CANCELLATION_FAILED',
      error.message,
    );
  } finally {
    await session.endSession();
  }
}

/**
 * Reschedules a confirmed booking to a new time interval atomically.
 * Reallocates slots in a single transaction, preserving original slots if reallocation fails.
 *
 * @param {object} params
 * @param {string} params.bookingId - Booking ObjectId
 * @param {string} params.userId - Authenticated user ObjectId
 * @param {Date | string} params.startAt - New start instant
 * @param {Date | string} params.endAt - New end instant
 * @returns {Promise<{ booking: object, slots: object[], isUnchanged?: boolean }>}
 */
export async function rescheduleBooking({ bookingId, userId, startAt, endAt }) {
  const startDate = startAt instanceof Date ? startAt : new Date(startAt);
  const endDate = endAt instanceof Date ? endAt : new Date(endAt);

  // 1. Initial read & validation
  const existingBooking = await Booking.findById(bookingId);

  if (!existingBooking || existingBooking.userId.toString() !== userId.toString()) {
    throw ApiError.notFound('Booking not found.', 'BOOKING_NOT_FOUND');
  }

  if (existingBooking.status === 'cancelled') {
    throw ApiError.conflict('Cancelled bookings cannot be rescheduled.', 'INVALID_BOOKING_TRANSITION');
  }

  if (existingBooking.status === 'completed') {
    throw ApiError.conflict('Completed bookings cannot be rescheduled.', 'INVALID_BOOKING_TRANSITION');
  }

  if (existingBooking.status !== 'confirmed') {
    throw ApiError.conflict('Only confirmed bookings can be rescheduled.', 'INVALID_BOOKING_TRANSITION');
  }

  if (existingBooking.startAt.getTime() <= Date.now()) {
    throw ApiError.conflict(
      'Bookings that have already started or passed cannot be rescheduled.',
      'BOOKING_ALREADY_STARTED',
    );
  }

  // 2. Fetch and validate associated resource
  const resource = await Resource.findById(existingBooking.resourceId);

  if (!resource) {
    throw ApiError.notFound('Associated resource not found.', 'RESOURCE_NOT_FOUND');
  }

  if (resource.status !== 'active') {
    throw ApiError.badRequest(
      'This resource is currently inactive and cannot accept rescheduled reservations.',
      'RESOURCE_INACTIVE',
    );
  }

  // 3. Same-time check: Idempotent no-op if interval is unchanged
  if (
    startDate.getTime() === existingBooking.startAt.getTime() &&
    endDate.getTime() === existingBooking.endAt.getTime()
  ) {
    const existingSlots = await ResourceSlot.find({ bookingId: existingBooking._id }).sort({ slotStartAt: 1 });
    await existingBooking.populate('resourceId', 'name category location capacity slotDurationMinutes');

    return {
      booking: formatBooking(existingBooking),
      slots: existingSlots.map((s) => s.toSafeObject()),
      isUnchanged: true,
    };
  }

  // 4. Validate new interval alignment against resource schedule & slot duration
  const newRequiredSlots = calculateRequiredSlots(resource, startDate, endDate);

  // 5. Execute atomic reallocation inside a transaction
  const session = await mongoose.startSession();

  try {
    let result;

    const executeWork = async () => {
      // Re-verify current booking state inside the transaction
      const currentBooking = await Booking.findById(bookingId).session(session);

      if (!currentBooking || currentBooking.userId.toString() !== userId.toString()) {
        throw ApiError.notFound('Booking not found.', 'BOOKING_NOT_FOUND');
      }

      if (currentBooking.status !== 'confirmed') {
        throw ApiError.conflict(
          'Booking cannot be rescheduled because its status has changed.',
          'INVALID_BOOKING_TRANSITION',
        );
      }

      if (currentBooking.startAt.getTime() <= Date.now()) {
        throw ApiError.conflict(
          'Booking has already started and cannot be rescheduled.',
          'BOOKING_ALREADY_STARTED',
        );
      }

      // Check for maintenance conflicts on the new interval
      const maintenanceConflict = await MaintenanceBlock.findOne({
        resourceId: resource._id,
        startAt: { $lt: endDate },
        endAt: { $gt: startDate },
      }).session(session);

      if (maintenanceConflict) {
        throw ApiError.conflict(
          'The requested rescheduled time slot overlaps with a scheduled maintenance blackout period.',
          'MAINTENANCE_CONFLICT',
        );
      }

      // Check conflicting active bookings on new interval, strictly excluding this booking
      const bookingConflict = await Booking.findOne({
        resourceId: resource._id,
        _id: { $ne: currentBooking._id },
        status: { $in: ['confirmed', 'completed'] },
        startAt: { $lt: endDate },
        endAt: { $gt: startDate },
      }).session(session);

      if (bookingConflict) {
        throw ApiError.conflict(
          'The requested rescheduled time slot conflicts with an existing confirmed booking.',
          'BOOKING_CONFLICT',
        );
      }

      // Release old slot allocations belonging to this booking
      await ResourceSlot.deleteMany({ bookingId: currentBooking._id }, { session });

      // Create new slot allocations
      const newSlotDocs = newRequiredSlots.map((slot) => ({
        resourceId: resource._id,
        slotStartAt: slot.slotStartAt,
        slotEndAt: slot.slotEndAt,
        bookingId: currentBooking._id,
      }));

      // insertMany with unique index compound constraint { resourceId: 1, slotStartAt: 1 }
      const createdSlots = await ResourceSlot.insertMany(newSlotDocs, { session });

      // Update booking interval
      currentBooking.startAt = startDate;
      currentBooking.endAt = endDate;
      await currentBooking.save({ session });

      await currentBooking.populate('resourceId', 'name category location capacity slotDurationMinutes');

      result = {
        booking: formatBooking(currentBooking),
        slots: createdSlots.map((s) => s.toSafeObject()),
        isUnchanged: false,
      };
    };

    try {
      session.startTransaction();
      await executeWork();
      await session.commitTransaction();
    } catch (txError) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw txError;
    }

    return result;
  } catch (error) {
    if (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000)) {
      throw ApiError.conflict(
        'One or more requested rescheduled time slots have already been reserved by a concurrent booking.',
        'BOOKING_CONFLICT',
      );
    }

    if (
      error.code === 20 ||
      (error.message && error.message.includes('Transaction numbers are only allowed on a replica set member or mongos'))
    ) {
      throw ApiError.serviceUnavailable(
        'Database transactions are unavailable. Rescheduling requires a MongoDB replica set deployment.',
        'TRANSACTIONS_UNAVAILABLE',
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw ApiError.internal(
      'An unexpected error occurred while rescheduling the booking.',
      'BOOKING_RESCHEDULING_FAILED',
      error.message,
    );
  } finally {
    await session.endSession();
  }
}

/**
 * Retrieves a paginated list of bookings for administrative inspection.
 * Supports composable filtering by status, resourceId, userId, category, and date range.
 *
 * @param {object} queryOptions - Validated administrative query parameters
 * @returns {Promise<{ bookings: object[], pagination: object }>}
 */
export async function listAdminBookings(queryOptions = {}) {
  const {
    page = 1,
    limit = 20,
    status = null,
    resourceId = null,
    userId = null,
    category = null,
    fromDate = null,
    toDate = null,
    sortBy = 'startAt',
    sortOrder = -1,
  } = queryOptions;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (userId) {
    query.userId = userId;
  }

  if (fromDate || toDate) {
    query.startAt = {};
    if (fromDate) {
      query.startAt.$gte = fromDate;
    }
    if (toDate) {
      query.startAt.$lte = toDate;
    }
  }

  // Handle category filter and composability with resourceId
  if (category) {
    const matchingResourceIds = await Resource.find({ category }).distinct('_id');
    if (resourceId) {
      const isMatched = matchingResourceIds.some((id) => id.toString() === resourceId.toString());
      if (!isMatched) {
        // Specified resource does not match requested category filter
        return {
          bookings: [],
          pagination: {
            page,
            limit,
            totalItems: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
      query.resourceId = resourceId;
    } else {
      query.resourceId = { $in: matchingResourceIds };
    }
  } else if (resourceId) {
    query.resourceId = resourceId;
  }

  const skip = (page - 1) * limit;

  // Deterministic sorting with secondary sort key on _id
  const sort = { [sortBy]: sortOrder, _id: -1 };

  const [bookings, totalItems] = await Promise.all([
    Booking.find(query)
      .populate('userId', 'name email')
      .populate('resourceId', 'name category location capacity slotDurationMinutes description')
      .populate('cancelledBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    bookings: bookings.map(formatBooking),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Controlled administrative booking cancellation with transactional slot release.
 *
 * Enforces:
 * 1. Booking existence check (404 if not found).
 * 2. Status policy: cancellable only when status is 'confirmed'.
 * 3. Prevention of repeated cancellations or invalid transitions.
 * 4. Audit traceability: records cancelledBy (admin user id), cancelledAt, and optional reason.
 * 5. Atomic release of associated ResourceSlots in a MongoDB transaction.
 *
 * @param {object} params
 * @param {string} params.bookingId - Target booking ObjectId
 * @param {string} params.adminUserId - Authenticated administrator ObjectId
 * @param {string | null} [params.reason=null] - Administrative cancellation reason
 * @returns {Promise<object>}
 */
export async function cancelAdminBooking({ bookingId, adminUserId, reason = null }) {
  // 1. Initial read & validation
  const existingBooking = await Booking.findById(bookingId);

  if (!existingBooking) {
    throw ApiError.notFound('Booking not found.', 'BOOKING_NOT_FOUND');
  }

  if (existingBooking.status === 'cancelled') {
    throw ApiError.conflict('This booking has already been cancelled.', 'BOOKING_ALREADY_CANCELLED');
  }

  if (existingBooking.status === 'completed') {
    throw ApiError.conflict('Completed bookings cannot be cancelled.', 'INVALID_BOOKING_TRANSITION');
  }

  if (existingBooking.status !== 'confirmed') {
    throw ApiError.conflict('Only confirmed bookings can be cancelled.', 'INVALID_BOOKING_TRANSITION');
  }

  if (existingBooking.endAt.getTime() <= Date.now()) {
    throw ApiError.conflict('Past or completed bookings cannot be cancelled.', 'INVALID_BOOKING_TRANSITION');
  }

  // 2. Atomic cancellation and slot release inside a transaction
  const session = await mongoose.startSession();

  try {
    let updatedDoc;

    const executeWork = async (activeSession) => {
      const sessionOptions = activeSession ? { session: activeSession } : {};
      const booking = await Booking.findById(bookingId, null, sessionOptions);

      if (!booking) {
        throw ApiError.notFound('Booking not found.', 'BOOKING_NOT_FOUND');
      }

      if (booking.status !== 'confirmed') {
        throw ApiError.conflict(
          'Booking cannot be cancelled because its status has changed.',
          'INVALID_BOOKING_TRANSITION',
        );
      }

      if (booking.endAt.getTime() <= Date.now()) {
        throw ApiError.conflict(
          'Past or completed bookings cannot be cancelled.',
          'INVALID_BOOKING_TRANSITION',
        );
      }

      // Record administrative cancellation metadata
      booking.status = 'cancelled';
      booking.cancelledAt = new Date();
      booking.cancelledBy = adminUserId;
      booking.cancellationReason = typeof reason === 'string' && reason.trim()
        ? reason.trim()
        : 'Cancelled by administrator';

      if (activeSession) {
        await booking.save({ session: activeSession });
      } else {
        await booking.save();
      }

      // Atomically release active slot allocations belonging to this booking
      await releaseBookingSlots(booking._id, activeSession);

      updatedDoc = booking;
    };

    try {
      session.startTransaction();
      await executeWork(session);
      await session.commitTransaction();
    } catch (txError) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      // Handle standalone MongoDB without replica set transaction support gracefully
      if (
        txError.code === 20 ||
        (txError.message && txError.message.includes('Transaction numbers are only allowed on a replica set member or mongos'))
      ) {
        await executeWork(null);
      } else {
        throw txError;
      }
    }

    await updatedDoc.populate([
      { path: 'userId', select: 'name email' },
      { path: 'resourceId', select: 'name category location capacity slotDurationMinutes description' },
      { path: 'cancelledBy', select: 'name email' },
    ]);

    return formatBooking(updatedDoc);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw ApiError.internal(
      'An unexpected error occurred while cancelling the booking.',
      'BOOKING_CANCELLATION_FAILED',
      error.message,
    );
  } finally {
    await session.endSession();
  }
}

export {
  allocateBookingWithSlots,
  releaseBookingSlots,
  calculateRequiredSlots,
};

export default {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  listAdminBookings,
  cancelAdminBooking,
  formatBooking,
  allocateBookingWithSlots,
  releaseBookingSlots,
  calculateRequiredSlots,
};
