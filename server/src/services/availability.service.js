import { Resource } from '../models/Resource.js';
import { MaintenanceBlock } from '../models/MaintenanceBlock.js';
import { Booking } from '../models/Booking.js';
import { ResourceSlot } from '../models/ResourceSlot.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Canonical mapping from Date.getUTCDay() index (0 = Sunday) to day key.
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
 * Checks whether two half-open intervals [startA, endA) and [startB, endB) overlap.
 *
 * Invariant: Two intervals overlap if and only if:
 * startA < endB && endA > startB
 * Adjacent intervals (e.g. endA === startB) do not overlap.
 *
 * @param {Date | number} startA
 * @param {Date | number} endA
 * @param {Date | number} startB
 * @param {Date | number} endB
 * @returns {boolean}
 */
export function isIntervalOverlapping(startA, endA, startB, endB) {
  const sA = startA instanceof Date ? startA.getTime() : startA;
  const eA = endA instanceof Date ? endA.getTime() : endA;
  const sB = startB instanceof Date ? startB.getTime() : startB;
  const eB = endB instanceof Date ? endB.getTime() : endB;

  return sA < eB && eA > sB;
}

/**
 * Calculates candidate time slots and determines availability for an active resource on a given date.
 * Excludes past times, maintenance blocks, and existing confirmed/completed reservations or allocated slots.
 *
 * @param {string} resourceId - Resource ObjectId
 * @param {string} dateString - Target calendar date formatted as YYYY-MM-DD
 * @param {Date} [currentTime=new Date()] - Reference current instant for past-time evaluation
 * @returns {Promise<object>} Complete availability response structure
 */
export async function calculateResourceAvailability(resourceId, dateString, currentTime = new Date()) {
  // 1. Retrieve the active resource
  const resource = await Resource.findOne({ _id: resourceId, status: 'active' });

  if (!resource) {
    throw ApiError.notFound(
      'Resource not found or is currently unavailable.',
      'RESOURCE_NOT_FOUND',
    );
  }

  // 2. Parse calendar date components
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const anchorDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = DAY_INDEX_MAP[anchorDate.getUTCDay()];
  const schedule = resource.operatingHours?.[dayOfWeek];

  const timeZone = resource.timeZone || 'UTC';

  // 3. Handle closed days
  if (!schedule || !schedule.isOpen || !schedule.openTime || !schedule.closeTime) {
    return {
      resourceId: resource._id.toString(),
      resourceName: resource.name,
      date: dateString,
      timeZone,
      operatingHours: {
        isOpen: false,
        openTime: null,
        closeTime: null,
      },
      slotDurationMinutes: resource.slotDurationMinutes,
      slots: [],
      summary: {
        totalSlots: 0,
        availableSlots: 0,
        reservedSlots: 0,
        maintenanceSlots: 0,
        pastSlots: 0,
      },
    };
  }

  // 4. Resolve opening and closing instants in UTC
  const [openHourStr, openMinStr] = schedule.openTime.split(':');
  const [closeHourStr, closeMinStr] = schedule.closeTime.split(':');

  const dayStartInstant = new Date(Date.UTC(year, month - 1, day, Number(openHourStr), Number(openMinStr), 0, 0));
  const dayEndInstant = new Date(Date.UTC(year, month - 1, day, Number(closeHourStr), Number(closeMinStr), 0, 0));

  if (dayStartInstant >= dayEndInstant) {
    throw ApiError.internal(
      'Configured operating hours opening time must precede closing time.',
      'INVALID_SCHEDULE_CONFIGURATION',
    );
  }

  // 5. Generate candidate aligned slots [start, end)
  const durationMs = resource.slotDurationMinutes * 60 * 1000;
  const candidateSlots = [];

  let currentMs = dayStartInstant.getTime();
  const endLimitMs = dayEndInstant.getTime();

  while (currentMs + durationMs <= endLimitMs) {
    const slotStart = new Date(currentMs);
    const slotEnd = new Date(currentMs + durationMs);

    candidateSlots.push({
      startAt: slotStart,
      endAt: slotEnd,
    });

    currentMs += durationMs;
  }

  // 6. Query overlapping maintenance blocks, confirmed bookings, and allocated slots in a single batch
  const [maintenanceBlocks, confirmedBookings, allocatedSlots] = await Promise.all([
    MaintenanceBlock.find({
      resourceId: resource._id,
      startAt: { $lt: dayEndInstant },
      endAt: { $gt: dayStartInstant },
    }).lean(),

    Booking.find({
      resourceId: resource._id,
      status: { $in: ['confirmed', 'completed'] },
      startAt: { $lt: dayEndInstant },
      endAt: { $gt: dayStartInstant },
    }).lean(),

    ResourceSlot.find({
      resourceId: resource._id,
      slotStartAt: { $gte: dayStartInstant, $lt: dayEndInstant },
    }).lean(),
  ]);

  const allocatedSlotStartTimes = new Set(
    allocatedSlots.map((slot) => new Date(slot.slotStartAt).getTime()),
  );

  const nowMs = currentTime.getTime();

  // 7. Evaluate each candidate slot against rules and exclusions
  const evaluatedSlots = candidateSlots.map((candidate) => {
    const slotStartMs = candidate.startAt.getTime();
    const slotEndMs = candidate.endAt.getTime();

    // 7a. Past-time check: slots that have already started are not bookable
    if (slotStartMs <= nowMs) {
      return {
        startAt: candidate.startAt.toISOString(),
        endAt: candidate.endAt.toISOString(),
        available: false,
        reason: 'PAST_TIME',
      };
    }

    // 7b. Maintenance check: overlaps any active maintenance block
    const isMaintenance = maintenanceBlocks.some((block) => {
      const bStart = new Date(block.startAt).getTime();
      const bEnd = new Date(block.endAt).getTime();
      return isIntervalOverlapping(slotStartMs, slotEndMs, bStart, bEnd);
    });

    if (isMaintenance) {
      return {
        startAt: candidate.startAt.toISOString(),
        endAt: candidate.endAt.toISOString(),
        available: false,
        reason: 'MAINTENANCE',
      };
    }

    // 7c. Booking and Slot occupancy check:
    // Check if slotStartAt is allocated in ResourceSlots, or overlaps a confirmed/completed booking
    const isSlotAllocated = allocatedSlotStartTimes.has(slotStartMs);
    const isBookingOverlapping = confirmedBookings.some((booking) => {
      const bStart = new Date(booking.startAt).getTime();
      const bEnd = new Date(booking.endAt).getTime();
      return isIntervalOverlapping(slotStartMs, slotEndMs, bStart, bEnd);
    });

    if (isSlotAllocated || isBookingOverlapping) {
      return {
        startAt: candidate.startAt.toISOString(),
        endAt: candidate.endAt.toISOString(),
        available: false,
        reason: 'RESERVED',
      };
    }

    // 7d. Slot is free and bookable
    return {
      startAt: candidate.startAt.toISOString(),
      endAt: candidate.endAt.toISOString(),
      available: true,
      reason: null,
    };
  });

  // 8. Calculate summary statistics
  const totalSlots = evaluatedSlots.length;
  const availableSlots = evaluatedSlots.filter((s) => s.available).length;
  const reservedSlots = evaluatedSlots.filter((s) => s.reason === 'RESERVED').length;
  const maintenanceSlots = evaluatedSlots.filter((s) => s.reason === 'MAINTENANCE').length;
  const pastSlots = evaluatedSlots.filter((s) => s.reason === 'PAST_TIME').length;

  return {
    resourceId: resource._id.toString(),
    resourceName: resource.name,
    date: dateString,
    timeZone,
    operatingHours: {
      isOpen: true,
      openTime: schedule.openTime,
      closeTime: schedule.closeTime,
    },
    slotDurationMinutes: resource.slotDurationMinutes,
    slots: evaluatedSlots,
    summary: {
      totalSlots,
      availableSlots,
      reservedSlots,
      maintenanceSlots,
      pastSlots,
    },
  };
}

export default {
  isIntervalOverlapping,
  calculateResourceAvailability,
};
