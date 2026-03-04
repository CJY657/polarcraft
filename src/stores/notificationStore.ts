/**
 * Notification Store
 * 通知状态管理
 */

import { create } from 'zustand';
import {
  notificationApi,
  UserNotification,
  NotificationListResponse,
} from '@/lib/notification.service';

interface NotificationState {
  // State
  notifications: UserNotification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) => Promise<NotificationListResponse>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;

  // Utility
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  total: 0,
  isLoading: false,
  error: null,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...initialState,

  // =====================================================
  // Fetch Actions / 获取操作
  // =====================================================

  fetchNotifications: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const result = await notificationApi.getNotifications(options);
      set({
        notifications: result.notifications,
        total: result.total,
        unreadCount: result.unread_count,
        isLoading: false,
      });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取通知失败',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  // =====================================================
  // Update Actions / 更新操作
  // =====================================================

  markAsRead: async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '标记已读失败',
      });
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '标记已读失败',
      });
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      set((state) => {
        const notification = state.notifications.find((n) => n.id === notificationId);
        const wasUnread = notification && !notification.is_read;
        return {
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          total: Math.max(0, state.total - 1),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除通知失败',
      });
      throw error;
    }
  },

  // =====================================================
  // Utility / 工具方法
  // =====================================================

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
