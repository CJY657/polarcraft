/**
 * Refresh Token Model
 * 刷新令牌模型
 */

import { getCollection } from '../database/connection.js';
import { normalizeDocument, normalizeDocuments } from '../database/mongo.util.js';
import { hashToken, generateId } from '../utils/crypto.util.js';
import { RefreshToken, SessionInfo } from '../types/auth.types.js';
import { logger } from '../utils/logger.js';

const refreshTokensCollection = () => getCollection('refresh_tokens');

export class RefreshTokenModel {
  /**
   * Create a new refresh token
   * 创建新的刷新令牌
   */
  static async create(params: {
    userId: string;
    token: string;
    ipAddress?: string;
    deviceInfo?: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    const tokenHash = hashToken(params.token);
    const refreshToken: RefreshToken = {
      id: generateId(),
      user_id: params.userId,
      token: tokenHash,
      ip_address: params.ipAddress || null,
      device_info: params.deviceInfo || null,
      expires_at: params.expiresAt,
      created_at: new Date(),
      revoked_at: null,
    };

    await refreshTokensCollection().insertOne(refreshToken as unknown as Record<string, unknown>);

    logger.debug(`Refresh token created for user: ${params.userId}`);
    return refreshToken;
  }

  /**
   * Find refresh token by token hash
   * 根据令牌哈希查找刷新令牌
   */
  static async findByToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = hashToken(token);
    return normalizeDocument<RefreshToken>(
      await refreshTokensCollection().findOne({ token: tokenHash, revoked_at: null })
    );
  }

  /**
   * Find all active refresh tokens for a user
   * 查找用户的所有活跃刷新令牌
   */
  static async findByUserId(userId: string): Promise<RefreshToken[]> {
    return normalizeDocuments<RefreshToken>(
      await refreshTokensCollection()
        .find({
          user_id: userId,
          revoked_at: null,
          expires_at: { $gt: new Date() },
        })
        .sort({ created_at: -1 })
        .toArray()
    );
  }

  /**
   * Revoke a refresh token
   * 撤销刷新令牌
   */
  static async revoke(id: string): Promise<boolean> {
    const result = await refreshTokensCollection().updateOne(
      { id },
      { $set: { revoked_at: new Date() } }
    );

    logger.debug(`Refresh token revoked: ${id}`);
    return result.matchedCount > 0;
  }

  /**
   * Revoke all refresh tokens for a user
   * 撤销用户的所有刷新令牌
   */
  static async revokeAllForUser(userId: string): Promise<number> {
    const result = await refreshTokensCollection().updateMany(
      { user_id: userId, revoked_at: null },
      { $set: { revoked_at: new Date() } }
    );

    logger.info(`Revoked ${result.modifiedCount} refresh tokens for user: ${userId}`);
    return result.modifiedCount;
  }

  /**
   * Revoke all refresh tokens except the current one
   * 撤销除当前令牌外的所有刷新令牌
   */
  static async revokeAllExcept(currentTokenId: string, userId: string): Promise<number> {
    const result = await refreshTokensCollection().updateMany(
      {
        user_id: userId,
        id: { $ne: currentTokenId },
        revoked_at: null,
      },
      { $set: { revoked_at: new Date() } }
    );

    logger.info(`Revoked ${result.modifiedCount} other refresh tokens for user: ${userId}`);
    return result.modifiedCount;
  }

  /**
   * Get session info for a user
   * 获取用户的会话信息
   */
  static async getSessions(userId: string, currentTokenId?: string): Promise<SessionInfo[]> {
    const tokens = await this.findByUserId(userId);

    return tokens.map((token) => ({
      id: token.id,
      device_info: token.device_info,
      ip_address: token.ip_address,
      created_at: token.created_at,
      expires_at: token.expires_at,
      is_current: currentTokenId ? token.id === currentTokenId : false,
    }));
  }

  /**
   * Delete a refresh token (for session management)
   * 删除刷新令牌（用于会话管理）
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await refreshTokensCollection().deleteOne({ id, user_id: userId });
    logger.debug(`Refresh token deleted: ${id}`);
    return result.deletedCount > 0;
  }

  /**
   * Clean up expired tokens (should be run periodically)
   * 清理过期令牌（应定期运行）
   */
  static async cleanupExpired(): Promise<number> {
    const result = await refreshTokensCollection().deleteMany({
      $or: [
        { expires_at: { $lt: new Date() } },
        { revoked_at: { $ne: null } },
      ],
    });

    logger.info(`Cleaned up ${result.deletedCount} expired refresh tokens`);
    return result.deletedCount;
  }
}
