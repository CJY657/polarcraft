// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '@/lib/auth.service';

const mocks = vi.hoisted(() => ({
  updateProfile: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock('@/lib/auth.service', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/auth.service')>();
  return {
    ...original,
    authApi: {
      ...original.authApi,
      updateProfile: mocks.updateProfile,
    },
  };
});

import { ProfileEditDialog } from './ProfileEditDialog';

const user: UserProfile = {
  id: 'user-1',
  username: 'alice',
  nickname: null,
  real_name: 'Alice Chen',
  show_real_name_publicly: false,
  role: 'user',
  user_type: 'student',
  avatar_url: null,
  email: 'alice@example.com',
  email_verified: false,
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
  last_login_at: null,
};

describe('ProfileEditDialog account identity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateProfile.mockResolvedValue(user);
  });

  it('loads and updates user_type independently of role', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ProfileEditDialog
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        user={user}
      />
    );

    expect(screen.getByLabelText('账号身份 *')).toHaveProperty('value', 'student');
    expect(screen.getByLabelText('账号身份 *')).toHaveProperty('required', true);
    fireEvent.change(screen.getByLabelText('账号身份 *'), {
      target: { value: 'teacher' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalledWith({
        username: 'alice',
        real_name: 'Alice Chen',
        show_real_name_publicly: false,
        email: 'alice@example.com',
        user_type: 'teacher',
      });
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
