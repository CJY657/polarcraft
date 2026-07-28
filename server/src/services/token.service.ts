/**
 * Token Service
 * Token 服务
 *
 * Manages JWT tokens and refresh tokens
 * 管理 JWT token 和刷新令牌
 */

import { generateTokenPair, verifyRefreshToken, getTokenExpiry } from '../utils/jwt.util.js';
import { RefreshTokenModel } from '../models/refresh-token.model.js';
import { UserModel } from '../models/user.model.js';
import { TokenPayload, TokenPair, SessionInfo } from '../types/auth.types.js';
import { logger } from '../utils/logger.js';
import { AuthError } from '../types/auth.types.js';

/**
 * Token Service Class
 * Token 服务类
 */
export class TokenService {
  /**
   * Generate token pair and store refresh token
 * 生成 token 对并存储刷新令牌
   */
  static async generateTokens(
    user: { id: string; username: string; role: 'user' | 'admin' },
    ipAddress?: string,
    deviceInfo?: string
  ): Promise<TokenPair & { refreshTokenId: string }> {
    // Generate token pair
    // 生成 token 对
    const tokens = generateTokenPair({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    // Calculate refresh token expiry
    // 计算刷新令牌过期时间
    const refreshTokenExpiry = getTokenExpiry(tokens.refreshToken);
    if (!refreshTokenExpiry) {
      throw new Error('Failed to get refresh token expiry');
    }

    // Store refresh token in database
    // 在数据库中存储刷新令牌
    const refreshTokenRecord = await RefreshTokenModel.create({
      userId: user.id,
      token: tokens.refreshToken,
      ipAddress,
      deviceInfo,
      expiresAt: refreshTokenExpiry,
    });

    logger.info(`Tokens generated for user: ${user.id}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      refreshTokenId: refreshTokenRecord.id,
    };
  }

  /**
   * Refresh access token using refresh token
 * 使用刷新令牌刷新访问令牌
   */
  static async refreshAccessToken(
    refreshToken: string,
    ipAddress?: string,
    deviceInfo?: string
  ): Promise<TokenPair & { refreshTokenId: string }> {
    // Verify refresh token
    // 验证刷新令牌
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AuthError('INVALID_TOKEN', 'Invalid or expired refresh token', 401);
    }

    // Check if it's a refresh token
    // 检查是否为刷新令牌
    if (payload.type !== 'refresh') {
      throw new AuthError('INVALID_TOKEN', 'Token is not a refresh token', 401);
    }

    // Find refresh token in database
    // 在数据库中查找刷新令牌
    const tokenRecord = await RefreshTokenModel.findByToken(refreshToken);
    if (!tokenRecord) {
      throw new AuthError('INVALID_TOKEN', 'Refresh token not found or revoked', 401);
    }

    // Check if token is expired
    // 检查令牌是否过期
    if (tokenRecord.expires_at < new Date()) {
      await RefreshTokenModel.revoke(tokenRecord.id);
      throw new AuthError('TOKEN_EXPIRED', 'Refresh token has expired', 401);
    }

    // Revoke the old refresh token (token rotation)
    // 撤销旧的刷新令牌（令牌轮换）
    await RefreshTokenModel.revoke(tokenRecord.id);

    // Silent refresh keeps sessions alive without hitting /login, so stamp
    // last_login_at here too — otherwise long-lived sessions show "从未登录"
    // 静默刷新会绕过 /login，这里同步更新最后登录时间
    await UserModel.updateLastLogin(payload.sub);

    // Generate new token pair
    // 生成新的 token 对
    const tokens = await this.generateTokens(
      {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
      },
      ipAddress,
      deviceInfo
    );

    logger.info(`Access token refreshed for user: ${payload.sub}`);

    return tokens;
  }

  /**
   * Revoke a refresh token (logout)
 * 撤销刷新令牌（登出）
   */
  static async revokeToken(tokenId: string): Promise<boolean> {
    return await RefreshTokenModel.revoke(tokenId);
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
 * 撤销用户的所有刷新令牌（从所有设备登出）
   */
  static async revokeAllTokens(userId: string): Promise<number> {
    return await RefreshTokenModel.revokeAllForUser(userId);
  }

  /**
   * Get active sessions for a user
 * 获取用户的活跃会话
   */
  static async getUserSessions(userId: string, currentTokenId?: string): Promise<SessionInfo[]> {
    return await RefreshTokenModel.getSessions(userId, currentTokenId);
  }

  /**
   * Delete a specific session
 * 删除特定会话
   */
  static async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    return await RefreshTokenModel.delete(sessionId, userId);
  }

  /**
   * Verify and get refresh token record
 * 验证并获取刷新令牌记录
   */
  static async verifyRefreshTokenRecord(
    refreshToken: string
  ): Promise<{ token: RefreshTokenModel; payload: TokenPayload } | null> {
    // Verify JWT
    // 验证 JWT
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return null;
    }

    // Check database record
    // 检查数据库记录
    const tokenRecord = await RefreshTokenModel.findByToken(refreshToken);
    if (!tokenRecord) {
      return null;
    }

    return {
      token: tokenRecord as any,
      payload,
    };
  }

  /**
   * Clean up expired tokens (should be run periodically)
 * 清理过期令牌（应定期运行）
   */
  static async cleanupExpired(): Promise<number> {
    return await RefreshTokenModel.cleanupExpired();
  }
}
