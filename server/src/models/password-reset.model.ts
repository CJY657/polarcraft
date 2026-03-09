/**
 * Password Reset Token Model
 * 密码重置令牌模型
 */

import { getCollection } from '../database/connection.js';
import { normalizeDocument } from '../database/mongo.util.js';
import { generateToken, generateId } from '../utils/crypto.util.js';
import { PasswordResetToken } from '../types/auth.types.js';
import { logger } from '../utils/logger.js';

const passwordResetCollection = () => getCollection('password_reset_tokens');

export class PasswordResetModel {
  /**
   * Default token expiry: 15 minutes
   * 默认令牌过期时间：15 分钟
   */
  static readonly DEFAULT_EXPIRY_MINUTES = 15;

  /**
   * Create a new password reset token
   * 创建新的密码重置令牌
   */
  static async create(userId: string): Promise<PasswordResetToken> {
    const expiresAt = new Date(Date.now() + this.DEFAULT_EXPIRY_MINUTES * 60 * 1000);
    const resetToken: PasswordResetToken = {
      id: generateId(),
      user_id: userId,
      token: generateToken(32),
      expires_at: expiresAt,
      used_at: null,
      created_at: new Date(),
    };

    await passwordResetCollection().insertOne(resetToken as unknown as Record<string, unknown>);

    logger.info(`Password reset token created for user: ${userId}`);
    return resetToken;
  }

  /**
   * Find password reset token by token value
   * 根据令牌值查找密码重置令牌
   */
  static async findByToken(token: string): Promise<PasswordResetToken | null> {
    return normalizeDocument<PasswordResetToken>(
      await passwordResetCollection().findOne({ token, used_at: null })
    );
  }

  /**
   * Find valid (not expired and not used) password reset token
   * 查找有效（未过期且未使用）的密码重置令牌
   */
  static async findValidToken(token: string): Promise<PasswordResetToken | null> {
    return normalizeDocument<PasswordResetToken>(
      await passwordResetCollection().findOne({
        token,
        used_at: null,
        expires_at: { $gt: new Date() },
      })
    );
  }

  /**
   * Mark token as used
   * 将令牌标记为已使用
   */
  static async markAsUsed(token: string): Promise<boolean> {
    const result = await passwordResetCollection().updateOne(
      { token },
      { $set: { used_at: new Date() } }
    );

    logger.info(`Password reset token marked as used: ${token}`);
    return result.matchedCount > 0;
  }

  /**
   * Invalidate all unused tokens for a user
   * 使用户的所有未使用令牌失效
   */
  static async invalidateAllForUser(userId: string): Promise<number> {
    const result = await passwordResetCollection().updateMany(
      { user_id: userId, used_at: null },
      { $set: { used_at: new Date() } }
    );

    logger.info(`Invalidated ${result.modifiedCount} password reset tokens for user: ${userId}`);
    return result.modifiedCount;
  }

  /**
   * Clean up expired and used tokens
   * 清理过期和已使用的令牌
   */
  static async cleanup(): Promise<number> {
    const result = await passwordResetCollection().deleteMany({
      $or: [
        { used_at: { $ne: null } },
        { expires_at: { $lt: new Date() } },
      ],
    });

    logger.info(`Cleaned up ${result.deletedCount} password reset tokens`);
    return result.deletedCount;
  }

  /**
   * Check if a token is valid
   * 检查令牌是否有效
   */
  static async isValid(token: string): Promise<boolean> {
    const resetToken = await this.findValidToken(token);
    return resetToken !== null;
  }
}
