/**
 * Validation Middleware
 * 验证中间件
 *
 * Validates request body using express-validator
 * 使用 express-validator 验证请求体
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { sendError } from '../utils/response.util.js';
import { logger } from '../utils/logger.js';

/**
 * Handle validation errors
 * 处理验证错误
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
    }));
    sendError(
      res,
      '请求参数验证失败',
      'VALIDATION_ERROR',
      400,
      formattedErrors
    );
    return;
  }
  next();
}

/**
 * Validate middleware factory
 * 验证中间件工厂
 */
export function validate(...validations: ValidationChain[]) {
  return [...validations, handleValidationErrors];
}

// =====================================================
// Common Validation Rules / 常用验证规则
// =====================================================

/**
 * Username validation
 * 用户名验证
 */
export const usernameValidation = body('username')
  .trim()
  .isLength({ min: 1, max: 50 })
  .withMessage('用户名长度必须在 1-50 个字符之间')
  .matches(/^[\p{L}\p{N}_-]+$/u)
  .withMessage('用户名只能包含字母（含中文）、数字、下划线和连字符');

/**
 * Email validation (optional)
 * 邮箱验证（可选）
 */
export const emailValidation = body('email')
  .optional()
  .trim()
  .isEmail()
  .withMessage('邮箱格式不正确')
  .normalizeEmail();

/**
 * Password validation
 * 密码验证
 */
export const passwordValidation = body('password')
  .trim()
  .isLength({ min: 8 })
  .withMessage('密码长度至少为 8 个字符');

/**
 * Current password validation (for password changes)
 * 当前密码验证（用于修改密码）
 */
export const currentPasswordValidation = body('currentPassword')
  .trim()
  .notEmpty()
  .withMessage('请提供当前密码');

/**
 * New password validation (for password changes)
 * 新密码验证（用于修改密码）
 */
export const newPasswordValidation = body('newPassword')
  .trim()
  .isLength({ min: 8 })
  .withMessage('新密码长度至少为 8 个字符');

/**
 * CAPTCHA ID validation
 * 验证码 ID 验证
 */
export const captchaIdValidation = body('captchaId')
  .trim()
  .notEmpty()
  .withMessage('请提供验证码 ID');

/**
 * CAPTCHA validation
 * 验证码验证
 */
export const captchaValidation = body('captcha')
  .trim()
  .notEmpty()
  .withMessage('请提供验证码');

/**
 * User ID parameter validation
 * 用户 ID 参数验证
 */
export const userIdParamValidation = param('userId')
  .trim()
  .notEmpty()
  .withMessage('用户 ID 不能为空');

/**
 * Session ID parameter validation
 * 会话 ID 参数验证
 */
export const sessionIdParamValidation = param('sessionId')
  .trim()
  .notEmpty()
  .withMessage('会话 ID 不能为空');

/**
 * Token validation (for refresh and password reset)
 * Token 验证（用于刷新和密码重置）
 */
export const tokenValidation = body('token')
  .trim()
  .notEmpty()
  .withMessage('令牌不能为空');

/**
 * Remember me validation
 * 记住我验证
 */
export const rememberMeValidation = body('rememberMe')
  .optional()
  .isBoolean()
  .withMessage('记住我必须是布尔值');

// =====================================================
// Predefined Validation Sets / 预定义验证集
// =====================================================

/**
 * Register validation
 * 注册验证
 */
export const validateRegister = validate(
  usernameValidation,
  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('密码长度至少为 8 个字符'),
  emailValidation
);

/**
 * Login validation
 * 登录验证
 */
export const validateLogin = validate(
  usernameValidation,
  passwordValidation,
  captchaIdValidation.optional(),
  captchaValidation.optional(),
  rememberMeValidation
);

/**
 * Change password validation
 * 修改密码验证
 */
export const validateChangePassword = validate(
  currentPasswordValidation,
  newPasswordValidation
);

/**
 * Forgot password validation
 * 忘记密码验证
 */
export const validateForgotPassword = validate(
  body('username')
    .trim()
    .notEmpty()
    .withMessage('请提供用户名或邮箱')
);

/**
 * Reset password validation
 * 重置密码验证
 */
export const validateResetPassword = validate(
  tokenValidation,
  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('新密码长度至少为 8 个字符')
);

/**
 * Update profile validation
 * 更新资料验证
 */
export const validateUpdateProfile = validate(
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在 3-50 个字符之间'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('头像 URL 格式不正确')
);
