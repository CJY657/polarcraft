// @vitest-environment jsdom

import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InboxDropdown } from './InboxDropdown';
import type { UserNotification } from '@/lib/notification.service';

const mocks = vi.hoisted(() => ({
  notifications: [] as UserNotification[],
  fetchNotifications: vi.fn(),
  markAsRead: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: () => ({
    notifications: mocks.notifications,
    unreadCount: mocks.notifications.filter((notification) => !notification.is_read).length,
    isLoading: false,
    fetchNotifications: mocks.fetchNotifications,
    markAsRead: mocks.markAsRead,
  }),
}));

function createNotification(overrides: Partial<UserNotification> = {}): UserNotification {
  return {
    id: 'notification-1',
    user_id: 'user-1',
    type: 'comment_reply',
    title: '新的课题讨论',
    content: '请看最新讨论',
    data: null,
    is_read: false,
    action_url: '/lab/projects/project-1#discussion-comment-comment-1',
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

describe('InboxDropdown notification polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.notifications = [];
    mocks.fetchNotifications.mockReset();
    mocks.fetchNotifications.mockResolvedValue({
      notifications: [],
      total: 0,
      unread_count: 0,
    });
    mocks.markAsRead.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches notifications when opened and refreshes while open', () => {
    render(
      <MemoryRouter>
        <InboxDropdown />
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(screen.getByTitle('收件箱'));
    });

    expect(mocks.fetchNotifications).toHaveBeenCalledWith({ limit: 5 });

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(mocks.fetchNotifications).toHaveBeenCalledTimes(2);
  });

  it('sends a fresh jump signal when opening a notification for the current page', async () => {
    mocks.notifications = [createNotification({
      type: 'leadership_transfer',
      title: '课题组长转让邀请',
      action_url: '/lab/projects/project-1#project-members',
    })];

    render(
      <MemoryRouter initialEntries={['/lab/projects/project-1#project-members']}>
        <InboxDropdown />
        <Routes>
          <Route path="/lab/projects/:projectId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(screen.getByTitle('收件箱'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('课题组长转让邀请'));
    });
    expect(mocks.markAsRead).toHaveBeenCalledWith('notification-1');
    expect(screen.getByTestId('location').textContent).toBe(
      '/lab/projects/project-1#project-members'
    );
    expect(screen.getByTestId('notification-jump-state').textContent).toBe('jump');
  });
});
