import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { feedbackRateLimiter } from '../middleware/rate-limit.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { validateCreateFeedback } from '../middleware/validation.middleware.js';

const router = Router();

/**
 * @route   POST /api/feedback
 * @desc    Submit feedback about experiments or the platform
 * @access  Public, with user metadata attached when authenticated
 */
router.post('/', feedbackRateLimiter, optionalAuth, validateCreateFeedback, FeedbackController.create);

router.use(authenticate);

router.get('/', requireAdmin, FeedbackController.list);

export default router;
