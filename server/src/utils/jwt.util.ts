/**
 * JWT Utility
 * JWT 工具
 *
 * Handles JWT token generation and verification
 * 处理 JWT token 的生成和验证
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { TokenPayload } from '../types/auth.types.js';
import { generateId } from './crypto.util.js';
import { logger } from './logger.js';

/**
 * Generate an access token
 * 生成访问令牌
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): string {
  const tokenPayload: TokenPayload = {
    ...payload,
    type: 'access',
  };

  return jwt.sign(tokenPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  } as jwt.SignOptions);
}

/**
 * Generate a refresh token
 * 生成刷新令牌
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): string {
  const tokenPayload: TokenPayload = {
    ...payload,
    type: 'refresh',
  };

  return jwt.sign(tokenPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
    jwtid: generateId(),
  } as jwt.SignOptions);
}

/**
 * Generate both access and refresh tokens
 * 生成访问令牌和刷新令牌
 */
export function generateTokenPair(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Calculate access token expiry in seconds
  // 计算访问令牌的过期时间（秒）
  const expiresIn = parseExpiryToSeconds(config.jwt.accessExpiry);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify an access token
 * 验证访问令牌
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
  } catch (error) {
    logger.debug('Access token verification failed:', error);
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify a refresh token
 * 验证刷新令牌
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  } catch (error) {
    logger.debug('Refresh token verification failed:', error);
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Decode a token without verification (for getting expiry date etc)
 * 解码令牌而不进行验证（用于获取过期日期等）
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    logger.debug('Token decode failed:', error);
    return null;
  }
}

/**
 * Get token expiry date
 * 获取令牌过期日期
 */
export function getTokenExpiry(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000);
}

/**
 * Parse expiry string to seconds
 * 将过期时间字符串转换为秒数
 */
function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 900; // Default 15 minutes
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 900;
  }
}

/**
 * Extract token from Authorization header
 * 从 Authorization 头部提取令牌
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
