/**
 * Routes Index
 * 路由索引
 *
 * Aggregates all routes and sets up middleware
 * 聚合所有路由并设置中间件
 */

import { Router, Request, Response, NextFunction } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import researchRoutes from './research.routes.js';
import profileRoutes from './profile.routes.js';
import courseRoutes from './course.routes.js';
import unitRoutes from './unit.routes.js';
import uploadRoutes from './upload.routes.js';
import notificationRoutes from './notification.routes.js';
import { setupResponseHelpers } from '../utils/response.util.js';
import { csrfToken } from '../middleware/csrf.middleware.js';
import { testConnection } from '../database/connection.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Setup response helpers for all routes
// 为所有路由设置响应辅助函数
router.use((req: Request, res: Response, next: NextFunction) => {
  setupResponseHelpers(res);
  next();
});

// CSRF token for all routes (generate new token for each request)
// 为所有路由设置 CSRF token（为每个请求生成新 token）
router.use(csrfToken);

// Health check endpoint
// 健康检查端点
router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();

  const healthStatus = {
    status: 'healthy' as 'healthy' | 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'down' as 'up' | 'down', latency: 0 },
      server: { status: 'up' as 'up' },
    },
  };

  // Check database connection
  // 检查数据库连接
  try {
    const dbStart = Date.now();
    const dbConnected = await testConnection();
    const dbLatency = Date.now() - dbStart;

    healthStatus.checks.database = {
      status: dbConnected ? 'up' : 'down',
      latency: dbLatency,
    };

    if (!dbConnected) {
      healthStatus.status = 'unhealthy';
    }
  } catch (error) {
    logger.error('Health check database error:', error);
    healthStatus.checks.database = { status: 'down', latency: 0 };
    healthStatus.status = 'unhealthy';
  }

  const responseTime = Date.now() - startTime;
  const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;

  res.status(httpStatus).json({
    success: healthStatus.status === 'healthy',
    data: healthStatus,
    meta: {
      responseTime: `${responseTime}ms`,
    },
  });
});

// API routes
// API 路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/research', researchRoutes);
router.use('/profile', profileRoutes);
router.use('/courses', courseRoutes);
router.use('/units', unitRoutes);
router.use('/upload', uploadRoutes);
router.use('/notifications', notificationRoutes);

export default router;
