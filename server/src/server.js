import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

let server = null;
let isShuttingDown = false;

/**
 * Gracefully terminates the HTTP server and database connection.
 *
 * @param {string} signal - The triggering termination signal (e.g. SIGINT, SIGTERM)
 */
async function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[Process] Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new HTTP requests
  if (server) {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error('[Process] Error closing HTTP server:', err.message);
        } else {
          console.log('[Process] HTTP server closed.');
        }
        resolve();
      });
    });
  }

  // Disconnect from MongoDB
  try {
    await disconnectDatabase();
  } catch (err) {
    console.error('[Process] Error closing database connection:', err.message);
  }

  console.log('[Process] Graceful shutdown complete. Exiting.');
  process.exit(0);
}

/**
 * Initializes database connectivity and starts the Express HTTP server.
 */
async function startServer() {
  console.log(`[Process] Starting Smart Resource Booking System backend in ${env.nodeEnv} mode...`);

  // 1. Establish database connection before accepting requests
  await connectDatabase(env.mongodbUri);

  // 2. Instantiate and mount Express application
  const app = createApp();

  // 3. Start listening on configured port
  server = app.listen(env.port, () => {
    console.log(`[Server] Smart Resource Booking API listening on http://localhost:${env.port}`);
    console.log(`[Server] Health check endpoint: http://localhost:${env.port}/api/v1/health`);
    console.log(`[Server] CORS configured for frontend at: ${env.clientUrl}`);
  });

  // 4. Register process shutdown signal listeners
  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  // 5. Handle unhandled rejections and uncaught exceptions
  process.on('unhandledRejection', (reason) => {
    console.error('[Process] Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[Process] Uncaught Exception:', error);
    handleShutdown('UNCAUGHT_EXCEPTION');
  });
}

// Start the server process
startServer().catch((error) => {
  console.error('[Process] Fatal startup error:', error.message);
  process.exit(1);
});

export default startServer;
