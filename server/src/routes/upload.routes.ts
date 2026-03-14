/**
 * Upload Routes
 * 上传路由
 */

import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import {
  createUploadMiddleware,
  handleUploadError,
} from '../middleware/upload.middleware.js';
import { FileCategory } from '../config/upload.config.js';
import { logger } from '../utils/logger.js';

const router = Router();

// All upload routes require authentication and admin role
// 所有上传路由需要认证和管理员角色
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   POST /api/upload/:category
 * @desc    Upload a file of specified category
 * @access  Private (Admin)
 * @param   category - One of: pdf, image, video, pptx
 * @body    file - The file to upload
 * @body    unitId - Optional unit ID for organizing files
 */
router.post(
  '/:category',
  (req, res, next): void => {
    const category = req.params.category as FileCategory;
    const validCategories: FileCategory[] = ['pdf', 'image', 'video', 'pptx'];

    if (!validCategories.includes(category)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_CATEGORY', message: '无效的文件类别' },
      });
      return;
    }

    res.locals.uploadStartedAt = Date.now();
    logger.info('Upload request started', {
      category,
      user: req.user?.username,
      ip: req.ip,
      cfRay: req.headers['cf-ray'],
      contentLength: req.headers['content-length'],
    });

    const upload = createUploadMiddleware(category);
    upload.single('file')(req, res, (err) => {
      if (err) {
        handleUploadError(err, req, res, next);
        return;
      }
      next();
    });
  },
  UploadController.uploadFile
);

/**
 * @route   DELETE /api/upload/:unitId/:category/:filename
 * @desc    Delete an uploaded file
 * @access  Private (Admin)
 */
router.delete(
  '/:unitId/:category/:filename',
  UploadController.deleteFile
);

/**
 * @route   GET /api/upload/files
 * @desc    List uploaded files
 * @access  Private (Admin)
 * @query   unitId - Optional unit ID filter
 * @query   category - Optional category filter
 */
router.get('/files', UploadController.listFiles);

/**
 * @route   GET /api/upload/config
 * @desc    Get upload configuration
 * @access  Private (Admin)
 */
router.get('/config', UploadController.getUploadConfig);

export default router;
