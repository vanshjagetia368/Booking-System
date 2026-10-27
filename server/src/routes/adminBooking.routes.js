import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateBookingIdParam } from '../validators/booking.validator.js';
import {
  validateAdminBookingQuery,
  validateAdminCancelBooking,
} from '../validators/adminBooking.validator.js';
import {
  listAdminBookings,
  cancelAdminBooking,
} from '../controllers/adminBooking.controller.js';

const adminBookingRouter = Router();

// Apply administrative authentication and authorization across all admin booking routes
adminBookingRouter.use(authenticate, requireRole('admin'));

/**
 * GET /api/v1/admin/bookings
 * Retrieve paginated bookings across all users with administrative filters and safe resource/user details.
 */
adminBookingRouter.get('/', validateAdminBookingQuery, listAdminBookings);

/**
 * PATCH /api/v1/admin/bookings/:bookingId/cancel
 * Administrative cancellation of a confirmed booking with atomic slot release.
 */
adminBookingRouter.patch(
  '/:bookingId/cancel',
  validateBookingIdParam,
  validateAdminCancelBooking,
  cancelAdminBooking,
);

export default adminBookingRouter;
