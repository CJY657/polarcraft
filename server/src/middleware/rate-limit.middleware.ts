/**
 * Rate Limiting Middleware
 * 速率限制中间件
 *
 * Limits request frequency to prevent abuse
 * 限制请求频率以防止滥用
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { sendError } from '../utils/response.util.js';
import { Request, Response } from 'express';

/**
 * Get client IP address
 * 获取客户端 IP 地址
 */
function getClientIp(req: Request): string {
  return (req.ip || req.connection.remoteAddress || 'unknown').split(':')[0];
}

/**
 * Get rate limit key for authentication endpoints
 * 获取认证端点的速率限制键
 */
function getAuthRateLimitKey(req: Request): string {
  const ip = getClientIp(req);
  const username = req.body?.username || '';
  return `${ip}:${username}`;
}

/**
 * General API rate limiter
 * 通用 API 速率限制器
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'API 请求过于频繁，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: (req: Request, res: Response) => {
    sendError(res, 'API 请求过于频繁，请稍后再试', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

/**
 * Authentication rate limiter (strict)
 * 认证速率限制器（严格）
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '登录尝试次数过多，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getAuthRateLimitKey,
  handler: (req: Request, res: Response) => {
    sendError(res, '登录尝试次数过多，请稍后再试', 'RATE_LIMIT_EXCEEDED', 429);
  },
  skipSuccessfulRequests: false,
});

/**
 * Registration rate limiter
 * 注册速率限制器
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '注册次数过多，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: (req: Request, res: Response) => {
    sendError(res, '注册次数过多，请稍后再试', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

/**
 * Password reset rate limiter
 * 密码重置速率限制器
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '密码重置请求过多，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getAuthRateLimitKey,
  handler: (req: Request, res: Response) => {
    sendError(res, '密码重置请求过多，请稍后再试', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

/**
 * Feedback rate limiter
 * 反馈提交速率限制器
 */
export const feedbackRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '反馈提交过于频繁，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: (req: Request, res: Response) => {
    sendError(res, '反馈提交过于频繁，请稍后再试', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

/**
 * Discussion comment rate limiter
 * 讨论留言速率限制器
 */
export const discussionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '讨论留言提交过于频繁，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = req.user?.sub;
    return userId ? `user:${userId}` : getClientIp(req);
  },
  handler: (req: Request, res: Response) => {
    sendError(res, '讨论留言提交过于频繁，请稍后再试', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

/**
 * Research AI advisor rate limiter
 * 课题 AI 顾问速率限制器
 */
export const researchAgentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'AI 顾问请求过于频繁，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = req.user?.sub;
    return userId ? `user:${userId}` : getClientIp(req);
  },
  handler: (req: Request, res: Response) => {
    sendError(res, 'AI 顾问请求过于频繁，请稍后再试', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

/**
 * Research leadership nomination rate limiter
 * 课题组长转让提名限流
 */
export const leadershipTransferRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '组长转让提名过于频繁，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = req.user?.sub;
    return userId ? `user:${userId}` : getClientIp(req);
  },
  handler: (req: Request, res: Response) => {
    sendError(res, '组长转让提名过于频繁，请稍后再试', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

/**
 * CAPTCHA rate limiter
 * 验证码速率限制器
 */
export const captchaRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '验证码请求过于频繁',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: (req: Request, res: Response) => {
    sendError(res, '验证码请求过于频繁', 'RATE_LIMIT_EXCEEDED', 429);
  },
  skipFailedRequests: true,
});

/**
 * Token refresh rate limiter
 * Token 刷新速率限制器
 */
export const tokenRefreshRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Token 刷新过于频繁',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: (req: Request, res: Response) => {
    sendError(res, 'Token 刷新过于频繁', 'RATE_LIMIT_EXCEEDED', 429);
  },
});
