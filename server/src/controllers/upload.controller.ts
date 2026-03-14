/**
 * Upload Controller
 * 上传控制器
 */

import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../middleware/error.middleware.js';
import { uploadConfig, FileCategory } from '../config/upload.config.js';
import { logger } from '../utils/logger.js';

interface UploadResponse {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: FileCategory;
  unitId: string;
}

export class UploadController {
  /**
   * Upload a single file
   * 上传单个文件
   */
  static uploadFile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: '没有上传文件' },
      });
    }

    const category = req.params.category as FileCategory;
    const unitId = (req.body.unitId as string) || 'general';

    // Validate category
    // 验证类别
    const validCategories: FileCategory[] = ['pdf', 'image', 'video', 'pptx'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CATEGORY', message: '无效的文件类别' },
      });
    }

    // Construct public URL
    // 构建公共 URL
    const relativePath = path.relative(
      uploadConfig.uploadDir,
      req.file.path
    );
    const url = `${uploadConfig.publicUrlPrefix}/${relativePath.replace(/\\/g, '/')}`;

    const response: UploadResponse = {
      url,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      category,
      unitId,
    };

    const durationMs =
      typeof res.locals.uploadStartedAt === 'number'
        ? Date.now() - res.locals.uploadStartedAt
        : undefined;

    logger.info('Upload request completed', {
      user: req.user?.username,
      category,
      unitId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      durationMs,
      ip: req.ip,
      cfRay: req.headers['cf-ray'],
    });

    res.status(201).json({
      success: true,
      data: response,
      message: '文件上传成功',
    });
    return;
  });

  /**
   * Delete an uploaded file
   * 删除已上传的文件
   */
  static deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const { category, unitId, filename } = req.params;

    // Security: Validate inputs to prevent path traversal
    // 安全：验证输入以防止路径遍历
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_FILENAME', message: '无效的文件名' },
      });
    }

    if (category.includes('..') || category.includes('/') || category.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CATEGORY', message: '无效的类别' },
      });
    }

    const filePath = path.join(
      uploadConfig.uploadDir,
      unitId || 'general',
      category,
      filename
    );

    // Ensure the path is within uploads directory
    // 确保路径在上传目录内
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(uploadConfig.uploadDir)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PATH', message: '无效的文件路径' },
      });
    }

    try {
      await fs.promises.unlink(resolvedPath);
      logger.info(`File deleted by ${req.user!.username}: ${filename}`);
      res.json({
        success: true,
        data: null,
        message: '文件删除成功',
      });
      return;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: { code: 'FILE_NOT_FOUND', message: '文件不存在' },
        });
      }
      throw error;
    }
  });

  /**
   * Get upload configuration info
   * 获取上传配置信息
   */
  static getUploadConfig = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        maxFileSize: uploadConfig.maxFileSize,
        allowedExtensions: uploadConfig.allowedExtensions,
        allowedMimeTypes: uploadConfig.allowedMimeTypes,
      },
    });
  });

  /**
   * List files in a directory
   * 列出目录中的文件
   */
  static listFiles = asyncHandler(async (req: Request, res: Response) => {
    const { unitId, category } = req.query;

    const dirPath = path.join(
      uploadConfig.uploadDir,
      (unitId as string) || 'general',
      (category as string) || ''
    );

    // Ensure the path is within uploads directory
    // 确保路径在上传目录内
    const resolvedPath = path.resolve(dirPath);
    if (!resolvedPath.startsWith(uploadConfig.uploadDir)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PATH', message: '无效的路径' },
      });
    }

    try {
      const files = await fs.promises.readdir(resolvedPath);
      const fileList = await Promise.all(
        files.map(async (filename) => {
          const filePath = path.join(resolvedPath, filename);
          const stats = await fs.promises.stat(filePath);
          return {
            filename,
            url: `${uploadConfig.publicUrlPrefix}/${(unitId as string) || 'general'}/${category || ''}/${filename}`.replace(/\/\//g, '/'),
            size: stats.size,
            createdAt: stats.birthtime,
          };
        })
      );

      res.json({
        success: true,
        data: fileList,
      });
      return;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return res.json({
          success: true,
          data: [],
        });
      }
      throw error;
    }
  });
}
