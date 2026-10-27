import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as resourceService from '../services/resource.service.js';

/**
 * Public: List active resources with optional filters and pagination.
 * GET /api/v1/resources
 */
export const listPublicResources = asyncHandler(async (req, res) => {
  const result = await resourceService.listPublicResources(req.validatedQuery);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Active resources retrieved successfully.',
    data: {
      resources: result.resources,
    },
    meta: result.pagination,
  });
});

/**
 * Public: Get details of an active resource by ID.
 * GET /api/v1/resources/:resourceId
 */
export const getPublicResourceById = asyncHandler(async (req, res) => {
  const resource = await resourceService.getPublicResourceById(req.params.resourceId);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Resource retrieved successfully.',
    data: {
      resource,
    },
  });
});

/**
 * Admin: Create a new resource.
 * POST /api/v1/resources
 */
export const createResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.createResource(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Resource created successfully.',
    data: {
      resource,
    },
  });
});

/**
 * Admin: Update resource fields.
 * PATCH /api/v1/resources/:resourceId
 */
export const updateResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.updateResource(req.params.resourceId, req.body);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Resource updated successfully.',
    data: {
      resource,
    },
  });
});

/**
 * Admin: Activate or deactivate a resource.
 * PATCH /api/v1/resources/:resourceId/status
 */
export const updateResourceStatus = asyncHandler(async (req, res) => {
  const resource = await resourceService.updateResourceStatus(
    req.params.resourceId,
    req.body.status,
  );

  return sendSuccess(res, {
    statusCode: 200,
    message: `Resource successfully ${resource.status === 'active' ? 'activated' : 'deactivated'}.`,
    data: {
      resource,
    },
  });
});

/**
 * Admin: List resources including active and inactive with management filters.
 * GET /api/v1/admin/resources
 */
export const listAdminResources = asyncHandler(async (req, res) => {
  const result = await resourceService.listAdminResources(req.validatedQuery);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Administrative resource inventory retrieved successfully.',
    data: {
      resources: result.resources,
    },
    meta: result.pagination,
  });
});

/**
 * Admin: Retrieve a resource by ID for administrative inspection (including inactive).
 * GET /api/v1/admin/resources/:resourceId
 */
export const getAdminResourceById = asyncHandler(async (req, res) => {
  const resource = await resourceService.getAdminResourceById(req.params.resourceId);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Administrative resource details retrieved successfully.',
    data: {
      resource,
    },
  });
});

export default {
  listPublicResources,
  getPublicResourceById,
  createResource,
  updateResource,
  updateResourceStatus,
  listAdminResources,
  getAdminResourceById,
};
