import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account and establish session
 * @access  Public
 */
router.post('/register', validate({ body: validateRegister }), asyncHandler(register));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user credentials and establish session
 * @access  Public
 */
router.post('/login', validate({ body: validateLogin }), asyncHandler(login));

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clear authentication cookie and terminate session
 * @access  Public / Authenticated
 */
router.post('/logout', logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Retrieve profile of currently authenticated user
 * @access  Authenticated
 */
router.get('/me', authenticate, getMe);

export default router;
