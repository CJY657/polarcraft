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
    };

    renderModal();

    expect(screen.queryByText('完善身份信息')).toBeNull();
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
});
