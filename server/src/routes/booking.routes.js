import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  validateBookingIdParam,
  validateCreateBooking,
  validateBookingHistoryQuery,
  validateCancelBooking,
  validateRescheduleBooking,
} from '../validators/booking.validator.js';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
} from '../controllers/booking.controller.js';

const bookingRouter = Router();

/**
 * All booking endpoints require authentication.
 */
bookingRouter.use(authenticate);

/**
 * POST /api/v1/bookings
 * Create a new reservation with transaction-safe fixed-slot allocation.
 */
bookingRouter.post('/', validateCreateBooking, createBooking);

/**
 * GET /api/v1/bookings/my
 * Retrieve paginated booking history for the authenticated user.
 * Note: Declared before /:bookingId route to prevent route parameter collision.
 */
bookingRouter.get('/my', validateBookingHistoryQuery, getUserBookings);

/**
 * GET /api/v1/bookings/:bookingId
 * Retrieve detailed information for a specific booking owned by the user.
 */
bookingRouter.get('/:bookingId', validateBookingIdParam, getBookingById);

/**
 * PATCH /api/v1/bookings/:bookingId/cancel
 * Cancel a confirmed booking and atomically release its allocated slots.
 */
bookingRouter.patch('/:bookingId/cancel', validateBookingIdParam, validateCancelBooking, cancelBooking);

/**
 * PATCH /api/v1/bookings/:bookingId/reschedule
 * Reschedule a confirmed booking to a new time interval with atomic reallocation.
 */
bookingRouter.patch('/:bookingId/reschedule', validateBookingIdParam, validateRescheduleBooking, rescheduleBooking);

export default bookingRouter;
