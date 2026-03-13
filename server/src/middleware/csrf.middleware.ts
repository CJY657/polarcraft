/**
 * CSRF Middleware
 * CSRF 中间件
 *
 * Cross-Site Request Forgery protection
 * 跨站请求伪造保护
 */

import { Request, Response, NextFunction } from 'express';
import { createHMAC } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.util.js';
import { createReadableCookieOptions } from '../utils/cookie-options.util.js';

/**
 * CSRF token options
 * CSRF token 选项
 */
const CSRF_TOKEN_COOKIE_NAME = 'csrf_token';
const CSRF_TOKEN_HEADER_NAME = 'x-csrf-token';
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
 * CSRF protection middleware
 * CSRF 保护中间件
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF for GET, HEAD, OPTIONS requests (read-only operations)
  // 跳过 GET、HEAD、OPTIONS 请求的 CSRF（只读操作）
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Get CSRF token from cookie
  // 从 cookie 获取 CSRF token
  const cookieToken = req.cookies?.[CSRF_TOKEN_COOKIE_NAME];

  if (!cookieToken) {
    sendError(res, '缺少 CSRF token', 'CSRF_TOKEN_MISSING', 403);
    return;
  }

  // Get CSRF token from header
  // 从头部获取 CSRF token
  const headerToken = req.headers[CSRF_TOKEN_HEADER_NAME] as string;

  if (!headerToken) {
    sendError(res, '请求头中缺少 CSRF token', 'CSRF_TOKEN_MISSING', 403);
    return;
  }

  // Verify tokens match
  // 验证 token 是否匹配
  if (cookieToken !== headerToken) {
    logger.warn('CSRF token mismatch', {
      ip: req.ip,
      url: req.url,
      method: req.method,
    });
    sendError(res, 'CSRF token 不匹配', 'CSRF_TOKEN_INVALID', 403);
    return;
  }

  next();
}

/**
 * CSRF token middleware - generates and sends token
 * CSRF token 中间件 - 生成并发送 token
 */
export function csrfToken(req: Request, res: Response, next: NextFunction): void {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);

  // Attach token to response for easy access
  // 将 token 附加到响应以便轻松访问
  (res as any).csrfToken = token;

  next();
}

/**
 * Get CSRF token endpoint handler
 * 获取 CSRF token 端点处理器
 */
export function getCsrfToken(req: Request, res: Response): void {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);

  res.json({
    success: true,
    data: {
      csrfToken: token,
    },
  });
}
