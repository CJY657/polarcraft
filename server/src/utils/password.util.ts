/**
 * Password Utility
 * 密码工具
 *
 * Handles password hashing and comparison
 * 处理密码哈希和比对
 */

import bcrypt from 'bcrypt';
import { config } from '../config/index.js';

/**
 * Hash a password using bcrypt
 * 使用 bcrypt 对密码进行哈希
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, config.password.bcryptRounds);
}

/**
 * Compare a plain text password with a hashed password
 * 比较明文密码和哈希密码
 */
export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return await bcrypt.compare(plain, hashed);
}
