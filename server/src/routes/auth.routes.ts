/**
 * Authentication Routes
 * 认证路由
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from '../middleware/validation.middleware.js';
import {
  registerRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  captchaRateLimiter,
  tokenRefreshRateLimiter,
} from '../middleware/rate-limit.middleware.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  registerRateLimiter,
  validateRegister,
  AuthController.register
);

/**
 * @route   GET /api/auth/salt/:username
 * @desc    Get user salt for client-side hashing
 * @access  Public
 */
router.get('/salt/:username', authRateLimiter, AuthController.getUserSalt);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validateLogin,
  AuthController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (but requires valid refresh token)
 */
router.post(
  '/refresh',
  tokenRefreshRateLimiter,
  AuthController.refresh
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validateForgotPassword,
  AuthController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validateResetPassword,
  AuthController.resetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, AuthController.me);

/**
 * @route   GET /api/auth/captcha
 * @desc    Get CAPTCHA
 * @access  Public
 */
router.get('/captcha', captchaRateLimiter, AuthController.getCaptcha);

/**
 * @route   POST /api/auth/verify-captcha
 * @desc    Verify CAPTCHA
 * @access  Public
 */
router.post('/verify-captcha', captchaRateLimiter, AuthController.verifyCaptcha);

export default router;
