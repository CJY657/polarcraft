/**
 * File Upload Middleware
 * 文件上传中间件
 */

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { uploadConfig, FileCategory } from '../config/upload.config.js';
import { logger } from '../utils/logger.js';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${Number(value.toFixed(value >= 10 || exponent === 0 ? 0 : 1))} ${units[exponent]}`;
}

// Ensure upload directory exists
// 确保上传目录存在
function ensureUploadDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created upload directory: ${dir}`);
  }
}

// Storage configuration
// 存储配置
const createStorage = (category: FileCategory) => {
  return multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      // Include unit ID in path if provided
      // 如果提供了 unit ID，则包含在路径中
      const unitId = (req.body.unitId as string) || 'general';
      const uploadPath = path.join(uploadConfig.uploadDir, unitId, category);
      ensureUploadDir(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      // Generate unique filename with original extension
      // 生成带有原始扩展名的唯一文件名
      const ext = path.extname(file.originalname).toLowerCase() ||
                     uploadConfig.allowedExtensions[category]?.[0] || '';
      const uniqueName = `${uuidv4()}${ext}`;
      cb(null, uniqueName);
    },
  });
};

// File filter for validation
// 文件过滤器用于验证
const createFileFilter = (category: FileCategory) => {
  return (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ): void => {
    const allowedMimes = uploadConfig.allowedMimeTypes[category];
    const allowedExts = uploadConfig.allowedExtensions[category];

    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    // Check both MIME type and extension
    // 同时检查 MIME 类型和扩展名
    if (allowedMimes.includes(mime) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed extensions: ${allowedExts.join(', ')}`));
    }
  };
};

// Create multer instance for each category
// 为每个类别创建 multer 实例
export const createUploadMiddleware = (category: FileCategory) => {
  const maxSize = uploadConfig.maxFileSize[category] || uploadConfig.maxFileSize.default;

  return multer({
    storage: createStorage(category),
    fileFilter: createFileFilter(category),
    limits: {
    fileSize: maxSize,
  },
  });
};

// Error handling wrapper
// 错误处理包装器
export const handleUploadError = (err: any, req: Request, res: any, next: any) => {
  const durationMs =
    typeof res?.locals?.uploadStartedAt === 'number'
      ? Date.now() - res.locals.uploadStartedAt
      : undefined;
  const logContext = {
    category: req.params.category,
    unitId: typeof req.body?.unitId === 'string' ? req.body.unitId : undefined,
    user: req.user?.username,
    ip: req.ip,
    cfRay: req.headers['cf-ray'],
    contentLength: req.headers['content-length'],
    durationMs,
  };

  if (err instanceof multer.MulterError) {
    logger.warn(`Upload rejected by multer: ${err.code}`, logContext);
    if (err.code === 'LIMIT_FILE_SIZE') {
      const category = req.params.category as FileCategory;
      const limit =
        uploadConfig.maxFileSize[category] || uploadConfig.maxFileSize.default;
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `文件大小超出限制，当前类别最大允许 ${formatFileSize(limit)}`,
        },
      });
    }
    return res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: `上传错误: ${err.message}` },
    });
  }

  if (err) {
    logger.error('Upload request failed', {
      ...logContext,
      error: err.message,
    });
    return res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: err.message },
    });
  }

  next();
};

// Delete file utility
// 删除文件工具
export const deleteUploadedFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        logger.error(`Failed to delete file: ${filePath}`, err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Get file path from URL
// 从 URL 获取文件路径
export const getFilePathFromUrl = (url: string): string | null => {
  if (!url.startsWith(uploadConfig.publicUrlPrefix)) {
    return null;
  }
  const relativePath = url.replace(uploadConfig.publicUrlPrefix, '');
  return path.join(uploadConfig.uploadDir, relativePath);
};
