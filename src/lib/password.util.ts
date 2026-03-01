/**
 * Password Utility (Client-side)
 * 密码工具（客户端）
 *
 * Handles client-side password hashing before transmission
 * 处理传输前的客户端密码哈希
 *
 * Security Architecture:
 * 安全架构:
 * - Layer 1 (Client): SHA-256(password + salt) - Prevents plaintext transmission
 * - Layer 2 (Server): bcrypt(hash) - Prevents database leak exposure
 *
 * 第一层（客户端）：SHA-256(密码 + 盐值) - 防止明文传输
 * 第二层（服务器）：bcrypt(哈希) - 防止数据库泄露暴露
 */

import SHA256 from 'crypto-js/sha256';
import EncHex from 'crypto-js/enc-hex';
import CryptoJS from 'crypto-js';

/**
 * Check if Web Crypto API is available
 * 检查 Web Crypto API 是否可用
 */
function isWebCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

/**
 * Generate a random salt for client-side hashing
 * 为客户端哈希生成随机盐值
 */
export function generateSalt(): string {
  // Try using Web Crypto API / 尝试使用 Web Crypto API
  if (isWebCryptoAvailable() && typeof crypto.getRandomValues === 'function') {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: use crypto-js / 后备方案：使用 crypto-js
  const wordArray = randomWords(8); // 8 words = 32 bytes
  return wordArray.toString(EncHex);
}

/**
 * Generate random words using crypto-js
 * 使用 crypto-js 生成随机字
 */
function randomWords(count: number): any {
  const words: number[] = [];
  for (let i = 0; i < count; i++) {
    words.push(Math.random() * 0x100000000 | 0);
  }
  return CryptoJS.lib.WordArray.create(words);
}

/**
 * Hash password using SHA-256 with salt (client-side first layer encryption)
 * 使用 SHA-256 和盐值对密码进行哈希（客户端第一层加密）
 *
 * @param password - The plain text password / 明文密码
 * @param salt - The salt value / 盐值
 * @returns The hashed password (SHA-256) / 哈希后的密码（SHA-256）
 */
export async function hashPasswordClient(password: string, salt: string): Promise<string> {
  const combined = password + salt;

  // Try using Web Crypto API / 尝试使用 Web Crypto API
  if (isWebCryptoAvailable()) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Fall through to crypto-js / 降级到 crypto-js
      console.warn('Web Crypto API failed, falling back to crypto-js:', e);
    }
  }

  // Fallback: use crypto-js / 后备方案：使用 crypto-js
  return SHA256(combined).toString(EncHex);
}

/**
 * Hash password for registration (generates new salt)
 * 为注册哈希密码（生成新盐值）
 *
 * @param password - The plain text password / 明文密码
 * @returns Object with hashed password and salt / 包含哈希密码和盐值的对象
 */
export async function preparePasswordForRegistration(password: string): Promise<{
  hashedPassword: string;
  salt: string;
}> {
  const salt = generateSalt();
  const hashedPassword = await hashPasswordClient(password, salt);
  return {
    hashedPassword,
    salt,
  };
}

/**
 * Hash password for login (uses existing salt from server)
 * 为登录哈希密码（使用来自服务器的现有盐值）
 *
 * @param password - The plain text password / 明文密码
 * @param salt - The user's salt from server / 来自服务器的用户盐值
 * @returns The hashed password / 哈希后的密码
 */
export async function preparePasswordForLogin(password: string, salt: string): Promise<string> {
  return await hashPasswordClient(password, salt);
}

/**
 * Validate password strength on client side
 * 在客户端验证密码强度
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
}

const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

/**
 * Validate password against policy
 * 根据策略验证密码
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
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
 * Get password requirements as an array for UI display
 * 获取密码要求数组以供 UI 显示
 */
export function getPasswordRequirements(policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): string[] {
  const requirements: string[] = [];

  if (policy.minLength > 0) {
    requirements.push(`至少 ${policy.minLength} 个字符`);
  }
  if (policy.requireUppercase) {
    requirements.push('包含大写字母');
  }
  if (policy.requireLowercase) {
    requirements.push('包含小写字母');
  }
  if (policy.requireNumber) {
    requirements.push('包含数字');
  }
  if (policy.requireSpecialChar) {
    requirements.push('包含特殊字符 (!@#$%^&*(),.?":{}|<>)');
  }

  return requirements;
}
