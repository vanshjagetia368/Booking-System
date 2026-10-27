import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import resourceRouter from './resource.routes.js';
import adminResourceRouter from './adminResource.routes.js';
import adminBookingRouter from './adminBooking.routes.js';
import adminMaintenanceRouter from './adminMaintenance.routes.js';
import adminAnalyticsRouter from './adminAnalytics.routes.js';
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
 * Administrative Booking Management Routes
 * Mounts: /api/v1/admin/bookings
 */
apiRouter.use('/admin/bookings', adminBookingRouter);

/**
 * Administrative Maintenance Management Routes
 * Mounts: /api/v1/admin/maintenance
 */
apiRouter.use('/admin/maintenance', adminMaintenanceRouter);

/**
 * Administrative Analytics & Summary Routes
 * Mounts: /api/v1/admin/analytics
 */
apiRouter.use('/admin/analytics', adminAnalyticsRouter);

/**
 * Booking Creation & Reservation Management Routes
 * Mounts: /api/v1/bookings
 */
apiRouter.use('/bookings', bookingRouter);

export default apiRouter;

