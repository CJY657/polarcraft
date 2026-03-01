/**
 * Authentication Service
 * 认证服务
 *
 * Security Architecture:
 * 安全架构:
 * - Layer 1 (Client): SHA-256(password + salt) - Prevents plaintext transmission
 * - Layer 2 (Server): bcrypt(hash) - Prevents database leak exposure
 *
 * 第一层（客户端）：SHA-256(密码 + 盐值) - 防止明文传输
 * 第二层（服务器）：bcrypt(哈希) - 防止数据库泄露暴露
 */

import { api } from './api';
import {
  preparePasswordForRegistration,
  preparePasswordForLogin,
  type PasswordValidationResult,
  type PasswordPolicy,
} from './password.util';

// =====================================================
// Types / 类型定义
// =====================================================

export interface UserProfile {
  id: string;
  username: string;
  role: 'user' | 'admin';
  avatar_url: string | null;
  email: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: TokenPair;
}

export interface UserSaltResponse {
  salt: string;
  algorithm: string;
}

export interface LoginInput {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterInput {
  username: string;
  password: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// =====================================================
// Auth API Methods / 认证 API 方法
// =====================================================

export const authApi = {
  /**
   * Get user salt for client-side hashing
   * 获取用户盐值用于客户端哈希
   */
  getUserSalt: async (username: string): Promise<UserSaltResponse> => {
    const response = await api.get<UserSaltResponse>(`/api/auth/salt/${encodeURIComponent(username)}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to get user salt');
  },

  /**
   * Register a new user
   * 注册新用户
   *
   * Note: Password is hashed on client side before sending
   * 注意：密码在发送前已在客户端哈希
   */
  register: async (input: RegisterInput): Promise<AuthResponse> => {
    // Pre-hash password on client side (first layer encryption)
    // 在客户端预哈希密码（第一层加密）
    const { hashedPassword, salt } = await preparePasswordForRegistration(input.password);

    const response = await api.post<AuthResponse>('/api/auth/register', {
      username: input.username,
      password: hashedPassword,
      email: input.email,
      clientSalt: salt,
    });
    if (response.success && response.data) {
      // Tokens are set via HTTP-only cookie by backend
      // Token 由后端通过 HTTP-only cookie 设置
      return response.data;
    }
    throw new Error(response.error?.message || 'Registration failed');
  },

  /**
   * Login user
   * 用户登录
   *
   * Note: Password is hashed on client side before sending
   * 注意：密码在发送前已在客户端哈希
   */
  login: async (input: LoginInput): Promise<AuthResponse> => {
    // Get user salt first
    // 首先获取用户盐值
    const { salt } = await authApi.getUserSalt(input.username);

    // Pre-hash password on client side (first layer encryption)
    // 在客户端预哈希密码（第一层加密）
    const hashedPassword = await preparePasswordForLogin(input.password, salt);

    const response = await api.post<AuthResponse>('/api/auth/login', {
      username: input.username,
      password: hashedPassword,
      rememberMe: input.rememberMe,
    });
    if (response.success && response.data) {
      // Tokens are set via HTTP-only cookie by backend
      // Token 由后端通过 HTTP-only cookie 设置
      // rememberMe affects cookie persistence (session vs persistent)
      // rememberMe 影响 cookie 持久性（session vs persistent）
      return response.data;
    }
    throw new Error(response.error?.message || 'Login failed');
  },

  /**
   * Logout user
   * 用户登出
   */
  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout', {});
    // Cookies are cleared by backend
    // Cookie 由后端清除
  },

  /**
   * Refresh access token
   * 刷新访问令牌
   *
   * Note: Refresh token is read from cookie by backend
   * 注意：刷新令牌由后端从 cookie 读取
   */
  refreshToken: async (): Promise<TokenPair> => {
    const response = await api.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
      '/api/auth/refresh',
      {} // Backend reads refresh token from cookie
    );

    if (response.success && response.data) {
      // New tokens are set via HTTP-only cookie by backend
      // 新 token 由后端通过 HTTP-only cookie 设置
      return response.data;
    }
    throw new Error(response.error?.message || 'Token refresh failed');
  },

  /**
   * Get current user
   * 获取当前用户
   */
  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/api/auth/me');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to get user');
  },

  /**
   * Update profile
   * 更新资料
   */
  updateProfile: async (input: Partial<RegisterInput>): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/api/users/profile', input);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to update profile');
  },

  /**
   * Change password
   * 修改密码
   */
  changePassword: async (input: ChangePasswordInput): Promise<void> => {
    const response = await api.post('/api/users/change-password', input);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to change password');
    }
  },

  /**
   * Forgot password
   * 忘记密码
   */
  forgotPassword: async (username: string): Promise<void> => {
    const response = await api.post('/api/auth/forgot-password', { username });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to request password reset');
    }
  },

  /**
   * Reset password
   * 重置密码
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    const response = await api.post('/api/auth/reset-password', { token, newPassword });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to reset password');
    }
  },

  /**
   * Get CAPTCHA
   * 获取验证码
   */
  getCaptcha: async (): Promise<{ id: string; dataUrl: string }> => {
    const response = await api.get<{ id: string; dataUrl: string }>('/api/auth/captcha');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('Failed to get captcha');
  },
};

// Re-export password utilities for use in components
// 重新导出密码工具以供组件使用
export { validatePassword, getPasswordRequirements } from './password.util';
export type { PasswordValidationResult, PasswordPolicy };
