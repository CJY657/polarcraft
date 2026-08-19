/**
 * Notification Types
 * 通知系统类型定义
 */

// =====================================================
// Notification Type / 通知类型
// =====================================================

export type NotificationType =
  | 'project_invite'
  | 'application_approved'
  | 'application_rejected'
  | 'comment_reply'
  | 'leadership_transfer'
  | 'system';

// =====================================================
// User Notification / 用户通知
// =====================================================

export interface UserNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  action_url: string | null;
  created_at: Date;
  expires_at?: Date | null;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  content?: string | null;
  data?: Record<string, any>;
  action_url?: string;
  expires_at?: Date;
}
