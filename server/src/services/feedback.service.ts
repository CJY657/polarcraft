import { FeedbackModel } from '../models/feedback.model.js';
import type {
  CreateFeedbackInput,
  FeedbackListResult,
  FeedbackSubmissionResult,
  ListFeedbackOptions,
} from '../types/feedback.types.js';
import { logger } from '../utils/logger.js';

function normalizeLimit(limit?: number): number {
  if (!Number.isFinite(limit)) {
    return 50;
  }

  return Math.min(Math.max(Math.trunc(limit as number), 1), 200);
}

export class FeedbackService {
  static async submitFeedback(input: CreateFeedbackInput): Promise<FeedbackSubmissionResult> {
    const savedFeedback = await FeedbackModel.create({
      category: input.category,
      subject: input.subject,
      content: input.content,
      course_id: input.course_id || null,
      course_title: input.course_title || null,
      source_page: input.source_page || null,
      page_path: input.page_path || null,
      contact_name: input.contact_name || null,
      contact_email: input.contact_email || null,
      user_id: input.user_id || null,
      username: input.username || null,
      user_role: input.user_role || null,
      recipient_email: null,
      email_status: 'not_configured',
      email_sent_at: null,
      ip_address: input.ip_address || null,
      user_agent: input.user_agent || null,
    });

    logger.info(`Feedback submitted: ${savedFeedback.id} (${input.category})`);

    return {
      id: savedFeedback.id,
    };
  }

  static async listFeedback(options: ListFeedbackOptions = {}): Promise<FeedbackListResult> {
    const limit = normalizeLimit(options.limit);
    const [items, total] = await Promise.all([
      FeedbackModel.list({
        category: options.category,
        limit,
      }),
      FeedbackModel.count(options.category),
    ]);

    return {
      items,
      total,
    };
  }
}
