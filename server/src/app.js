import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { env } from './config/env.js';
import requestLogger from './middleware/logger.js';
import notFoundHandler from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

/**
 * Creates and configures the Express application.
 *
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  // 1. Security Headers (lightweight baseline protection)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // 2. CORS configuration derived from environment settings
  const configuredOrigins = [
    env.clientUrl,
    env.clientOrigin,
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow server-to-server, curl, or tools with no origin header
        if (!origin) {
          return callback(null, true);
        }

        // Allow configured origins or matching localhost ports in non-production
        if (
          configuredOrigins.includes(origin) ||
          (!env.isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
        ) {
          return callback(null, true);
        }

        return callback(new Error(`CORS error: Origin '${origin}' is not allowed by policy.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    }),
  );

  // 3. Request body and cookie parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // 4. Request logging (excluding sensitive payloads/tokens)
  if (!env.isTest) {
    app.use(requestLogger);
  }

  // 5. Versioned API Routes (/api/v1)
  app.use('/api/v1', apiRouter);

  // 6. Catch-all for undefined routes
  app.use(notFoundHandler);

  // 7. Centralized Error Handling
  app.use(errorHandler);

  return app;
}

export default createApp;
