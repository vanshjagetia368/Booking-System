import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  listPublicResources,
  getPublicResourceById,
  getResourceAvailability,
  createResource,
  updateResource,
  updateResourceStatus,
} from '../controllers/resource.controller.js';
import {
  validateCreateResource,
  validateUpdateResource,
  validateUpdateStatus,
  validateResourceIdParam,
  validatePublicQuery,
  validateAvailabilityQuery,
} from '../validators/resource.validator.js';

const resourceRouter = Router();

/**
 * Public Discovery Endpoints
 */

// List active resources with query filters & pagination
resourceRouter.get('/', validatePublicQuery, listPublicResources);

// Get bookable slot availability for an active resource on a given date
resourceRouter.get(
  '/:resourceId/availability',
  validateAvailabilityQuery,
  getResourceAvailability,
);

// Get details of an active resource by ID
resourceRouter.get('/:resourceId', validateResourceIdParam, getPublicResourceById);

/**
 * Administrative Resource Management Endpoints
 * All require valid authentication and administrator role.
 */

// Create a new resource
resourceRouter.post(
  '/',
  authenticate,
  requireRole('admin'),
  validateCreateResource,
  createResource,
);

// Update resource details
resourceRouter.patch(
  '/:resourceId',
  authenticate,
  requireRole('admin'),
  validateResourceIdParam,
  validateUpdateResource,
  updateResource,
);

// Activate or deactivate a resource
resourceRouter.patch(
  '/:resourceId/status',
  authenticate,
  requireRole('admin'),
  validateResourceIdParam,
  validateUpdateStatus,
  updateResourceStatus,
);

export default resourceRouter;
