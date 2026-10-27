import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import resourceRouter from './resource.routes.js';
import adminResourceRouter from './adminResource.routes.js';
import bookingRouter from './booking.routes.js';

const apiRouter = Router();

/**
 * Health & Diagnostic Routes
 * Mounts: /api/v1/health
 */
apiRouter.use('/health', healthRouter);

/**
 * Authentication & Session Management Routes
 * Mounts: /api/v1/auth
 */
apiRouter.use('/auth', authRouter);

/**
 * Resource Discovery & Management Routes
 * Mounts: /api/v1/resources
 */
apiRouter.use('/resources', resourceRouter);

/**
 * Administrative Resource Management Routes
 * Mounts: /api/v1/admin/resources
 */
apiRouter.use('/admin/resources', adminResourceRouter);

/**
 * Booking Creation & Reservation Management Routes
 * Mounts: /api/v1/bookings
 */
apiRouter.use('/bookings', bookingRouter);

export default apiRouter;

