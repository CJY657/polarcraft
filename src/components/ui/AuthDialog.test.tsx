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

  it('renders required identity and recovery-email fields', () => {
    renderDialog();

    expect(screen.getByLabelText('用户名 *')).toHaveProperty('required', true);
    expect(screen.getByLabelText('真实姓名 *')).toHaveProperty('required', true);
    expect(screen.getByLabelText('邮箱 *')).toHaveProperty('required', true);
    expect(screen.getByText('用于接收密码重置链接')).toBeDefined();
    expect(screen.queryByLabelText('昵称 *')).toBeNull();
  });

  it('submits trimmed registration fields', async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText('用户名 *'), {
      target: { value: ' student-1 ' },
    });
    fireEvent.change(screen.getByLabelText('真实姓名 *'), {
      target: { value: ' Lin Chen ' },
    });
    fireEvent.change(screen.getByLabelText('邮箱 *'), {
      target: { value: ' student@example.com ' },
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
        'Lin Chen',
        'Password1!',
        'student@example.com'
      );
    });
  });

  it('rejects malformed email before registration', async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText('用户名 *'), {
      target: { value: 'student-1' },
    });
    fireEvent.change(screen.getByLabelText('真实姓名 *'), {
      target: { value: 'Lin Chen' },
    });
    fireEvent.change(screen.getByLabelText('邮箱 *'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByLabelText('密码 *'), {
      target: { value: 'Password1!' },
    });
    fireEvent.change(screen.getByLabelText('确认密码 *'), {
      target: { value: 'Password1!' },
    });
    fireEvent.submit(screen.getByRole('button', { name: '注册' }).closest('form')!);

    expect(await screen.findByText('邮箱格式不正确')).toBeDefined();
    expect(mocks.register).not.toHaveBeenCalled();
  });
});
