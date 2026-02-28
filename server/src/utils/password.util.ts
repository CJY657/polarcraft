/**
 * Password Utility
 * 密码工具
 *
 * Handles password hashing, validation, and strength checking
 * 处理密码哈希、验证和强度检查
 *
 * Security Architecture:
 * 安全架构:
 * - Layer 1 (Client): SHA-256(password + salt) - Prevents plaintext transmission
 * - Layer 2 (Server): bcrypt(hash) - Prevents database leak exposure
 *
 * 第一层（客户端）：SHA-256(密码 + 盐值) - 防止明文传输
 * 第二层（服务器）：bcrypt(哈希) - 防止数据库泄露暴露
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { config } from '../config/index.js';
import {
  PasswordValidationResult,
  PasswordPolicy,
} from '../types/auth.types.js';

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

/**
 * Validate password strength
 * 验证密码强度
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = config.password
): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length / 检查最小长度
  if (password.length < policy.minLength) {
    errors.push(`密码至少需要 ${policy.minLength} 个字符`);
  }

  // Check uppercase / 检查大写字母
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码需要包含至少 1 个大写字母');
  }

  // Check lowercase / 检查小写字母
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码需要包含至少 1 个小写字母');
  }

  // Check number / 检查数字
  if (policy.requireNumber && !/\d/.test(password)) {
    errors.push('密码需要包含至少 1 个数字');
  }

  // Check special character / 检查特殊字符
  if (policy.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码需要包含至少 1 个特殊字符 (!@#$%^&*(),.?":{}|<>)');
  }

  // Calculate strength / 计算强度
  const strength = calculateStrength(password, policy);

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Calculate password strength
 * 计算密码强度
 */
function calculateStrength(
  password: string,
  policy: PasswordPolicy
): 'weak' | 'medium' | 'strong' {
  let score = 0;

  // Length score / 长度评分
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety / 字符多样性
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  if (score <= 3) return 'weak';
  if (score <= 5) return 'medium';
  return 'strong';
}

/**
 * Generate a random salt for client-side hashing
 * 为客户端哈希生成随机盐值
 *
 * @returns 64-character hex string / 64字符的十六进制字符串
 */
export function generateClientSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify client-side SHA-256 hash (optional validation)
 * 验证客户端 SHA-256 哈希（可选验证）
 *
 * This can be used to verify the client correctly hashed the password
 * 这可以用来验证客户端是否正确地对密码进行了哈希
 *
 * @param plainPassword - The original plain password / 原始明文密码
 * @param clientSalt - The salt used by client / 客户端使用的盐值
 * @param clientHash - The hash received from client / 从客户端接收的哈希
 * @returns Whether the hash matches / 哈希是否匹配
 */
export function verifyClientHash(
  plainPassword: string,
  clientSalt: string,
  clientHash: string
): boolean {
  const computed = crypto
    .createHash('sha256')
    .update(plainPassword + clientSalt)
    .digest('hex');
  return computed === clientHash;
}

/**
 * Generate a random password
 * 生成随机密码（可用于密码重置）
 */
export function generateRandomPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()';
  const all = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one of each required character type
  // 确保至少包含每种必需的字符类型
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters
  // 其余部分用随机字符填充
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password / 打乱密码
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
