/**
 * Notification Service
 * 通知 API 服务
 */

import { api } from './api';

// =====================================================
// Types / 类型定义
// =====================================================

export type NotificationType =
  | 'project_invite'
  | 'application_approved'
  | 'application_rejected'
  | 'comment_reply'
  | 'system';

export interface UserNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: UserNotification[];
  total: number;
  unread_count: number;
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
// Notification API Methods / 通知 API 方法
// =====================================================

export const notificationApi = {
  /**
   * Get user's notifications
   * 获取用户的通知列表
   */
  getNotifications: async (options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationListResponse> => {
    const params = new URLSearchParams();
    if (options?.limit) {
      params.append('limit', String(options.limit));
    }
    if (options?.offset) {
      params.append('offset', String(options.offset));
    }
    if (options?.unreadOnly) {
      params.append('unread', 'true');
    }
    const queryString = params.toString();
    const url = queryString ? `/api/notifications?${queryString}` : '/api/notifications';

    const response = await api.get<NotificationListResponse>(url);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取通知失败');
  },

  /**
   * Get unread notification count
   * 获取未读通知数量
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/api/notifications/unread-count');
    if (response.success && response.data) {
      return response.data.count;
    }
    throw new Error(response.error?.message || '获取未读数量失败');
  },

  /**
   * Mark notification as read
   * 标记通知为已读
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    if (!response.success) {
      throw new Error(response.error?.message || '标记已读失败');
    }
  },

  /**
   * Mark all notifications as read
   * 标记所有通知为已读
   */
  markAllAsRead: async (): Promise<void> => {
    const response = await api.put('/api/notifications/read-all');
    if (!response.success) {
      throw new Error(response.error?.message || '标记已读失败');
    }
  },

  /**
   * Delete notification
   * 删除通知
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '删除通知失败');
    }
  },
};
