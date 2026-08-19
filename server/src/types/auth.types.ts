/**
 * Authentication Type Definitions
 * 认证类型定义
 */

// =====================================================
// User Types / 用户类型
// =====================================================

/** User role enum / 用户角色枚举 */
export type UserRole = 'user' | 'admin';

/** User identity type / 用户身份类型 */
export const USER_TYPES = ['student', 'teacher'] as const;
export type UserType = (typeof USER_TYPES)[number];

/** User entity / 用户实体 */
export interface User {
  id: string;
  username: string;
  nickname: string | null;
  real_name: string | null;
  show_real_name_publicly?: boolean;
  password_hash: string;
  client_salt: string;
  client_hash_algorithm: string;
  role: UserRole;
  user_type: UserType | null;
  avatar_url: string | null;
  is_active: boolean;
  email: string | null;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

/** Public user profile (without sensitive data) / 公开用户信息 */
export interface UserProfile {
  id: string;
  username: string;
  nickname: string | null;
  real_name: string | null;
  show_real_name_publicly: boolean;
  role: UserRole;
  user_type: UserType | null;
  avatar_url: string | null;
  email: string | null;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

/** Update profile input / 更新资料输入 */
export interface UpdateProfileInput {
  username?: string;
  real_name?: string;
  show_real_name_publicly?: boolean;
  email?: string;
  avatar_url?: string;
  user_type?: UserType;
}

/** Sessions response / 会话响应 */
export interface SessionsResponse {
  sessions: SessionInfo[];
  total: number;
}

/** User registration input / 用户注册输入 */
export interface RegisterInput {
  username: string;
  real_name: string;
  password: string;
  clientSalt: string;
  email: string;
  user_type: UserType;
}

/** User login input / 用户登录输入 */
export interface LoginInput {
  username: string;
  password: string;
  captcha?: string;
  rememberMe?: boolean;
}

/** Get user salt response / 获取用户盐值响应 */
export interface UserSaltResponse {
  salt: string;
  algorithm: string;
}

// =====================================================
// Token Types / Token 类型
// =====================================================

/** JWT Token payload / JWT Token 载荷 */
export interface TokenPayload {
  sub: string;        // User ID
  username: string;
  role: UserRole;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/** Token pair response / Token 对响应 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Refresh token entity / 刷新令牌实体 */
export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  device_info: string | null;
  ip_address: string | null;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
}

/** Session info (for user to view their active sessions) / 会话信息 */
export interface SessionInfo {
  id: string;
  device_info: string | null;
  ip_address: string | null;
  created_at: Date;
  expires_at: Date;
  is_current: boolean;
}

// =====================================================
// Password Reset Types / 密码重置类型
// =====================================================

/** Password reset token entity / 密码重置令牌实体 */
export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

/** Forgot password request / 忘记密码请求 */
export interface ForgotPasswordInput {
  username: string;
}

/** Reset password request / 重置密码请求 */
export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  clientSalt: string;
}

/** Change password request / 修改密码请求 */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  clientSalt: string;
}

// =====================================================
// CAPTCHA Types / 验证码类型
// =====================================================

/** CAPTCHA response / 验证码响应 */
export interface CaptchaResponse {
  id: string;
  dataUrl: string;  // SVG data URL for display
}

// =====================================================
// Auth Response Types / 认证响应类型
// =====================================================

/** Authentication response / 认证响应 */
export interface AuthResponse {
  user: UserProfile;
  tokens: TokenPair;
}

/** Login response / 登录响应 */
export interface LoginResponse extends AuthResponse {
  isNewUser: boolean;
}

// =====================================================
// Error Types / 错误类型
// =====================================================

/** Authentication error codes / 认证错误代码 */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_REVOKED'
  | 'INVALID_CAPTCHA'
  | 'USER_INACTIVE'
  | 'EMAIL_NOT_VERIFIED'
  | 'EMAIL_MISSING'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

/** Authentication error / 认证错误 */
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
