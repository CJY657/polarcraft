/**
 * CSRF Middleware
 * CSRF 中间件
 *
 * Cross-Site Request Forgery protection
 * 跨站请求伪造保护
 */

import { Request, Response, NextFunction } from 'express';
import { createHMAC } from '../utils/crypto.util.js';
import { createReadableCookieOptions } from '../utils/cookie-options.util.js';

/**
 * CSRF token options
 * CSRF token 选项
 */
const CSRF_TOKEN_COOKIE_NAME = 'csrf_token';
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours / 24 小时

/**
 * Generate a CSRF token
 * 生成 CSRF token
 */
function generateCsrfToken(): string {
  const data = `${Date.now()}-${Math.random()}`;
  return createHMAC(data);
}

/**
 * Set CSRF token cookie
 * 设置 CSRF token cookie
 */
function setCsrfCookie(res: Response, token: string): void {
  res.cookie(CSRF_TOKEN_COOKIE_NAME, token, createReadableCookieOptions({
    maxAge: CSRF_TOKEN_EXPIRY,
  }));
}

/**
 * CSRF token middleware - generates and sends token
 * CSRF token 中间件 - 生成并发送 token
 */
export function csrfToken(_req: Request, res: Response, next: NextFunction): void {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);

  next();
}
