/**
 * User Controller
 * 用户控制器
 *
 * Handles user-related HTTP requests
 * 处理与用户相关的 HTTP 请求
 */

import { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { logger } from '../utils/logger.js';
import { createAuthCookieOptions } from '../utils/cookie-options.util.js';
import { PostHogAnalyticsError } from '../services/posthog.service.js';

export class UserController {
  /**
   * List users for admin management
   * 获取管理员用户列表
   */
  static listUsersForAdmin = asyncHandler(async (req: Request, res: Response) => {
    const search =
      typeof req.query.search === 'string' && req.query.search.trim()
        ? req.query.search.trim()
        : undefined;
    const role =
      req.query.role === 'user' || req.query.role === 'admin'
        ? req.query.role
        : undefined;
    const status =
      req.query.status === 'active' || req.query.status === 'inactive'
        ? req.query.status
        : undefined;
    const limit =
      typeof req.query.limit === 'string'
        ? Number.parseInt(req.query.limit, 10)
        : undefined;
    const offset =
      typeof req.query.offset === 'string'
        ? Number.parseInt(req.query.offset, 10)
        : undefined;
    const sortBy =
      req.query.sort_by === 'created_at' || req.query.sort_by === 'last_login_at'
        ? req.query.sort_by
        : undefined;
    const sortOrder =
      req.query.sort_order === 'asc' || req.query.sort_order === 'desc'
        ? req.query.sort_order
        : undefined;

    const result = await UserService.listUsersForAdmin({
      search,
      role,
      status,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    res.success(result);
  });

  /**
   * Get a single user's detail for admin management
   * 获取管理员用户详情
   */
  static getUserDetailForAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.getUserDetailForAdmin(req.params.userId);
    res.success(result);
  });

  /**
   * Get admin user statistics
   * 获取管理员用户统计
   */
  static getUserStatsForAdmin = asyncHandler(async (_req: Request, res: Response) => {
    const result = await UserService.getUserStatsForAdmin();
    res.success(result);
  });

  /**
   * Get a single user's PostHog analytics for admins
   * 管理员查询单个用户的 PostHog 行为数据
   */
  static getPostHogAnalyticsForAdmin = asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const result = await UserService.getPostHogAnalyticsForAdmin(req.params.userId);
        res.success(result);
      } catch (error) {
        if (error instanceof PostHogAnalyticsError) {
          res.error(error.message, error.code, error.statusCode);
          return;
        }

        throw error;
      }
    }
  );

  /**
   * Get user profile
   * 获取用户资料
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await UserService.getProfile(req.user!.sub);
    if (!profile) {
      res.error('用户未找到', 'USER_NOT_FOUND', 404);
      return;
    }

    res.success(profile);
  });

  /**
   * Update user profile
 * 更新用户资料
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const { username, real_name, email, avatar_url } = req.body;
    const profile = await UserService.updateProfile(req.user!.sub, {
      username,
      real_name,
      email,
      avatar_url,
    });

    logger.info(`Profile updated for user: ${req.user!.username}`);
    res.success(profile, '资料更新成功');
  });

  /**
   * Change password
 * 修改密码
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword, clientSalt } = req.body;
    await UserService.changePassword(req.user!.sub, {
      currentPassword,
      newPassword,
      clientSalt,
    });

    logger.info(`Password changed for user: ${req.user!.username}`);
    res.success(null, '密码修改成功，请重新登录');
  });

  /**
   * Get user sessions
 * 获取用户会话
   */
  static getSessions = asyncHandler(async (req: Request, res: Response) => {
    const sessions = await UserService.getSessions(req.user!.sub, req.sessionId);
    res.success(sessions);
  });

  /**
   * Logout from a specific session
 * 从特定会话登出
   */
  static logoutFromSession = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    await UserService.logoutFromSession(req.user!.sub, sessionId);

    logger.info(`User ${req.user!.username} logged out from session: ${sessionId}`);
    res.success(null, '已从该设备登出');
  });

  /**
   * Logout from all sessions
 * 从所有会话登出
   */
  static logoutFromAllSessions = asyncHandler(async (req: Request, res: Response) => {
    const count = await UserService.logoutFromAllSessions(req.user!.sub);

    // Clear refresh token cookie
    // 清除刷新令牌 cookie
    res.clearCookie('refresh_token', createAuthCookieOptions());

    logger.info(`User ${req.user!.username} logged out from all sessions (${count} sessions)`);
    res.success(null, '已从所有设备登出');
  });
}
