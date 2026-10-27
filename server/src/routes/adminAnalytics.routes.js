import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { getAdminSummary } from '../controllers/adminAnalytics.controller.js';

const adminAnalyticsRouter = Router();

// Apply administrative authentication and authorization across all analytics routes
adminAnalyticsRouter.use(authenticate, requireRole('admin'));

/**
 * GET /api/v1/admin/analytics/summary
 * Retrieve aggregate operational statistics (resources, bookings, maintenance, users).
 */
adminAnalyticsRouter.get('/summary', getAdminSummary);

export default adminAnalyticsRouter;
