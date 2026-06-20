// @vitest-environment jsdom

import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InboxDropdown } from './InboxDropdown';

const mocks = vi.hoisted(() => ({
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
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    fetchNotifications: mocks.fetchNotifications,
    markAsRead: mocks.markAsRead,
  }),
}));

describe('InboxDropdown notification polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
});
