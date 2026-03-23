import type { Request, Response } from 'express';
import { FeedbackService } from '../services/feedback.service.js';
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
        user_id: req.user?.sub || null,
        username: req.user?.username || null,
        user_role: req.user?.role || null,
        ip_address: getIpAddress(req),
        user_agent: req.headers['user-agent'] || null,
      });

      res.success(result, '反馈已提交', 201);
    } catch (error) {
      logger.error('Create feedback error:', error);
      res.error('提交反馈失败，请稍后再试', 'SERVER_ERROR', 500);
    }
  }
}
