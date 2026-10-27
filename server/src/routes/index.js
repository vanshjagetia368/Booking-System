import { Router } from 'express';
import healthRouter from './health.routes.js';

const apiRouter = Router();

/**
 * Health & Diagnostic Routes
 * Mounts: /api/v1/health
 */
apiRouter.use('/health', healthRouter);

/**
 * Reserved API Namespaces for Upcoming Prompts:
 *
 * Later implementation prompts will mount their route modules here:
 * - /api/v1/auth        -> Authentication & Session Management (Prompt 4)
 * - /api/v1/resources   -> Resource Discovery, Catalog & Details (Prompt 5)
 * - /api/v1/bookings    -> Booking Workflows, Slots, & Reservations (Prompt 6)
 * - /api/v1/admin       -> Administration, Maintenance & Oversight (Prompt 7)
 *
 * In accordance with project requirements, placeholder endpoints returning
 * fake or mock data are strictly omitted until the actual feature prompts.
 */

export default apiRouter;
