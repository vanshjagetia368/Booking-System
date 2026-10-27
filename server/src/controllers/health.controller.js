import { getDatabaseState } from '../config/database.js';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/apiResponse.js';

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

  const statusCode = isHealthy ? 200 : 503;
  const message = isHealthy
    ? 'Smart Resource Booking API is operating normally.'
    : 'Smart Resource Booking API is operational, but the database connection is not ready.';

  return res.status(statusCode).json({
    success: isHealthy,
    message,
    data: responseData,
  });
}

export default {
  getHealth,
};
