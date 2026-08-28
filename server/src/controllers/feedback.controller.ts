import type { Request, Response } from 'express';
import { ManagedUploadCleanupService } from '../services/managed-upload-cleanup.service.js';
import { FeedbackService } from '../services/feedback.service.js';
import { getManagedUploadUrlForFile } from '../utils/managed-upload-url.util.js';
import { logger } from '../utils/logger.js';

function getIpAddress(req: Request): string | null {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }

  return req.ip || req.socket.remoteAddress || null;
}

export class FeedbackController {
  static async create(req: Request, res: Response): Promise<void> {
    const imageUrl = (res.locals.feedbackImageUrl as string | undefined)
      ?? (req.file ? getManagedUploadUrlForFile(req.file.path) : null);

    try {
      const result = await FeedbackService.submitFeedback({
        category: req.body.category,
        subject: req.body.subject.trim(),
        content: req.body.content.trim(),
        course_id: req.body.courseId?.trim() || null,
        course_title: req.body.courseTitle?.trim() || null,
        source_page: req.body.sourcePage?.trim() || null,
        page_path: req.body.pagePath?.trim() || null,
        contact_name: req.body.contactName?.trim() || req.user?.username || null,
        contact_email: req.body.contactEmail?.trim() || null,
        image_url: imageUrl,
        user_id: req.user?.sub || null,
        username: req.user?.username || null,
        user_role: req.user?.role || null,
        ip_address: getIpAddress(req),
        user_agent: req.headers['user-agent'] || null,
        // multipart 会把布尔值变成字符串，两种形态都要挡住。
        // Only an explicit opt-out keeps a submission off the wall; the
        // anonymous case is handled in FeedbackService.
        is_public: req.body.isPublic !== 'false' && req.body.isPublic !== false,
      });

      res.locals.cleanupRejectedUpload = undefined;
      res.success(result, '反馈已提交', 201);
    } catch (error) {
      if (imageUrl) {
        await ManagedUploadCleanupService.cleanupUrls([imageUrl], {
          reason: 'feedback-create-failed',
        });
      }
      logger.error('Create feedback error:', error);
      res.error('提交反馈失败，请稍后再试', 'SERVER_ERROR', 500);
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const category =
        req.query.category === 'experiment' || req.query.category === 'product'
          ? req.query.category
          : undefined;
      const limit =
        typeof req.query.limit === 'string'
          ? Number.parseInt(req.query.limit, 10)
          : undefined;

      const result = await FeedbackService.listFeedback({
        category,
        limit,
      });

      res.success(result);
    } catch (error) {
      logger.error('List feedback error:', error);
      res.error('获取反馈列表失败，请稍后再试', 'SERVER_ERROR', 500);
    }
  }

  static async listPublic(_req: Request, res: Response): Promise<void> {
    try {
      const result = await FeedbackService.listPublicFeedback();

      res.success(result);
    } catch (error) {
      logger.error('List public feedback error:', error);
      res.error('获取公开反馈失败，请稍后再试', 'SERVER_ERROR', 500);
    }
  }

  static async setVisibility(req: Request, res: Response): Promise<void> {
    try {
      const isPublic = req.body.is_public;

      if (typeof isPublic !== 'boolean') {
        res.error('可见性参数无效', 'INVALID_VISIBILITY', 400);
        return;
      }

      const updated = await FeedbackService.setFeedbackVisibility(req.params.id, isPublic);

      if (!updated) {
        res.error('反馈记录不存在', 'FEEDBACK_NOT_FOUND', 404);
        return;
      }

      res.success(null, isPublic ? '反馈已公开' : '反馈已隐藏', 200);
    } catch (error) {
      logger.error('Set feedback visibility error:', error);
      res.error('更新反馈可见性失败，请稍后再试', 'SERVER_ERROR', 500);
    }
  }

  static async remove(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await FeedbackService.deleteFeedback(req.params.id);

      if (!deleted) {
        res.error('反馈记录不存在', 'FEEDBACK_NOT_FOUND', 404);
        return;
      }

      res.success(null, '反馈已永久删除', 200);
    } catch (error) {
      logger.error('Delete feedback error:', error);
      res.error('删除反馈失败，请稍后再试', 'SERVER_ERROR', 500);
    }
  }
}
