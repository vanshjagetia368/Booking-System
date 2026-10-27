import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  listAdminResources,
  getAdminResourceById,
} from '../controllers/resource.controller.js';
import {
  validateAdminQuery,
  validateResourceIdParam,
} from '../validators/resource.validator.js';

const adminResourceRouter = Router();

// Apply administrative authentication and authorization across all admin resource routes
adminResourceRouter.use(authenticate, requireRole('admin'));

/**
 * GET /api/v1/admin/resources
 * Retrieve administrative resource inventory (including active and inactive).
 */
adminResourceRouter.get('/', validateAdminQuery, listAdminResources);

/**
 * GET /api/v1/admin/resources/:resourceId
 * Retrieve administrative resource details (including inactive).
 */
adminResourceRouter.get('/:resourceId', validateResourceIdParam, getAdminResourceById);

export default adminResourceRouter;
