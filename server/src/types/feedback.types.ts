import type { UserRole } from './auth.types.js';

export type FeedbackCategory = 'experiment' | 'product';
export type FeedbackEmailStatus = 'sent' | 'not_configured' | 'failed';

export interface CreateFeedbackInput {
  category: FeedbackCategory;
  subject: string;
  content: string;
  course_id?: string | null;
  course_title?: string | null;
  source_page?: string | null;
  page_path?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  image_url?: string | null;
  user_id?: string | null;
  username?: string | null;
  user_role?: UserRole | null;
  ip_address?: string | null;
  user_agent?: string | null;
  is_public?: boolean;
}

export interface FeedbackSubmission {
  id: string;
  category: FeedbackCategory;
  subject: string;
  content: string;
  course_id: string | null;
  course_title: string | null;
  source_page: string | null;
  page_path: string | null;
  contact_name: string | null;
  contact_email: string | null;
  image_url: string | null;
  user_id: string | null;
  username: string | null;
  user_role: UserRole | null;
  recipient_email: string | null;
  email_status: FeedbackEmailStatus;
  email_sent_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
  /**
   * Legacy documents predate the public feedback wall and simply lack this
   * field, so `{ is_public: true }` never matches them and they stay
   * admin-only without a backfill. Keep it optional for that reason.
   * 历史记录没有这个字段，因而不会被公开查询匹配到，无需数据迁移。
   */
  is_public?: boolean;
  created_at: Date;
}

/**
 * Whitelisted shape returned by the login-gated public wall. Never widen this
 * without re-reading the projection in FeedbackModel.listPublic.
 * 公开墙返回的字段白名单，扩字段前先看 FeedbackModel.listPublic 的投影。
 */
export interface PublicFeedbackItem {
  id: string;
  category: FeedbackCategory;
  subject: string;
  content: string;
  course_title: string | null;
  username: string | null;
  created_at: Date;
}

export interface PublicFeedbackListResult {
  items: PublicFeedbackItem[];
}

export interface FeedbackSubmissionResult {
  id: string;
}

export interface ListFeedbackOptions {
  category?: FeedbackCategory;
  limit?: number;
}

export interface FeedbackListResult {
  items: FeedbackSubmission[];
  total: number;
}
