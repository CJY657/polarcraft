/**
 * InboxDropdown Component
 * 收件箱下拉组件
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/utils/classNames';
import {
  Bell,
  UserPlus,
  CheckCircle,
  XCircle,
  MessageCircle,
  Megaphone,
  ChevronRight,
} from 'lucide-react';
import type { NotificationType, UserNotification } from '@/lib/notification.service';

interface InboxDropdownProps {
  className?: string;
}

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
    project_invite: theme === 'dark' ? 'text-blue-400' : 'text-blue-500',
    application_approved: theme === 'dark' ? 'text-green-400' : 'text-green-500',
    application_rejected: theme === 'dark' ? 'text-red-400' : 'text-red-500',
    comment_reply: theme === 'dark' ? 'text-purple-400' : 'text-purple-500',
    system: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500',
  };
  return colors[type] || (theme === 'dark' ? 'text-gray-400' : 'text-gray-500');
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

export function InboxDropdown({ className }: InboxDropdownProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead } =
    useNotificationStore();

  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ limit: 5 });
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    setIsOpen(false);
  };

  // Handle view all click
  const handleViewAll = () => {
    navigate('/inbox');
    setIsOpen(false);
  };

  // Dropdown panel classes
  const dropdownClasses = 'glass-panel-strong shadow-[0_24px_60px_-32px_rgba(2,10,22,0.56)]';

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'glass-button relative rounded-xl p-2',
          'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-tertiary)]'
        )}
        title={t('inbox.title', '收件箱')}
      >
        <Bell className="w-4 h-4" />
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1',
              'bg-red-500 text-white text-xs font-medium rounded-full',
              'flex items-center justify-center'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 z-50 mt-2 w-80 rounded-[1.5rem] border py-2',
            dropdownClasses
          )}
        >
          {/* Header */}
          <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              {t('inbox.title', '收件箱')}
            </h3>
            {unreadCount > 0 && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  theme === 'dark'
                    ? 'bg-cyan-900/50 text-cyan-400'
                    : 'bg-cyan-100 text-cyan-700'
                )}
              >
                {t('inbox.unreadCount', '{{count}} 条未读', { count: unreadCount })}
              </span>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-[var(--text-secondary)] text-sm">
                {t('common.loading', '加载中...')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[var(--text-secondary)] text-sm">
                {t('inbox.empty', '暂无通知')}
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationIconColor(notification.type, theme);

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] transition-colors',
                      'border-b border-[var(--border-color)] last:border-b-0',
                      !notification.is_read && 'bg-[var(--bg-tertiary)]/50'
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              'text-sm truncate',
                              notification.is_read
                                ? 'text-[var(--text-secondary)]'
                                : 'text-[var(--text-primary)] font-medium'
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-500 mt-1.5" />
                          )}
                        </div>
                        {notification.content && (
                          <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                            {notification.content}
                          </p>
                        )}
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {formatRelativeTime(notification.created_at, t)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* View All Button */}
          <div className="px-2 pt-2 border-t border-[var(--border-color)]">
            <button
              onClick={handleViewAll}
              className={cn(
                'w-full px-4 py-2 text-sm text-center rounded-md transition-colors',
                'text-[var(--accent-cyan)] hover:bg-[var(--bg-tertiary)]',
                'flex items-center justify-center gap-1'
              )}
            >
              {t('inbox.viewAll', '查看全部通知')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
