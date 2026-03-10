/**
 * Configuration Management
 * 配置管理
 */

import { config as loadEnv } from 'dotenv';
import { PasswordPolicy } from '../types/auth.types.js';

// Load environment variables
loadEnv();

// =====================================================
// Server Configuration / 服务器配置
// =====================================================

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiUrl:
    process.env.API_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${process.env.PORT || '3001'}`,
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Database / 数据库
  database: {
    uri: process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://127.0.0.1:27017',
    name: process.env.MONGODB_DB_NAME || process.env.DB_NAME || 'polarcraft',
    maxPoolSize: parseInt(
      process.env.DB_MAX_POOL_SIZE || process.env.DB_CONNECTION_LIMIT || '10',
      10
    ),
  },

  // JWT / JWT 配置
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your_access_secret_change_this',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_change_this',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Password Policy / 密码策略
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    requireNumber: process.env.PASSWORD_REQUIRE_NUMBER !== 'false',
    requireSpecialChar: process.env.PASSWORD_REQUIRE_SPECIAL_CHAR !== 'false',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  } as PasswordPolicy & { bcryptRounds: number },

  // Rate Limiting / 速率限制
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // CORS / CORS 配置
  cors: {
    origin:
      process.env.CORS_ORIGIN ||
      process.env.FRONTEND_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      'http://localhost:5173',
  },

  // CAPTCHA / 验证码配置
  captcha: {
    length: parseInt(process.env.CAPTCHA_LENGTH || '4', 10),
    width: parseInt(process.env.CAPTCHA_WIDTH || '120', 10),
    height: parseInt(process.env.CAPTCHA_HEIGHT || '40', 10),
  },

  // Security / 安全配置
  security: {
    csrfSecret: process.env.CSRF_SECRET || 'your_csrf_secret_change_this',
    cookieSecret: process.env.COOKIE_SECRET || 'your_cookie_secret_change_this',
  },

  // Frontend URL / 前端 URL
  frontendUrl:
    process.env.FRONTEND_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.API_URL ||
    'http://localhost:5173',

  // Email / 邮件配置
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@polarcraft.com',
    fromName: process.env.EMAIL_FROM_NAME || 'PolarCraft',
  },

  // Logging / 日志配置
  logging: {
    level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
    enabled: process.env.LOG_ENABLED !== 'false',
  },
} as const;

// =====================================================
// Configuration Validation / 配置验证
// =====================================================

export function validateConfig(): void {
  const requiredEnvVars = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  if (config.isProduction && !process.env.MONGODB_URI && !process.env.DB_URI) {
    requiredEnvVars.push('MONGODB_URI');
  }

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value || value.includes('change_this')) {
      if (config.isProduction) {
        missingVars.push(envVar);
      } else {
        console.warn(`⚠️  Warning: ${envVar} is using default value. Change this in production!`);
      }
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}
