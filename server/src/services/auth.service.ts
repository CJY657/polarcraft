/**
 * Authentication Service
 * 认证服务
 *
 * Core authentication business logic
 * 核心认证业务逻辑
 */

import { UserModel } from '../models/user.model.js';
import { PasswordResetModel } from '../models/password-reset.model.js';
import { validatePassword } from '../utils/password.util.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { TokenService } from './token.service.js';
import { CaptchaService } from './captcha.service.js';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  AuthResponse,
  LoginResponse,
  AuthError,
  UserSaltResponse,
} from '../types/auth.types.js';

/**
 * Authentication Service Class
 * 认证服务类
 */
export class AuthService {
  /**
   * Register a new user
 * 注册新用户
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    // Note: Password validation is now done on the client side before first hash
    // 注意：密码验证现在在客户端第一次哈希之前完成
    // The password received is already hashed by client using SHA-256
    // 接收到的密码已被客户端使用 SHA-256 哈希

    // Create user
    // 创建用户
    const user = await UserModel.create(input);

    // Generate tokens
    // 生成令牌
    const tokens = await TokenService.generateTokens(user);

    logger.info(`User registered: ${user.username} (${user.id})`);

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url,
        email: user.email,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
      },
      tokens,
    };
  }

  /**
   * Login user
 * 用户登录
   */
  static async login(input: LoginInput, ipAddress?: string, deviceInfo?: string): Promise<LoginResponse> {
    // Verify CAPTCHA if provided
    // 如果提供了验证码，则进行验证
    if (input.captcha) {
      // CAPTCHA verification would be done here
      // 验证码验证会在这里进行
      // For now, we'll skip it if not provided
      // 目前，如果未提供则跳过
    }

    // Find user by username
    // 根据用户名查找用户
    const user = await UserModel.findByUsername(input.username);
    if (!user) {
      throw new AuthError('INVALID_CREDENTIALS', '用户名或密码错误', 401);
    }

    // Check if account is active
    // 检查账号是否激活
    if (!user.is_active) {
      throw new AuthError('USER_INACTIVE', '账号已被停用', 403);
    }

    // Verify password
    // 验证密码
    const isPasswordValid = await UserModel.verifyPassword(user, input.password);
    if (!isPasswordValid) {
      throw new AuthError('INVALID_CREDENTIALS', '用户名或密码错误', 401);
    }

    // Update last login time
    // 更新最后登录时间
    await UserModel.updateLastLogin(user.id);

    // Generate tokens
    // 生成令牌
    const tokens = await TokenService.generateTokens(user, ipAddress, deviceInfo);

    logger.info(`User logged in: ${user.username} (${user.id})`);

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url,
        email: user.email,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
      },
      tokens,
      isNewUser: false,
    };
  }

  /**
   * Logout user (revoke refresh token)
 * 用户登出（撤销刷新令牌）
   */
  static async logout(refreshTokenId: string): Promise<boolean> {
    return await TokenService.revokeToken(refreshTokenId);
  }

  /**
   * Refresh access token
 * 刷新访问令牌
   */
  static async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    deviceInfo?: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const tokens = await TokenService.refreshAccessToken(refreshToken, ipAddress, deviceInfo);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  /**
   * Request password reset
 * 请求密码重置
   */
  static async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    // Find user by username or email
    // 根据用户名或邮箱查找用户
    let user = await UserModel.findByUsername(input.username);
    if (!user && input.username.includes('@')) {
      // Try looking up by email if input looks like an email
      // 如果输入看起来像邮箱，尝试按邮箱查找
      user = await UserModel.findByEmail(input.username);
    }

    // Always return success even if user doesn't exist (security best practice)
    // 即使用户不存在也返回成功（安全最佳实践）
    if (!user) {
      logger.warn(`Password reset requested for non-existent user: ${input.username}`);
      return {
        message: '如果该用户存在，将收到密码重置说明',
      };
    }

    // Invalidate any existing password reset tokens
    // 使任何现有的密码重置令牌失效
    await PasswordResetModel.invalidateAllForUser(user.id);

    // Create new password reset token
    // 创建新的密码重置令牌
    const resetToken = await PasswordResetModel.create(user.id);

    // TODO: Send email with reset link
    // TODO: 发送带有重置链接的电子邮件
    // In production, you would send an email with a link like:
    // 在生产环境中，您会发送一封包含如下链接的电子邮件：
    // `${config.frontendUrl}/reset-password?token=${resetToken.token}`

    logger.info(`Password reset requested for user: ${user.username} (${user.id})`);
    logger.info(`Reset token: ${resetToken.token} (valid for ${PasswordResetModel.DEFAULT_EXPIRY_MINUTES} minutes)`);

    // For development, return the token in the message
    // 仅用于开发，在消息中返回令牌
    if (config.isDevelopment) {
      return {
        message: `密码重置令牌: ${resetToken.token} (有效期为 ${PasswordResetModel.DEFAULT_EXPIRY_MINUTES} 分钟)`,
      };
    }

    return {
      message: '如果该用户存在，将收到密码重置说明',
    };
  }

  /**
   * Reset password with token
 * 使用令牌重置密码
   */
  static async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    // Verify token is valid
    // 验证令牌是否有效
    const resetToken = await PasswordResetModel.findValidToken(input.token);
    if (!resetToken) {
      throw new AuthError('INVALID_TOKEN', '密码重置令牌无效或已过期', 400);
    }

    // Validate new password strength
    // 验证新密码强度
    const passwordValidation = validatePassword(input.newPassword, config.password);
    if (!passwordValidation.valid) {
      throw new AuthError(
        'WEAK_PASSWORD',
        passwordValidation.errors.join('; '),
        400
      );
    }

    // Update user password
    // 更新用户密码
    await UserModel.updatePassword(resetToken.user_id, input.newPassword);

    // Mark token as used
    // 将令牌标记为已使用
    await PasswordResetModel.markAsUsed(input.token);

    // Invalidate any other reset tokens for this user
    // 使该用户的其他重置令牌失效
    await PasswordResetModel.invalidateAllForUser(resetToken.user_id);

    // Revoke all refresh tokens (force re-login on all devices)
    // 撤销所有刷新令牌（强制所有设备重新登录）
    await TokenService.revokeAllTokens(resetToken.user_id);

    logger.info(`Password reset completed for user: ${resetToken.user_id}`);

    return {
      message: '密码已成功重置，请使用新密码登录',
    };
  }

  /**
   * Get current user info from token payload
 * 从令牌载荷获取当前用户信息
   */
  static async getCurrentUser(userId: string): Promise<AuthResponse['user'] | null> {
    const user = await UserModel.findById(userId);
    if (!user) {
      return null;
    }

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

  /**
   * Generate CAPTCHA
 * 生成验证码
   */
  static generateCaptcha() {
    return CaptchaService.generate();
  }

  /**
   * Verify CAPTCHA
 * 验证验证码
   */
  static verifyCaptcha(id: string, code: string): boolean {
    return CaptchaService.verify(id, code);
  }

  /**
   * Get user salt for client-side hashing
   * 获取用户盐值用于客户端哈希
   */
  static async getUserSalt(username: string): Promise<UserSaltResponse | null> {
    return await UserModel.getUserSalt(username);
  }
}
