import { NextFunction, Request, Response, Router } from 'express';
import fs from 'fs/promises';
import { FeedbackController } from '../controllers/feedback.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { feedbackRateLimiter } from '../middleware/rate-limit.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { createUploadMiddleware, handleUploadError } from '../middleware/upload.middleware.js';
import { validateCreateFeedback } from '../middleware/validation.middleware.js';
import { getManagedUploadUrlForFile } from '../utils/managed-upload-url.util.js';

const router = Router();
const FEEDBACK_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const feedbackImageUpload = createUploadMiddleware('image', {
  storageScope: 'feedback',
  maxFileSize: FEEDBACK_IMAGE_MAX_SIZE,
  // 10 fields = the 9 the form has always sent + isPublic. Busboy rejects the
  // whole upload with LIMIT_FIELD_COUNT one field over, and the error looks
  // unrelated to whatever added the field — so this has to move in lockstep.
  maxFields: 10,
  maxFieldSize: 16 * 1024,
  maxFiles: 1,
  maxParts: 12,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  mimeExtensionPairs: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  },
  requireMimeAndExtension: true,
});

async function unlinkRejectedFeedbackImage(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

export function hasValidFeedbackImageSignature(
  signature: Uint8Array,
  mimeType: string,
): boolean {
  if (mimeType === 'image/jpeg') {
    return signature.length >= 3
      && signature[0] === 0xff
      && signature[1] === 0xd8
      && signature[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return pngSignature.every((byte, index) => signature[index] === byte);
  }

  if (mimeType === 'image/webp') {
    return signature.length >= 12
      && Buffer.from(signature.subarray(0, 4)).toString('ascii') === 'RIFF'
      && Buffer.from(signature.subarray(8, 12)).toString('ascii') === 'WEBP';
  }

  return false;
}

export async function validateFeedbackImageContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.file) {
    next();
    return;
  }

  let signature: Buffer;
  let bytesRead: number;

  try {
    const file = await fs.open(req.file.path, 'r');
    signature = Buffer.alloc(12);
    bytesRead = 0;

    try {
      ({ bytesRead } = await file.read(signature, 0, signature.length, 0));
    } finally {
      await file.close();
    }
  } catch (error) {
    const cleanupRejectedUpload = res.locals.cleanupRejectedUpload;
    if (typeof cleanupRejectedUpload === 'function') {
      try {
        await cleanupRejectedUpload();
      } catch (cleanupError) {
        next(cleanupError);
        return;
      }
    }
    req.file = undefined;
    next(error);
    return;
  }

  if (hasValidFeedbackImageSignature(signature.subarray(0, bytesRead), req.file.mimetype)) {
    next();
    return;
  }

  try {
    const cleanupRejectedUpload = res.locals.cleanupRejectedUpload;
    if (typeof cleanupRejectedUpload === 'function') {
      await cleanupRejectedUpload();
    }
    req.file = undefined;
    res.error('图片内容与文件格式不匹配', 'INVALID_IMAGE_CONTENT', 400);
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/feedback
 * @desc    Submit feedback about experiments or the platform
 * @access  Public, with user metadata attached when authenticated
 */
router.post(
  '/',
  feedbackRateLimiter,
  optionalAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    req.params.category = 'image';
    res.locals.uploadStartedAt = Date.now();
    res.locals.uploadMaxFileSize = FEEDBACK_IMAGE_MAX_SIZE;
    feedbackImageUpload.single('file')(req, res, (error) => {
      if (error) {
        handleUploadError(error, req, res, next);
        return;
      }

      if (req.file) {
        const imageUrl = getManagedUploadUrlForFile(req.file.path);
        if (!imageUrl) {
          const filePath = req.file.path;
          void unlinkRejectedFeedbackImage(filePath).then(
            () => next(new Error('Uploaded feedback image is outside the managed upload directory')),
            next,
          );
          return;
        }

        const filePath = req.file.path;
        res.locals.feedbackImageUrl = imageUrl;
        res.locals.cleanupRejectedUpload = async () => {
          await unlinkRejectedFeedbackImage(filePath);
          res.locals.cleanupRejectedUpload = undefined;
        };
      }
      next();
    });
  },
  validateFeedbackImageContent,
  validateCreateFeedback,
  FeedbackController.create,
);

router.use(authenticate);

/**
 * @route   GET /api/feedback/public
 * @desc    Newest submissions the authors chose to publish
 * @access  Any signed-in user — deliberately not admin-only
 */
router.get('/public', FeedbackController.listPublic);

router.get('/', requireAdmin, FeedbackController.list);
router.patch('/:id/visibility', requireAdmin, FeedbackController.setVisibility);
router.delete('/:id', requireAdmin, FeedbackController.remove);

export default router;
