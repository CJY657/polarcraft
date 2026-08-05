// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InboxPage from './InboxPage';
import type { UserNotification } from '@/lib/notification.service';

const mocks = vi.hoisted(() => ({
  notifications: [] as UserNotification[],
  fetchNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/components/shared/PersistentHeader', () => ({
  PersistentHeader: () => <div data-testid="persistent-header" />,
}));

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: () => ({
    notifications: mocks.notifications,
    unreadCount: mocks.notifications.filter((notification) => !notification.is_read).length,
    total: mocks.notifications.length,
    isLoading: false,
    fetchNotifications: mocks.fetchNotifications,
    markAsRead: mocks.markAsRead,
    markAllAsRead: mocks.markAllAsRead,
    deleteNotification: mocks.deleteNotification,
  }),
}));

function createNotification(overrides: Partial<UserNotification>): UserNotification {
  return {
    id: 'notification-1',
    user_id: 'user-1',
    type: 'comment_reply',
    title: '新的课题讨论',
    content: '请看最新讨论',
    data: null,
    is_read: false,
    action_url: '/lab/projects/project-1#discussion-comments',
    created_at: '2026-06-20T08:00:00.000Z',
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();
  const state = location.state as { notificationJumpAt?: number } | null;
  return (
    <>
      <div data-testid="location">{`${location.pathname}${location.hash}`}</div>
      <div data-testid="notification-jump-state">
        {typeof state?.notificationJumpAt === 'number' ? 'jump' : 'none'}
      </div>
    </>
  );
}

function renderInbox() {
  return render(
    <MemoryRouter initialEntries={['/inbox']}>
      <Routes>
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/lab/projects/:projectId" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('InboxPage', () => {
  beforeEach(() => {
    mocks.notifications = [
      createNotification({ id: 'notification-1' }),
      createNotification({
        id: 'notification-2',
        type: 'system',
        title: '系统通知',
        content: '周五前完成汇报',
        is_read: true,
      }),
      createNotification({
        id: 'notification-3',
        type: 'leadership_transfer',
        title: '课题组长转让邀请',
        content: '请在 7 天内处理',
        action_url: '/lab/projects/project-1#project-members',
      }),
    ];
    mocks.fetchNotifications.mockReset();
    mocks.markAsRead.mockReset();
    mocks.markAllAsRead.mockReset();
    mocks.deleteNotification.mockReset();
    mocks.fetchNotifications.mockResolvedValue(undefined);
    mocks.markAsRead.mockResolvedValue(undefined);
    mocks.markAllAsRead.mockResolvedValue(undefined);
    mocks.deleteNotification.mockResolvedValue(undefined);
  });

  it('renders discussion notifications and navigates to the discussion comments anchor', async () => {
    renderInbox();

    expect(screen.getByText('评论回复')).toBeTruthy();
    expect(screen.getAllByText('系统通知').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText('新的课题讨论'));

    await waitFor(() => {
      expect(mocks.markAsRead).toHaveBeenCalledWith('notification-1');
    });
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/lab/projects/project-1#discussion-comments');
    });
    expect(screen.getByTestId('notification-jump-state').textContent).toBe('jump');
  });

  it('renders leadership-transfer notifications and opens the member card anchor', async () => {
    renderInbox();

    expect(screen.getByText('组长转让')).toBeTruthy();
    fireEvent.click(screen.getByText('课题组长转让邀请'));

    await waitFor(() => {
      expect(mocks.markAsRead).toHaveBeenCalledWith('notification-3');
      expect(screen.getByTestId('location').textContent).toBe('/lab/projects/project-1#project-members');
    });
    expect(screen.getByTestId('notification-jump-state').textContent).toBe('jump');
  });
});
