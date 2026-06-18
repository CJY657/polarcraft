/**
 * Cryptography Utility
 * 加密工具
 *
 * Handles hashing and random generation
 * 处理哈希和随机生成
 */

import crypto from 'crypto';
import { config } from '../config/index.js';

/**
 * Generate a random UUID v4
 * 生成随机 UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a random token
 * 生成随机令牌
 */
export function generateToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Create a hash for storing tokens securely
 * 创建安全存储令牌的哈希
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create HMAC signature
 * 创建 HMAC 签名
 */
export function createHMAC(
  data: string,
  secret: string = config.security.csrfSecret
): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('hex');
}
