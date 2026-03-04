/**
 * Inbox Page
 * 收件箱页面
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/utils/classNames';
import { PersistentHeader } from '@/components/shared/PersistentHeader';
import {
  Bell,
  UserPlus,
  CheckCircle,
  XCircle,
  MessageCircle,
  Megaphone,
  Check,
  Trash2,
  ChevronLeft,
} from 'lucide-react';
import type { NotificationType, UserNotification } from '@/lib/notification.service';

type FilterType = 'all' | 'unread' | 'read';

// Get icon based on notification type
const getNotificationIcon = (type: NotificationType) => {
  const icons: Record<NotificationType, typeof Bell> = {
    project_invite: UserPlus,
    application_approved: CheckCircle,
    application_rejected: XCircle,
    comment_reply: MessageCircle,
    system: Megaphone,
  };
  return icons[type] || Bell;
};

// Get icon color based on notification type
const getNotificationIconColor = (type: NotificationType, theme: string) => {
  const colors: Record<NotificationType, string> = {
    project_invite: theme === 'dark' ? 'text-blue-400 bg-blue-900/30' : 'text-blue-500 bg-blue-100',
    application_approved: theme === 'dark' ? 'text-green-400 bg-green-900/30' : 'text-green-500 bg-green-100',
    application_rejected: theme === 'dark' ? 'text-red-400 bg-red-900/30' : 'text-red-500 bg-red-100',
    comment_reply: theme === 'dark' ? 'text-purple-400 bg-purple-900/30' : 'text-purple-500 bg-purple-100',
    system: theme === 'dark' ? 'text-yellow-400 bg-yellow-900/30' : 'text-yellow-500 bg-yellow-100',
  };
  return colors[type] || (theme === 'dark' ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-100');
};

// Get notification type text
const getNotificationTypeText = (type: NotificationType, t: (key: string) => string) => {
  const texts: Record<NotificationType, string> = {
    project_invite: t('inbox.types.projectInvite', '课题邀请'),
    application_approved: t('inbox.types.applicationApproved', '申请通过'),
    application_rejected: t('inbox.types.applicationRejected', '申请被拒'),
    comment_reply: t('inbox.types.commentReply', '评论回复'),
    system: t('inbox.types.system', '系统通知'),
  };
  return texts[type] || type;
};

// Format relative time
const formatRelativeTime = (dateString: string, t: (key: string, options?: any) => string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('common.justNow', '刚刚');
  if (diffMins < 60) return t('common.minutesAgo', '{{count}} 分钟前', { count: diffMins });
  if (diffHours < 24) return t('common.hoursAgo', '{{count}} 小时前', { count: diffHours });
  if (diffDays < 7) return t('common.daysAgo', '{{count}} 天前', { count: diffDays });
  return date.toLocaleDateString();
};

export default function InboxPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');

  const {
    notifications,
    unreadCount,
    total,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications({ limit: 50 });
  }, [fetchNotifications]);

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  // Handle notification click
  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Handle delete notification
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  // Filter button classes
  const filterButtonClasses = (isActive: boolean) =>
    cn(
      'px-3 py-1.5 text-sm rounded-lg transition-colors',
      isActive
        ? theme === 'dark'
          ? 'bg-cyan-900/50 text-cyan-400'
          : 'bg-cyan-100 text-cyan-700'
        : theme === 'dark'
          ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
          : 'text-gray-500 hover:text-gray-600 hover:bg-gray-100'
    );

  return (
    <div
      className={cn(
        'min-h-screen',
        theme === 'dark'
          ? 'bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]'
          : 'bg-gradient-to-br from-[#fff5eb] via-[#fef3e2] to-[#fff5eb]'
      )}
    >
      <PersistentHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className={cn(
              'flex items-center gap-1 text-sm mb-4 transition-colors',
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-500 hover:text-gray-600'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            {t('common.back', '返回')}
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-[var(--accent-cyan)]" />
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {t('inbox.title', '收件箱')}
              </h1>
              {unreadCount > 0 && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-sm font-medium',
                    theme === 'dark'
                      ? 'bg-cyan-900/50 text-cyan-400'
                      : 'bg-cyan-100 text-cyan-700'
                  )}
                >
                  {t('inbox.unreadCount', '{{count}} 条未读', { count: unreadCount })}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors',
                  theme === 'dark'
                    ? 'text-cyan-400 hover:bg-cyan-900/30'
                    : 'text-cyan-600 hover:bg-cyan-100'
                )}
              >
                <Check className="w-4 h-4" />
                {t('inbox.markAllRead', '全部标记已读')}
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={filterButtonClasses(filter === 'all')}
          >
            {t('inbox.filter.all', '全部')}
            <span className="ml-1 opacity-60">({total})</span>
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={filterButtonClasses(filter === 'unread')}
          >
            {t('inbox.filter.unread', '未读')}
            <span className="ml-1 opacity-60">({unreadCount})</span>
          </button>
          <button
            onClick={() => setFilter('read')}
            className={filterButtonClasses(filter === 'read')}
          >
            {t('inbox.filter.read', '已读')}
            <span className="ml-1 opacity-60">({total - unreadCount})</span>
          </button>
        </div>

        {/* Notification List */}
        <div
          className={cn(
            'rounded-xl border overflow-hidden',
            theme === 'dark'
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-white border-gray-200'
          )}
        >
          {isLoading ? (
            <div className="px-6 py-12 text-center text-[var(--text-secondary)]">
              {t('common.loading', '加载中...')}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="px-6 py-12 text-center text-[var(--text-secondary)]">
              {filter === 'all'
                ? t('inbox.empty', '暂无通知')
                : filter === 'unread'
                  ? t('inbox.emptyUnread', '暂无未读通知')
                  : t('inbox.emptyRead', '暂无已读通知')}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColorClass = getNotificationIconColor(notification.type, theme);

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors',
                      'hover:bg-[var(--bg-tertiary)]',
                      !notification.is_read && 'bg-[var(--bg-tertiary)]/30'
                    )}
                  >
                    {/* Icon */}
                    <div className={cn('flex-shrink-0 p-2 rounded-lg', iconColorClass)}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded',
                              theme === 'dark'
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {getNotificationTypeText(notification.type, t)}
                          </span>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-cyan-500" />
                          )}
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] flex-shrink-0">
                          {formatRelativeTime(notification.created_at, t)}
                        </span>
                      </div>

                      <p
                        className={cn(
                          'mt-1',
                          notification.is_read
                            ? 'text-[var(--text-secondary)]'
                            : 'text-[var(--text-primary)] font-medium'
                        )}
                      >
                        {notification.title}
                      </p>

                      {notification.content && (
                        <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      className={cn(
                        'flex-shrink-0 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100',
                        'text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10',
                        notification.is_read ? 'opacity-100' : 'opacity-0'
                      )}
                      title={t('inbox.delete', '删除')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
