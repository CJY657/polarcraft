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
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  content?: string;
  data?: Record<string, any>;
  action_url?: string;
}

// =====================================================
// API Response Types / API 响应类型
// =====================================================

export interface NotificationListResponse {
  notifications: UserNotification[];
  total: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  count: number;
}
