/**
 * Authentication Controller
 * 认证控制器
 *
 * Handles authentication-related HTTP requests
 * 处理与认证相关的 HTTP 请求
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { logger } from '../utils/logger.js';
import { setupResponseHelpers } from '../utils/response.util.js';

export class AuthController {
  /**
   * Register a new user
 * 注册新用户
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

    const { username, password, email, clientSalt } = req.body;
    const result = await AuthService.register({ username, password, email, clientSalt });

    logger.info(`User registered: ${username}`);
    res.success(result, '注册成功', 201);
  });

  /**
   * Login user
 * 用户登录
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

    const { username, password, rememberMe } = req.body;
    const ipAddress = req.ip;
    const deviceInfo = req.headers['user-agent'];

    const result = await AuthService.login(
      { username, password, rememberMe },
      ipAddress,
      deviceInfo
    );

    // Set refresh token in HTTP-only cookie for remember me
    // 为记住我功能在 HTTP-only cookie 中设置刷新令牌
    if (rememberMe) {
      res.cookie('refresh_token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days / 7 天
        path: '/',
      });
    }

    logger.info(`User logged in: ${username}`);
    res.success(result, '登录成功');
  });

  /**
   * Logout user
 * 用户登出
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

    const sessionId = req.sessionId;
    if (sessionId) {
      await AuthService.logout(sessionId);
    }

    // Clear refresh token cookie
    // 清除刷新令牌 cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    logger.info(`User logged out: ${req.user?.username}`);
    res.success(null, '登出成功');
  });

  /**
   * Refresh access token
 * 刷新访问令牌
   */
  static refresh = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

    const { refreshToken } = req.body;
    const ipAddress = req.ip;
    const deviceInfo = req.headers['user-agent'];

    // If no refresh token in body, try cookie
    // 如果请求体中没有刷新令牌，则尝试 cookie
    const token = refreshToken || req.cookies?.refresh_token;

    if (!token) {
      res.error('缺少刷新令牌', 'MISSING_REFRESH_TOKEN', 400);
      return;
    }

    const result = await AuthService.refreshToken(token, ipAddress, deviceInfo);

    // Update refresh token cookie if it was set
    // 如果设置了刷新令牌 cookie，则更新它
    if (req.cookies?.refresh_token) {
      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days / 7 天
        path: '/',
      });
    }

    res.success(result, 'Token 刷新成功');
  });

  /**
   * Forgot password
 * 忘记密码
   */
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

    const { username } = req.body;
    const result = await AuthService.forgotPassword({ username });

    logger.info(`Password reset requested for: ${username}`);
    res.success(result);
  });

  /**
   * Reset password
 * 重置密码
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

    const { token, newPassword } = req.body;
    const result = await AuthService.resetPassword({ token, newPassword });

    logger.info('Password reset completed');
    res.success(result, '密码重置成功');
  });

  /**
   * Get current user info
 * 获取当前用户信息
   */
  static me = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

    const user = await AuthService.getCurrentUser(req.user!.sub);
    if (!user) {
      res.error('用户未找到', 'USER_NOT_FOUND', 404);
      return;
    }

    res.success(user);
  });

  /**
   * Get user salt for client-side hashing
   * 获取用户盐值用于客户端哈希
   */
  static getUserSalt = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

    const { username } = req.params;
    const result = await AuthService.getUserSalt(username);

    if (!result) {
      // Return a generic error to prevent username enumeration
      // 返回通用错误以防止用户名枚举
      res.error('用户不存在', 'USER_NOT_FOUND', 404);
      return;
    }

    res.success(result);
  });

  /**
   * Get CAPTCHA
 * 获取验证码
   */
  static getCaptcha = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

    const captcha = AuthService.generateCaptcha();
    res.success(captcha);
  });

  /**
   * Verify CAPTCHA (optional endpoint for client-side verification)
 * 验证验证码（用于客户端验证的可选端点）
   */
  static verifyCaptcha = asyncHandler(async (req: Request, res: Response) => {
    setupResponseHelpers(res);

    const { id, code } = req.body;
    const isValid = AuthService.verifyCaptcha(id, code);

    if (!isValid) {
      res.error('验证码错误', 'INVALID_CAPTCHA', 400);
      return;
    }

    res.success({ valid: true }, '验证码正确');
  });
}
