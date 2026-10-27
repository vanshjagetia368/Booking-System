import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as bookingService from '../services/booking.service.js';

/**
 * Authenticated: Create a new reservation with atomic slot allocation.
 * POST /api/v1/bookings
 */
export const createBooking = asyncHandler(async (req, res) => {
  const { resourceId, startAt, endAt, notes } = req.validatedBody;
  const userId = req.userId; // Securely extracted by authenticate middleware

  const result = await bookingService.createBooking({
    userId,
    resourceId,
    startAt,
    endAt,
    notes,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Booking created successfully.',
    data: {
      booking: result.booking,
      slots: result.slots,
    },
  });
});

/**
 * Authenticated: Retrieve paginated booking history for the current user.
 * GET /api/v1/bookings/my
 */
export const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const queryOptions = req.validatedQuery;

  const result = await bookingService.getUserBookings({
    userId,
    queryOptions,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'User bookings retrieved successfully.',
    data: {
      bookings: result.bookings,
    },
    meta: result.pagination,
  });
});

/**
 * Authenticated: Retrieve details for a specific booking owned by the user.
 * GET /api/v1/bookings/:bookingId
 */
export const getBookingById = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.userId;

  const booking = await bookingService.getBookingById({
    bookingId,
    userId,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Booking details retrieved successfully.',
    data: {
      booking,
    },
  });
});

/**
 * Authenticated: Cancel a confirmed booking and release slot allocations.
 * PATCH /api/v1/bookings/:bookingId/cancel
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.userId;
  const reason = req.validatedBody?.reason || null;

  const booking = await bookingService.cancelBooking({
    bookingId,
    userId,
    reason,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Booking cancelled successfully.',
    data: {
      booking,
    },
  });
});

/**
 * Authenticated: Reschedule a confirmed booking to a new time interval.
 * PATCH /api/v1/bookings/:bookingId/reschedule
 */
export const rescheduleBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.userId;
  const { startAt, endAt } = req.validatedBody;

  const result = await bookingService.rescheduleBooking({
    bookingId,
    userId,
    startAt,
    endAt,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: result.isUnchanged
      ? 'Booking schedule is unchanged.'
      : 'Booking rescheduled successfully.',
    data: {
      booking: result.booking,
      slots: result.slots,
    },
  });
});

export default {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
};
