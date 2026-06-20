// @vitest-environment jsdom

import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthThemeSwitcher } from './AuthThemeSwitcher';

const mocks = vi.hoisted(() => ({
  fetchUnreadCount: vi.fn(),
  isAuthenticated: true,
  isSystemHealthy: true,
  openDialog: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mocks.isAuthenticated }),
}));

vi.mock('@/contexts/SystemContext', () => ({
  useSystem: () => ({ isSystemHealthy: mocks.isSystemHealthy }),
}));

vi.mock('@/stores/authDialogStore', () => ({
  useAuthDialogStore: (selector: (state: { openDialog: typeof mocks.openDialog }) => unknown) =>
    selector({ openDialog: mocks.openDialog }),
}));

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: (selector: (state: { fetchUnreadCount: typeof mocks.fetchUnreadCount }) => unknown) =>
    selector({ fetchUnreadCount: mocks.fetchUnreadCount }),
}));

vi.mock('@/components/ui/InboxDropdown', () => ({
  InboxDropdown: () => <div data-testid="inbox-dropdown" />,
}));

vi.mock('@/components/ui/UserDropdown', () => ({
  UserDropdown: () => <div data-testid="user-dropdown" />,
}));

describe('AuthThemeSwitcher notification polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.fetchUnreadCount.mockReset();
    mocks.fetchUnreadCount.mockResolvedValue(undefined);
    mocks.isAuthenticated = true;
    mocks.isSystemHealthy = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches unread count on mount and every 15 seconds', () => {
    render(<AuthThemeSwitcher />);

    expect(mocks.fetchUnreadCount).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(mocks.fetchUnreadCount).toHaveBeenCalledTimes(2);
  });

  it('fetches unread count when the tab becomes visible', () => {
    render(<AuthThemeSwitcher />);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mocks.fetchUnreadCount).toHaveBeenCalledTimes(2);
  });
});
