/**
 * Stats Routes
 * 公开统计路由
 */

import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/stats/activity
 * @desc    Public learning activity (anonymized leaderboard)
 * @access  Public; a signed-in student additionally gets their own rank
 */
router.get('/activity', optionalAuth, StatsController.getPublicActivity);

export default router;
