import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as adminAnalyticsService from '../services/adminAnalytics.service.js';

/**
 * Admin: Retrieve lightweight operational statistics and aggregate metrics.
 * GET /api/v1/admin/analytics/summary
 */
export const getAdminSummary = asyncHandler(async (req, res) => {
  const summary = await adminAnalyticsService.getAdminSummary();

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Administrative analytics summary retrieved successfully.',
    data: {
      summary,
    },
  });
});

export default {
  getAdminSummary,
};
