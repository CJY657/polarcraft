/**
 * Quiz Routes
 * 测验路由
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param } from 'express-validator';
import type { Request, Response } from 'express';
import { QuizController } from '../controllers/quiz.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin, requireUser } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { sendError } from '../utils/response.util.js';

/**
 * Starting a quiz is cheap but draws randomness — limit per user.
 * 开始测验的开销不大但涉及随机抽题——按用户限流。
 */
const quizStartRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req.user?.sub ? `user:${req.user.sub}` : req.ip || 'unknown'),
  handler: (req: Request, res: Response) => {
    sendError(res, '开始测验过于频繁，请稍后再试', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/quiz/start
 * @desc    Draw a question set and open an attempt / 抽题并开启一次作答
 * @access  Logged-in users
 */
router.post('/start', requireUser, quizStartRateLimiter, QuizController.start);

/**
 * @route   POST /api/quiz/:attemptId/submit
 * @desc    Grade and persist an attempt / 评分并保存作答
 * @access  Attempt owner
 */
router.post(
  '/:attemptId/submit',
  requireUser,
  validate(
    param('attemptId').isUUID().withMessage('无效的作答编号'),
    body('answers').isArray({ max: 100 }).withMessage('answers 必须是数组'),
    body('answers.*')
      .custom((value) => value === null || (Number.isInteger(value) && value >= 0 && value <= 3))
      .withMessage('每个答案必须是 0-3 的整数或 null'),
  ),
  QuizController.submit,
);

/**
 * @route   GET /api/quiz/me
 * @desc    Current user's attempt history / 当前用户作答历史
 * @access  Logged-in users
 */
router.get('/me', requireUser, QuizController.getMyAttempts);

/**
 * @route   GET /api/quiz/admin/attempts
 * @desc    Per-student aggregated scores / 学生成绩聚合表
 * @access  Admin
 */
router.get('/admin/attempts', requireAdmin, QuizController.adminListAttempts);

/**
 * @route   GET /api/quiz/admin/stats
 * @desc    Overall quiz statistics / 测验整体统计
 * @access  Admin
 */
router.get('/admin/stats', requireAdmin, QuizController.adminStats);

export default router;
