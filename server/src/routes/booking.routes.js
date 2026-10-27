import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validateCreateBooking } from '../validators/booking.validator.js';
import { createBooking } from '../controllers/booking.controller.js';

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

export default bookingRouter;
