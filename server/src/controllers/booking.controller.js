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

export default {
  createBooking,
};
