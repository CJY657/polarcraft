import { FeedbackModel } from '../models/feedback.model.js';
import { ManagedUploadCleanupService } from './managed-upload-cleanup.service.js';
import type {
  CreateFeedbackInput,
  FeedbackListResult,
  FeedbackSubmissionResult,
  ListFeedbackOptions,
  PublicFeedbackListResult,
} from '../types/feedback.types.js';
import { logger } from '../utils/logger.js';

/** ponytail: fixed page size, no pagination. Add 加载更多 when the wall gets long. */
const PUBLIC_WALL_LIMIT = 30;

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
      image_url: input.image_url || null,
      user_id: input.user_id || null,
      username: input.username || null,
      user_role: input.user_role || null,
      recipient_email: null,
      email_status: 'not_configured',
      email_sent_at: null,
      ip_address: input.ip_address || null,
      user_agent: input.user_agent || null,
      // 两个条件缺一不可：匿名提交永不公开；未显式取消勾选则默认公开。
      // Anonymous submissions never reach the wall; everything else is public
      // unless the submitter cleared the checkbox.
      is_public: Boolean(input.user_id) && input.is_public !== false,
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
      items: items.map((item) => ({
        ...item,
        image_url: item.image_url ?? null,
      })),
      total,
    };
  }

  static async listPublicFeedback(): Promise<PublicFeedbackListResult> {
    return { items: await FeedbackModel.listPublic(PUBLIC_WALL_LIMIT) };
  }

  /**
   * Admin hide/unhide. Reversible on purpose: deleting an abusive post also
   * destroys the ip_address / user_agent / username you would need to act on
   * it, so hiding is the first response and deleteFeedback the second.
   * 管理员隐藏/恢复。刻意可逆：删除会连同排查所需的记录一起销毁。
   */
  static async setFeedbackVisibility(id: string, isPublic: boolean): Promise<boolean> {
    const updated = await FeedbackModel.setVisibility(id, isPublic);

    if (updated) {
      logger.info(`Feedback visibility set to ${isPublic}: ${id}`);
    }

    return updated;
  }

  static async deleteFeedback(id: string): Promise<boolean> {
    const existing = await FeedbackModel.getById(id);
    if (!existing) {
      return false;
    }

    const deleted = await FeedbackModel.deleteById(id);

    if (deleted) {
      await ManagedUploadCleanupService.cleanupUrls([existing.image_url], {
        reason: 'feedback-delete',
      });
      logger.info(`Feedback deleted: ${id}`);
    }

    return deleted;
  }
}
