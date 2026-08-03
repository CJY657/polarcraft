// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: null as null | {
    id: string;
    username: string;
    nickname: string | null;
    real_name: string | null;
    role: 'user' | 'admin';
    email: string | null;
    user_type?: 'student' | 'teacher' | null;
  },
  logout: vi.fn(),
  refreshUser: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mocks.user,
    logout: mocks.logout,
    refreshUser: mocks.refreshUser,
  }),
}));

vi.mock('@/lib/auth.service', () => ({
  authApi: {
    updateProfile: mocks.updateProfile,
  },
}));

import { ProfileCompletionModal } from './ProfileCompletionModal';

function renderModal() {
  return render(
    <MemoryRouter>
      <ProfileCompletionModal />
    </MemoryRouter>
  );
}

describe('ProfileCompletionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateProfile.mockResolvedValue({});
    mocks.refreshUser.mockResolvedValue(undefined);
    mocks.logout.mockResolvedValue(undefined);
    mocks.user = {
      id: 'user-1',
      username: 'alice',
      nickname: null,
      real_name: null,
      role: 'user',
      email: 'alice@example.com',
      user_type: 'student',
    };
  });

  it('appears for non-admin users missing real name', () => {
    renderModal();

    expect(screen.getByText('完善身份信息')).toBeDefined();
  });

  it('does not appear for admins missing real name', () => {
    mocks.user = {
      id: 'admin-1',
      username: 'admin',
      nickname: null,
      real_name: null,
      role: 'admin',
      email: 'admin@example.com',
      user_type: 'teacher',
    };

    renderModal();

    expect(screen.queryByText('完善身份信息')).toBeNull();
  });

  it('appears for email-less administrators without requiring real name', () => {
    mocks.user = {
      id: 'admin-1',
      username: 'admin',
      nickname: null,
      real_name: null,
      role: 'admin',
      email: null,
      user_type: 'teacher',
    };

    renderModal();

    expect(screen.getByLabelText('邮箱 *')).toBeDefined();
    expect(screen.queryByLabelText('真实姓名 *')).toBeNull();
  });

  it('requires legacy administrators to choose an account identity', async () => {
    mocks.user = {
      id: 'admin-1',
      username: 'admin',
      nickname: null,
      real_name: null,
      role: 'admin',
      email: 'admin@example.com',
      user_type: null,
    };

    renderModal();

    expect(screen.queryByLabelText('真实姓名 *')).toBeNull();
    expect(screen.getByRole('radio', { name: '教师' })).toBeDefined();

    fireEvent.click(screen.getByRole('radio', { name: '教师' }));
    fireEvent.click(screen.getByRole('button', { name: '保存并继续' }));

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalledWith({ user_type: 'teacher' });
    });
    expect(mocks.refreshUser).toHaveBeenCalled();
  });

  it('saves real name and refreshes auth state', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('真实姓名 *'), {
      target: { value: ' Lin Chen ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存并继续' }));

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalledWith({ real_name: 'Lin Chen' });
    });
    expect(mocks.refreshUser).toHaveBeenCalled();
  });

  it('validates and saves a trimmed email for an email-less user', async () => {
    mocks.user = {
      id: 'user-1',
      username: 'alice',
      nickname: null,
      real_name: 'Alice Chen',
      role: 'user',
      email: null,
      user_type: 'student',
    };
    renderModal();

    fireEvent.change(screen.getByLabelText('邮箱 *'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.submit(screen.getByRole('button', { name: '保存并继续' }).closest('form')!);

    expect(await screen.findByText('邮箱格式不正确')).toBeDefined();
    expect(mocks.updateProfile).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('邮箱 *'), {
      target: { value: ' alice@example.com ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存并继续' }));

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalledWith({
        email: 'alice@example.com',
      });
    });
    expect(mocks.refreshUser).toHaveBeenCalled();
  });

  it('disappears after refreshed user data includes all required fields', async () => {
    mocks.user = {
      id: 'user-1',
      username: 'alice',
      nickname: null,
      real_name: 'Alice Chen',
      role: 'user',
      email: null,
      user_type: 'student',
    };
    const view = renderModal();

    expect(screen.getByText('完善身份信息')).toBeDefined();

    mocks.user = { ...mocks.user, email: 'alice@example.com' };
    view.rerender(
      <MemoryRouter>
        <ProfileCompletionModal />
      </MemoryRouter>
    );

    expect(screen.queryByText('完善身份信息')).toBeNull();
  });
});
