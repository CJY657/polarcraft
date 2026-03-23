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
  user_id?: string | null;
  username?: string | null;
  user_role?: UserRole | null;
  ip_address?: string | null;
  user_agent?: string | null;
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
  user_id: string | null;
  username: string | null;
  user_role: UserRole | null;
  recipient_email: string | null;
  email_status: FeedbackEmailStatus;
  email_sent_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface FeedbackSubmissionResult {
  id: string;
  emailStatus: FeedbackEmailStatus;
}
