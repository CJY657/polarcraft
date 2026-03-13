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
import { setupResponseHelpers } from '../utils/response.util.js';
import { createAuthCookieOptions } from '../utils/cookie-options.util.js';

export class UserController {
  /**
   * Get user profile
 * 获取用户资料
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

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
    setupResponseHelpers(res);

    const { username, email, avatar_url } = req.body;
    const profile = await UserService.updateProfile(req.user!.sub, {
      username,
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
    setupResponseHelpers(res);

    const { currentPassword, newPassword } = req.body;
    await UserService.changePassword(req.user!.sub, {
      currentPassword,
      newPassword,
    });

    logger.info(`Password changed for user: ${req.user!.username}`);
    res.success(null, '密码修改成功，请重新登录');
  });

  /**
   * Get user sessions
 * 获取用户会话
   */
  static getSessions = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

    const sessions = await UserService.getSessions(req.user!.sub, req.sessionId);
    res.success(sessions);
  });

  /**
   * Logout from a specific session
 * 从特定会话登出
   */
  static logoutFromSession = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

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
    setupResponseHelpers(res);

    const count = await UserService.logoutFromAllSessions(req.user!.sub);

    // Clear refresh token cookie
    // 清除刷新令牌 cookie
    res.clearCookie('refresh_token', createAuthCookieOptions());

    logger.info(`User ${req.user!.username} logged out from all sessions (${count} sessions)`);
    res.success(null, '已从所有设备登出');
  });
}
