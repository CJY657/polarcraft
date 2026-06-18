/**
 * Role-Based Access Control Middleware
 * 基于角色的访问控制中间件
 *
 * Checks if user has required role
 * 检查用户是否具有所需角色
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/auth.types.js';
import { sendError } from '../utils/response.util.js';
import { logger } from '../utils/logger.js';

/**
 * Require specific role
 * 要求特定角色
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    // 检查用户是否已认证
    if (!req.user) {
      sendError(res, '未登录，请先登录', 'UNAUTHORIZED', 401);
      return;
    }

    // Check if user has required role
    // 检查用户是否具有所需角色
    if (!roles.includes(req.user.role)) {
      logger.warn(
        `User ${req.user.sub} attempted to access resource requiring roles: ${roles.join(', ')}`
      );
      sendError(res, '权限不足，无法访问', 'FORBIDDEN', 403);
      return;
    }

    next();
  };
}

/**
 * Require admin role
 * 要求管理员角色
 */
export const requireAdmin = requireRole('admin');

/**
 * Require user or admin role
 * 要求用户或管理员角色
 */
export const requireUser = requireRole('user', 'admin');
