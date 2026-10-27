import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as bookingService from '../services/booking.service.js';

/**
 * Admin: Retrieve paginated bookings across all users with administrative filters.
 * GET /api/v1/admin/bookings
 */
export const listAdminBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.listAdminBookings(req.validatedQuery);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Administrative bookings retrieved successfully.',
    data: {
      bookings: result.bookings,
    },
    meta: result.pagination,
  });
});

/**
 * Admin: Controlled administrative cancellation of a confirmed booking with atomic slot release.
 * PATCH /api/v1/admin/bookings/:bookingId/cancel
 */
export const cancelAdminBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const adminUserId = req.userId;
  const reason = req.validatedBody?.reason || null;

  const booking = await bookingService.cancelAdminBooking({
    bookingId,
    adminUserId,
    reason,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Booking cancelled successfully by administrator.',
    data: {
      booking,
    },
  });
});

export default {
  listAdminBookings,
  cancelAdminBooking,
};
