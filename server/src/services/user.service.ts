/**
 * User Service
 * 用户服务
 *
 * Business logic for user management
 * 用户管理的业务逻辑
 */

import { UserModel } from '../models/user.model.js';
import {
  UserProfile,
  UpdateProfileInput,
  ChangePasswordInput,
  SessionsResponse,
  AuthError,
} from '../types/auth.types.js';
import {
  AdminUserListResponse,
  AdminUserPostHogAnalyticsResponse,
  AdminUserStatsResponse,
  ListAdminUsersOptions,
} from '../types/user.types.js';
import { TokenService } from './token.service.js';
import { PostHogService } from './posthog.service.js';
import { logger } from '../utils/logger.js';

/**
 * User Service Class
 * 用户服务类
 */
export class UserService {
  private static isClientPasswordHash(value: string): boolean {
    return /^[a-f0-9]{64}$/i.test(value);
  }

  /**
   * Get user profile by ID
 * 根据 ID 获取用户资料
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    return await UserModel.findById(userId);
  }

  /**
   * Get admin user list
   * 获取管理员用户列表
   */
  static async listUsersForAdmin(
    options: ListAdminUsersOptions = {}
  ): Promise<AdminUserListResponse> {
    const limit = this.normalizeLimit(options.limit);
    const offset = this.normalizeOffset(options.offset);

    return UserModel.listForAdmin({
      search: options.search,
      role: options.role,
      status: options.status,
      limit,
      offset,
    });
  }

  /**
   * Get admin user statistics
   * 获取管理员用户统计
   */
  static async getUserStatsForAdmin(): Promise<AdminUserStatsResponse> {
    return UserModel.getAdminStats();
  }

  /**
   * Get PostHog analytics for a single user in admin workflows
   * 管理员查询单个用户的 PostHog 行为数据
   */
  static async getPostHogAnalyticsForAdmin(
    userId: string
  ): Promise<AdminUserPostHogAnalyticsResponse> {
    const user = await UserModel.findByIdForAdmin(userId);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', '用户未找到', 404);
    }

    return PostHogService.getUserAnalytics(user.id);
  }

  /**
   * Update user profile
 * 更新用户资料
   */
  static async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<UserProfile> {
    const profile = await UserModel.updateProfile(userId, input);
    if (!profile) {
      throw new AuthError('USER_NOT_FOUND', '用户未找到', 404);
    }
    return profile;
  }

  /**
   * Change user password
 * 修改用户密码
   */
  static async changePassword(userId: string, input: ChangePasswordInput): Promise<boolean> {
    // Get user with password hash - need to get by username since we need the password hash
    // 获取包含密码哈希的用户 - 需要通过用户名获取，因为我们需要密码哈希
    // First get the user profile to get the username
    // 首先获取用户资料以获取用户名
    const profile = await UserModel.findById(userId);
    if (!profile) {
      throw new AuthError('USER_NOT_FOUND', '用户未找到', 404);
    }

    // Now get the full user with password hash
    // 现在获取包含密码哈希的完整用户
    const user = await UserModel.findByUsername(profile.username);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', '用户未找到', 404);
    }

    // Verify current password
    // 验证当前密码
    const isValid = await UserModel.verifyPassword(user, input.currentPassword);
    if (!isValid) {
      throw new AuthError('INVALID_CREDENTIALS', '当前密码错误', 401);
    }

    if (!this.isClientPasswordHash(input.newPassword)) {
      throw new AuthError('WEAK_PASSWORD', '新密码格式无效，请重新输入', 400);
    }

    // Update password
    // 更新密码
    await UserModel.updatePasswordWithClientSalt(
      userId,
      input.newPassword,
      input.clientSalt
    );

    // Revoke all refresh tokens (force re-login on all devices)
    // 撤销所有刷新令牌（强制所有设备重新登录）
    await TokenService.revokeAllTokens(userId);

    logger.info(`Password changed for user: ${userId}`);
    return true;
  }

  /**
   * Get user sessions
 * 获取用户会话
   */
  static async getSessions(userId: string, currentTokenId?: string): Promise<SessionsResponse> {
    const sessions = await TokenService.getUserSessions(userId, currentTokenId);
    return {
      sessions,
      total: sessions.length,
    };
  }

  /**
   * Logout from a specific session
 * 从特定会话登出
   */
  static async logoutFromSession(userId: string, sessionId: string): Promise<boolean> {
    return await TokenService.deleteSession(sessionId, userId);
  }

  /**
   * Logout from all sessions
 * 从所有会话登出
   */
  static async logoutFromAllSessions(userId: string): Promise<number> {
    return await TokenService.revokeAllTokens(userId);
  }

  /**
   * Delete user account (soft delete by deactivating)
 * 删除用户账号（通过停用进行软删除）
   */
  static async deleteAccount(userId: string): Promise<boolean> {
    // TODO: Implement soft delete
    // TODO: 实现软删除
    throw new Error('Account deletion not implemented');
  }

  private static normalizeLimit(limit?: number): number {
    if (!Number.isFinite(limit)) {
      return 20;
    }

    return Math.min(Math.max(Math.trunc(limit as number), 1), 100);
  }

  private static normalizeOffset(offset?: number): number {
    if (!Number.isFinite(offset)) {
      return 0;
    }

    return Math.max(Math.trunc(offset as number), 0);
  }
}
