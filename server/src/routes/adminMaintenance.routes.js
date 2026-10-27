import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateMaintenanceIdParam } from '../validators/maintenance.validator.js';
import { deleteMaintenanceBlock } from '../controllers/maintenance.controller.js';

const adminMaintenanceRouter = Router();

// Apply administrative authentication and authorization across all maintenance routes
adminMaintenanceRouter.use(authenticate, requireRole('admin'));

/**
 * DELETE /api/v1/admin/maintenance/:maintenanceId
 * Delete a maintenance blackout period by ID.
 */
adminMaintenanceRouter.delete(
  '/:maintenanceId',
  validateMaintenanceIdParam,
  deleteMaintenanceBlock,
);

export default adminMaintenanceRouter;
