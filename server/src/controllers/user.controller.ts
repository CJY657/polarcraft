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
import { resolveActivityDateRange } from '../utils/activity-range.util.js';

const ADMIN_ACTIVITY_DASHBOARD_RANGE = { defaultDays: 7, maxSpanDays: 366 };
const ADMIN_ACTIVITY_DETAIL_RANGE = { defaultDays: 30, maxSpanDays: 366 };

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
    const userType =
      req.query.user_type === 'student' ||
      req.query.user_type === 'teacher' ||
      req.query.user_type === 'unclassified'
        ? req.query.user_type
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
      userType,
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

  /** Get aggregate signed-in user activity for administrators. */
  static getActivityDashboardForAdmin = asyncHandler(
    async (req: Request, res: Response) => {
      const range = resolveActivityDateRange(
        req.query.start,
        req.query.end,
        ADMIN_ACTIVITY_DASHBOARD_RANGE
      );
      if ('error' in range) {
        res.error(range.error, 'INVALID_ACTIVITY_RANGE', 400);
        return;
      }

      const segment = req.query.user_type ?? 'student';
      if (segment !== 'student' && segment !== 'teacher' && segment !== 'all') {
        res.error(
          '用户类型仅支持 student、teacher 或 all',
          'INVALID_ACTIVITY_USER_TYPE',
          400
        );
        return;
      }

      let userLimit: number | null = 10;
      if (req.query.limit !== undefined) {
        if (req.query.limit === 'all') userLimit = null;
        else if (
          req.query.limit === '10' ||
          req.query.limit === '50' ||
          req.query.limit === '100'
        ) {
          userLimit = Number(req.query.limit);
        } else {
          res.error(
            '用户人数仅支持 10、50、100 或 all',
            'INVALID_ACTIVITY_LIMIT',
            400
          );
          return;
        }
      }

      try {
        const result = await UserService.getActivityDashboardForAdmin(
          range.start,
          range.end,
          userLimit,
          segment
        );
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

  /** Get one learner's activity detail for administrators. */
  static getLearnerActivityForAdmin = asyncHandler(
    async (req: Request, res: Response) => {
      const range = resolveActivityDateRange(
        req.query.start,
        req.query.end,
        ADMIN_ACTIVITY_DETAIL_RANGE
      );
      if ('error' in range) {
        res.error(range.error, 'INVALID_ACTIVITY_RANGE', 400);
        return;
      }

      try {
        const result = await UserService.getLearnerActivityForAdmin(
          req.params.userId,
          range.start,
          range.end
        );
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
    const {
      username,
      real_name,
      show_real_name_publicly,
      email,
      avatar_url,
      user_type,
    } = req.body;
    const profile = await UserService.updateProfile(req.user!.sub, {
      username,
      real_name,
      show_real_name_publicly,
      email,
      avatar_url,
      user_type,
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
