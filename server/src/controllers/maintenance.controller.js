import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as maintenanceService from '../services/maintenance.service.js';

/**
 * Admin: Create a new maintenance blackout period for a resource.
 * POST /api/v1/admin/resources/:resourceId/maintenance
 */
export const createMaintenanceBlock = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const { startAt, endAt, reason } = req.validatedBody;
  const adminUserId = req.userId;

  const maintenanceBlock = await maintenanceService.createMaintenanceBlock({
    resourceId,
    startAt,
    endAt,
    reason,
    adminUserId,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Maintenance block created successfully.',
    data: {
      maintenanceBlock,
    },
  });
});

/**
 * Admin: Retrieve paginated maintenance blocks for a resource.
 * GET /api/v1/admin/resources/:resourceId/maintenance
 */
export const listMaintenanceBlocks = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const queryOptions = req.validatedQuery;

  const result = await maintenanceService.listMaintenanceBlocks({
    resourceId,
    queryOptions,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Maintenance blocks retrieved successfully.',
    data: {
      maintenanceBlocks: result.maintenanceBlocks,
    },
    meta: result.pagination,
  });
});

/**
 * Admin: Delete a maintenance blackout period.
 * DELETE /api/v1/admin/maintenance/:maintenanceId
 * (Also supports DELETE /api/v1/admin/resources/:resourceId/maintenance/:maintenanceId)
 */
export const deleteMaintenanceBlock = asyncHandler(async (req, res) => {
  const { maintenanceId, resourceId } = req.params;

  const maintenanceBlock = await maintenanceService.deleteMaintenanceBlock({
    maintenanceId,
    resourceId: resourceId || null,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Maintenance block deleted successfully.',
    data: {
      maintenanceBlock,
    },
  });
});

export default {
  createMaintenanceBlock,
  listMaintenanceBlocks,
  deleteMaintenanceBlock,
};
