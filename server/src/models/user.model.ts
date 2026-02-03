/**
 * User Model
 * 用户数据模型
 */

import { query, queryOne } from '../database/connection.js';
import { hashPassword, comparePassword, generateClientSalt } from '../utils/password.util.js';
import { generateId } from '../utils/crypto.util.js';
import { User, UserProfile, RegisterInput, AuthError, UserSaltResponse } from '../types/auth.types.js';
import { logger } from '../utils/logger.js';

/**
 * User Model Class
 * 用户模型类
 */
export class UserModel {
  /**
   * Find user by ID
 * 根据 ID 查找用户
   */
  static async findById(id: string): Promise<UserProfile | null> {
    const sql = `
      SELECT id, username, role, avatar_url, email, email_verified, created_at, updated_at, last_login_at
      FROM users
      WHERE id = ? AND is_active = TRUE
    `;
    const user = await queryOne<User>(sql, [id]);
    return user ? this.toProfile(user) : null;
  }

  /**
   * Find user by username (includes password hash for authentication)
 * 根据用户名查找用户（包含密码哈希用于认证）
   */
  static async findByUsername(username: string): Promise<User | null> {
    const sql = `
      SELECT *
      FROM users
      WHERE username = ?
    `;
    return await queryOne<User>(sql, [username]);
  }

  /**
   * Find user by email
 * 根据邮箱查找用户
   */
  static async findByEmail(email: string): Promise<User | null> {
    const sql = `
      SELECT *
      FROM users
      WHERE email = ?
    `;
    return await queryOne<User>(sql, [email]);
  }

  /**
   * Get user salt for client-side hashing
   * 获取用户盐值用于客户端哈希
   */
  static async getUserSalt(username: string): Promise<UserSaltResponse | null> {
    const sql = `
      SELECT client_salt, client_hash_algorithm
      FROM users
      WHERE username = ?
    `;
    const result = await queryOne<{ client_salt: string; client_hash_algorithm: string }>(sql, [username]);
    if (!result) {
      return null;
    }
    return {
      salt: result.client_salt,
      algorithm: result.client_hash_algorithm,
    };
  }

  /**
   * Create a new user
 * 创建新用户
   */
  static async create(input: RegisterInput): Promise<User> {
    // Check if username already exists
    // 检查用户名是否已存在
    const existingUser = await this.findByUsername(input.username);
    if (existingUser) {
      throw new AuthError('USER_ALREADY_EXISTS', '用户名已存在', 409);
    }

    // The password received is already hashed by client using SHA-256
    // We apply bcrypt as the second layer of encryption
    // 接收到的密码已被客户端使用 SHA-256 哈希
    // 我们应用 bcrypt 作为第二层加密
    const passwordHash = await hashPassword(input.password);

    // Use client-provided salt
    // 使用客户端提供的盐值
    const clientSalt = input.clientSalt;

    const sql = `
      INSERT INTO users (id, username, password_hash, client_salt, email)
      VALUES (?, ?, ?, ?, ?)
    `;

    const id = generateId();
    const params = [id, input.username, passwordHash, clientSalt, input.email || null];

    await query(sql, params);

    // Return the created user
    // 返回创建的用户
    const newUser = await this.findByUsername(input.username);
    if (!newUser) {
      throw new Error('Failed to create user');
    }

    logger.info(`New user created: ${input.username} (${id})`);
    return newUser;
  }

  /**
   * Update user profile
 * 更新用户资料
   */
  static async updateProfile(
    id: string,
    updates: Partial<Pick<User, 'username' | 'email' | 'avatar_url'>>
  ): Promise<UserProfile | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.username) {
      // Check if username is taken by another user
      // 检查用户名是否被其他用户占用
      const existing = await this.findByUsername(updates.username);
      if (existing && existing.id !== id) {
        throw new AuthError('USER_ALREADY_EXISTS', '用户名已被使用', 409);
      }
      fields.push('username = ?');
      params.push(updates.username);
    }

    if (updates.email !== undefined) {
      fields.push('email = ?');
      params.push(updates.email);
    }

    if (updates.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      params.push(updates.avatar_url);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    params.push(id);

    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
    `;

    await query(sql, params);

    logger.info(`User profile updated: ${id}`);
    return await this.findById(id);
  }

  /**
   * Update password
 * 更新密码
   */
  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const passwordHash = await hashPassword(newPassword);

    const sql = `
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
    `;

    await query(sql, [passwordHash, id]);

    logger.info(`Password updated for user: ${id}`);
    return true;
  }

  /**
   * Update last login time
 * 更新最后登录时间
   */
  static async updateLastLogin(id: string): Promise<void> {
    const sql = `
      UPDATE users
      SET last_login_at = NOW()
      WHERE id = ?
    `;
    await query(sql, [id]);
  }

  /**
   * Verify user password
 * 验证用户密码
   */
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return await comparePassword(password, user.password_hash);
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
