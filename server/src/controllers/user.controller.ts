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

const ACTIVITY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ACTIVITY_MAX_SPAN_DAYS = 366;
const ACTIVITY_PRESET_DAYS = new Set(['7', '30', '90']);

type ActivityDateRange = { start: string; end: string };

function toUtcDate(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

function formatUtcDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/**
 * Resolve the dashboard date range from either explicit start/end dates or a
 * legacy `days` preset. Returns an error message on invalid input.
 */
function resolveActivityDateRange(
  start: unknown,
  end: unknown,
  days: unknown
): ActivityDateRange | { error: string } {
  const todayTs = toUtcDate(new Date().toISOString().slice(0, 10));

  if (start !== undefined || end !== undefined) {
    if (
      typeof start !== 'string' ||
      typeof end !== 'string' ||
      !ACTIVITY_DATE_PATTERN.test(start) ||
      !ACTIVITY_DATE_PATTERN.test(end)
    ) {
      return { error: '起止日期需同时提供，格式为 YYYY-MM-DD' };
    }
    const startTs = toUtcDate(start);
    const endTs = toUtcDate(end);
    if (Number.isNaN(startTs) || Number.isNaN(endTs)) {
      return { error: '起止日期无效' };
    }
    if (startTs > endTs) {
      return { error: '开始日期不能晚于结束日期' };
    }
    if (endTs > todayTs) {
      return { error: '结束日期不能晚于今天' };
    }
    if ((endTs - startTs) / 86_400_000 + 1 > ACTIVITY_MAX_SPAN_DAYS) {
      return { error: `时间跨度不能超过 ${ACTIVITY_MAX_SPAN_DAYS} 天` };
    }
    return { start, end };
  }

  let presetDays = 30;
  if (days !== undefined) {
    if (typeof days !== 'string' || !ACTIVITY_PRESET_DAYS.has(days)) {
      return { error: '时间范围仅支持 7、30 或 90 天' };
    }
    presetDays = Number(days);
  }

  return {
    start: formatUtcDate(todayTs - (presetDays - 1) * 86_400_000),
    end: formatUtcDate(todayTs),
  };
}

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

  /** Get aggregate signed-in learner activity for administrators. */
  static getActivityDashboardForAdmin = asyncHandler(
    async (req: Request, res: Response) => {
      const range = resolveActivityDateRange(req.query.start, req.query.end, req.query.days);
      if ('error' in range) {
        res.error(range.error, 'INVALID_ACTIVITY_RANGE', 400);
        return;
      }

      let learnerLimit: number | null = 10;
      if (req.query.limit !== undefined) {
        if (req.query.limit === 'all') learnerLimit = null;
        else if (
          req.query.limit === '10' ||
          req.query.limit === '50' ||
          req.query.limit === '100'
        ) {
          learnerLimit = Number(req.query.limit);
        } else {
          res.error(
            '名单人数仅支持 10、50、100 或 all',
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
          learnerLimit
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
    const { username, real_name, show_real_name_publicly, email, avatar_url } = req.body;
    const profile = await UserService.updateProfile(req.user!.sub, {
      username,
      real_name,
      show_real_name_publicly,
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
