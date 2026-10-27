import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  listAdminResources,
  getAdminResourceById,
  createResource,
  updateResource,
  updateResourceStatus,
} from '../controllers/resource.controller.js';
import {
  createMaintenanceBlock,
  listMaintenanceBlocks,
  deleteMaintenanceBlock,
} from '../controllers/maintenance.controller.js';
import {
  validateAdminQuery,
  validateResourceIdParam,
  validateCreateResource,
  validateUpdateResource,
  validateUpdateStatus,
} from '../validators/resource.validator.js';
import {
  validateCreateMaintenanceBlock,
  validateListMaintenanceQuery,
  validateMaintenanceIdParam,
} from '../validators/maintenance.validator.js';

const adminResourceRouter = Router();

// Apply administrative authentication and authorization across all admin resource routes
adminResourceRouter.use(authenticate, requireRole('admin'));

/**
 * GET /api/v1/admin/resources
 * Retrieve administrative resource inventory (including active and inactive).
 */
adminResourceRouter.get('/', validateAdminQuery, listAdminResources);

/**
 * POST /api/v1/admin/resources
 * Administrative resource creation.
 */
adminResourceRouter.post('/', validateCreateResource, createResource);

/**
 * GET /api/v1/admin/resources/:resourceId
 * Retrieve administrative resource details (including inactive).
 */
adminResourceRouter.get('/:resourceId', validateResourceIdParam, getAdminResourceById);

/**
 * PATCH /api/v1/admin/resources/:resourceId
 * Update resource details.
 */
adminResourceRouter.patch(
  '/:resourceId',
  validateResourceIdParam,
  validateUpdateResource,
  updateResource,
);

/**
 * PATCH /api/v1/admin/resources/:resourceId/status
 * Activate or deactivate a resource.
 */
adminResourceRouter.patch(
  '/:resourceId/status',
  validateResourceIdParam,
  validateUpdateStatus,
  updateResourceStatus,
);

/**
 * POST /api/v1/admin/resources/:resourceId/maintenance
 * Create a maintenance blackout period for a resource.
 */
adminResourceRouter.post(
  '/:resourceId/maintenance',
  validateResourceIdParam,
  validateCreateMaintenanceBlock,
  createMaintenanceBlock,
);

/**
 * GET /api/v1/admin/resources/:resourceId/maintenance
 * Retrieve paginated maintenance blocks for a resource.
 */
adminResourceRouter.get(
  '/:resourceId/maintenance',
  validateResourceIdParam,
  validateListMaintenanceQuery,
  listMaintenanceBlocks,
);

/**
 * DELETE /api/v1/admin/resources/:resourceId/maintenance/:maintenanceId
 * Scoped route to delete a maintenance block for a resource.
 */
adminResourceRouter.delete(
  '/:resourceId/maintenance/:maintenanceId',
  validateResourceIdParam,
  validateMaintenanceIdParam,
  deleteMaintenanceBlock,
);

export default adminResourceRouter;
