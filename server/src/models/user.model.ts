/**
 * User Model
 * 用户模型
 */

import { getCollection } from '../database/connection.js';
import { normalizeDocument, pickDefined } from '../database/mongo.util.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateId } from '../utils/crypto.util.js';
import {
  User,
  UserProfile,
  RegisterInput,
  AuthError,
  UserSaltResponse,
} from '../types/auth.types.js';
import { logger } from '../utils/logger.js';

const usersCollection = () => getCollection('users');

export class UserModel {
  /**
   * Find user by ID
   * 根据 ID 查找用户
   */
  static async findById(id: string): Promise<UserProfile | null> {
    const user = normalizeDocument<User>(
      await usersCollection().findOne({ id, is_active: true })
    );

    return user ? this.toProfile(user) : null;
  }

  /**
   * Find user by username (includes password hash for authentication)
   * 根据用户名查找用户（包含密码哈希用于认证）
   */
  static async findByUsername(username: string): Promise<User | null> {
    return normalizeDocument<User>(await usersCollection().findOne({ username }));
  }

  /**
   * Find user by email
   * 根据邮箱查找用户
   */
  static async findByEmail(email: string): Promise<User | null> {
    return normalizeDocument<User>(await usersCollection().findOne({ email }));
  }

  /**
   * Get user salt for client-side hashing
   * 获取用户盐值用于客户端哈希
   */
  static async getUserSalt(username: string): Promise<UserSaltResponse | null> {
    const user = normalizeDocument<Pick<User, 'client_salt' | 'client_hash_algorithm'>>(
      await usersCollection().findOne(
        { username },
        { projection: { client_salt: 1, client_hash_algorithm: 1 } }
      )
    );

    if (!user) {
      return null;
    }

    return {
      salt: user.client_salt,
      algorithm: user.client_hash_algorithm,
    };
  }

  /**
   * Create a new user
   * 创建新用户
   */
  static async create(input: RegisterInput): Promise<User> {
    const existingUser = await this.findByUsername(input.username);
    if (existingUser) {
      throw new AuthError('USER_ALREADY_EXISTS', '用户名已存在', 409);
    }

    const passwordHash = await hashPassword(input.password);
    const now = new Date();

    const user: User = {
      id: generateId(),
      username: input.username,
      password_hash: passwordHash,
      client_salt: input.clientSalt,
      client_hash_algorithm: 'SHA-256',
      role: 'user',
      avatar_url: null,
      is_active: true,
      email: input.email || null,
      email_verified: false,
      created_at: now,
      updated_at: now,
      last_login_at: null,
    };

    await usersCollection().insertOne(user as unknown as Record<string, unknown>);

    logger.info(`New user created: ${input.username} (${user.id})`);
    return user;
  }

  /**
   * Update user profile
   * 更新用户资料
   */
  static async updateProfile(
    id: string,
    updates: Partial<Pick<User, 'username' | 'email' | 'avatar_url'>>
  ): Promise<UserProfile | null> {
    if (updates.username) {
      const existing = await this.findByUsername(updates.username);
      if (existing && existing.id !== id) {
        throw new AuthError('USER_ALREADY_EXISTS', '用户名已被使用', 409);
      }
    }

    const updateDoc = pickDefined({
      username: updates.username,
      email: updates.email,
      avatar_url: updates.avatar_url,
    });

    if (Object.keys(updateDoc).length === 0) {
      return this.findById(id);
    }

    const result = await usersCollection().updateOne(
      { id },
      {
        $set: {
          ...updateDoc,
          updated_at: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return null;
    }

    logger.info(`User profile updated: ${id}`);
    return this.findById(id);
  }

  /**
   * Update password
   * 更新密码
   */
  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const passwordHash = await hashPassword(newPassword);

    const result = await usersCollection().updateOne(
      { id },
      {
        $set: {
          password_hash: passwordHash,
          updated_at: new Date(),
        },
      }
    );

    logger.info(`Password updated for user: ${id}`);
    return result.matchedCount > 0;
  }

  /**
   * Update last login time
   * 更新最后登录时间
   */
  static async updateLastLogin(id: string): Promise<void> {
    const now = new Date();
    await usersCollection().updateOne(
      { id },
      {
        $set: {
          last_login_at: now,
          updated_at: now,
        },
      }
    );
  }

  /**
   * Verify user password
   * 验证用户密码
   */
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return comparePassword(password, user.password_hash);
  }

  /**
   * Convert User entity to UserProfile (without sensitive data)
   * 将用户实体转换为用户配置文件（不包含敏感数据）
   */
  private static toProfile(user: User): UserProfile {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      avatar_url: user.avatar_url,
      email: user.email,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at,
    };
  }
}
