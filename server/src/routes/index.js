import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';

const apiRouter = Router();

/**
 * Health & Diagnostic Routes
 * Mounts: /api/v1/health
 */
apiRouter.use('/health', healthRouter);

/**
 * Authentication & Session Management Routes
 * Mounts: /api/v1/auth
 */
apiRouter.use('/auth', authRouter);

/**
 * Reserved API Namespaces for Upcoming Prompts:
 *
 * Later implementation prompts will mount their route modules here:
 * - /api/v1/resources   -> Resource Discovery, Catalog & Details (Prompt 6)
 * - /api/v1/bookings    -> Booking Workflows, Slots, & Reservations (Prompt 7)
 * - /api/v1/admin       -> Administration, Maintenance & Oversight (Prompt 8)
 *
 * In accordance with project requirements, placeholder endpoints returning
 * fake or mock data are strictly omitted until the actual feature prompts.
 */

export default apiRouter;
