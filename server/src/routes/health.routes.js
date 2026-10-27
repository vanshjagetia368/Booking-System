import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Check service liveness and database readiness
 * @access  Public
 */
router.get('/', getHealth);

export default router;
