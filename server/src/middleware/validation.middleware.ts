/**
 * Validation Middleware
 * 验证中间件
 *
 * Validates request body using express-validator
 * 使用 express-validator 验证请求体
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult, ValidationChain } from 'express-validator';
import { sendError } from '../utils/response.util.js';

/**
 * Handle validation errors
 * 处理验证错误
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction,
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
      formattedErrors,
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

export const usernameValidation = body('username')
  .trim()
  .isLength({ min: 1, max: 50 })
  .withMessage('用户名长度必须在 1-50 个字符之间')
  .matches(/^[\p{L}\p{N}_-]+$/u)
  .withMessage('用户名只能包含字母（含中文）、数字、下划线和连字符');

export const emailValidation = body('email')
  .optional()
  .trim()
  .isEmail()
  .withMessage('邮箱格式不正确')
  .normalizeEmail();

export const passwordValidation = body('password')
  .trim()
  .isLength({ min: 8 })
  .withMessage('密码长度至少为 8 个字符');

export const currentPasswordValidation = body('currentPassword')
  .trim()
  .notEmpty()
  .withMessage('请提供当前密码');

export const newPasswordValidation = body('newPassword')
  .trim()
  .isLength({ min: 8 })
  .withMessage('新密码长度至少为 8 个字符');

export const captchaIdValidation = body('captchaId')
  .trim()
  .notEmpty()
  .withMessage('请提供验证码 ID');

export const captchaValidation = body('captcha')
  .trim()
  .notEmpty()
  .withMessage('请提供验证码');

export const userIdParamValidation = param('userId')
  .trim()
  .notEmpty()
  .withMessage('用户 ID 不能为空');

export const sessionIdParamValidation = param('sessionId')
  .trim()
  .notEmpty()
  .withMessage('会话 ID 不能为空');

export const tokenValidation = body('token')
  .trim()
  .notEmpty()
  .withMessage('令牌不能为空');

export const clientSaltValidation = body('clientSalt')
  .trim()
  .isLength({ min: 32, max: 128 })
  .withMessage('客户端盐值格式不正确');

export const rememberMeValidation = body('rememberMe')
  .optional()
  .isBoolean()
  .withMessage('记住我必须是布尔值');

// =====================================================
// Predefined Validation Sets / 预定义验证集
// =====================================================

export const validateRegister = validate(
  usernameValidation,
  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('密码长度至少为 8 个字符'),
  emailValidation,
);

export const validateLogin = validate(
  usernameValidation,
  passwordValidation,
  captchaIdValidation.optional(),
  captchaValidation.optional(),
  rememberMeValidation,
);

export const validateChangePassword = validate(
  currentPasswordValidation,
  newPasswordValidation,
  clientSaltValidation,
);

export const validateForgotPassword = validate(
  body('username')
    .trim()
    .notEmpty()
    .withMessage('请提供用户名或邮箱'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
);

export const validateResetPassword = validate(
  tokenValidation,
  clientSaltValidation,
  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('新密码长度至少为 8 个字符'),
);

export const validateResetToken = validate(tokenValidation);

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
    .withMessage('头像 URL 格式不正确'),
);

export const validateCreateFeedback = validate(
  body('category')
    .trim()
    .isIn(['experiment', 'product'])
    .withMessage('反馈类型无效'),
  body('subject')
    .trim()
    .isLength({ min: 4, max: 120 })
    .withMessage('主题长度必须在 4-120 个字符之间'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 4000 })
    .withMessage('反馈内容长度必须在 10-4000 个字符之间'),
  body('courseId')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('实验 ID 过长'),
  body('courseTitle')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('实验标题过长'),
  body('sourcePage')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 120 })
    .withMessage('来源页面标识过长'),
  body('pagePath')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('页面路径过长'),
  body('contactName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 80 })
    .withMessage('联系人名称过长'),
  body('contactEmail')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('联系邮箱格式不正确')
    .normalizeEmail(),
);

export const validateCreateCourseDiscussionComment = validate(
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('评论内容长度必须在 1-2000 个字符之间'),
);
