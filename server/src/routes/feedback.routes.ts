import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { feedbackRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateCreateFeedback } from '../middleware/validation.middleware.js';

const router = Router();

/**
 * @route   POST /api/feedback
 * @desc    Submit feedback about experiments or the platform
 * @access  Public (optional auth)
 */
router.post('/', feedbackRateLimiter, optionalAuth, validateCreateFeedback, FeedbackController.create);

export default router;
