/**
 * Error Handling Middleware
 * 错误处理中间件
 *
 * Global error handler for the application
 * 应用程序的全局错误处理器
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.util.js';
import { AuthError } from '../types/auth.types.js';

/**
 * Error handler middleware
 * 错误处理中间件
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    cfRay: req.headers['cf-ray'],
  });

  // Handle known authentication errors
  // 处理已知的认证错误
  if (err instanceof AuthError) {
    sendError(res, err.message, err.code, err.statusCode);
    return;
  }

  // Handle validation errors
  // 处理验证错误
  if (err.name === 'ValidationError') {
    sendError(res, err.message, 'VALIDATION_ERROR', 400);
    return;
  }

  // Handle JWT errors
  // 处理 JWT 错误
  if (err.name === 'JsonWebTokenError') {
    sendError(res, '无效的令牌', 'INVALID_TOKEN', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, '令牌已过期', 'TOKEN_EXPIRED', 401);
    return;
  }

  // Handle database errors
  // 处理数据库错误
  if (err.name === 'DatabaseError') {
    sendError(
      res,
      '数据库错误，请稍后重试',
      'DATABASE_ERROR',
      500,
      process.env.NODE_ENV === 'development' ? err.message : undefined
    );
    return;
  }

  // Handle other errors
  // 处理其他错误
  const statusCode = (err as any).statusCode || 500;
  const message = (err as any).message || '服务器内部错误';

  sendError(
    res,
    message,
    'INTERNAL_ERROR',
    statusCode,
    process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack,
    } : undefined
  );
}

/**
 * 404 Not Found handler
 * 404 未找到处理器
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `未找到路由: ${req.method} ${req.url}`, 'NOT_FOUND', 404);
}

/**
 * Async route handler wrapper to catch errors
 * 异步路由处理器包装器以捕获错误
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
