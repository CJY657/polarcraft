// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthDialogStore } from '@/stores/authDialogStore';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mocks.login,
    register: mocks.register,
  }),
}));

import { AuthDialog } from './AuthDialog';

function openRegisterDialog() {
  act(() => {
    useAuthDialogStore.setState({
      isOpen: true,
      mode: 'register',
      returnTo: null,
    });
  });
}

function renderDialog() {
  return render(
    <MemoryRouter>
      <AuthDialog />
    </MemoryRouter>
  );
}

describe('AuthDialog registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.register.mockResolvedValue(undefined);
    openRegisterDialog();
  });

  it('renders required nickname and real-name fields', () => {
    renderDialog();

    expect(screen.getByLabelText('昵称 *')).toHaveProperty('required', true);
    expect(screen.getByLabelText('真实姓名 *')).toHaveProperty('required', true);
  });

  it('submits nickname and real name during registration', async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText('用户名 *'), {
      target: { value: ' student-1 ' },
    });
    fireEvent.change(screen.getByLabelText('昵称 *'), {
      target: { value: ' 小林 ' },
    });
    fireEvent.change(screen.getByLabelText('真实姓名 *'), {
      target: { value: ' Lin Chen ' },
    });
    fireEvent.change(screen.getByLabelText('密码 *'), {
      target: { value: 'Password1!' },
    });
    fireEvent.change(screen.getByLabelText('确认密码 *'), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: '注册' }));

    await waitFor(() => {
      expect(mocks.register).toHaveBeenCalledWith(
        'student-1',
        '小林',
        'Lin Chen',
        'Password1!',
        undefined
      );
    });
  });
});
