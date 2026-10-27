import { getDatabaseState } from '../config/database.js';
import { env } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Health check endpoint controller.
 *
 * Distinguishes process liveness from database readiness without exposing
 * internal connection strings, credentials, or secrets.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function getHealth(req, res) {
  const dbState = getDatabaseState();
  const isHealthy = dbState.ready;

  const responseData = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'smart-resource-booking-api',
    environment: env.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      ready: dbState.ready,
      state: dbState.state,
    },
  };

  if (isHealthy) {
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Smart Resource Booking API is operating normally.',
      data: responseData,
    });
  }

  return sendError(res, {
    statusCode: 503,
    message: 'Smart Resource Booking API is operational, but the database connection is not ready.',
    code: 'DATABASE_UNAVAILABLE',
    data: responseData,
  });
}

export default {
  getHealth,
};
