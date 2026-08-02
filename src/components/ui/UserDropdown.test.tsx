// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      username: 'root',
      nickname: null,
      real_name: null,
      email: 'root@example.com',
      role: 'admin',
      avatar_url: null,
    },
    logout: vi.fn(),
  }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

import { UserDropdown } from './UserDropdown';

function LocationValue() {
  return <output aria-label="current location">{useLocation().pathname}</output>;
}

describe('UserDropdown', () => {
  it('links to learning pulse', async () => {
    render(
      <MemoryRouter>
        <UserDropdown />
        <LocationValue />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /root/ }));
    fireEvent.click(await screen.findByRole('button', { name: '学习热度' }));

    expect(screen.getByLabelText('current location').textContent).toBe('/pulse');
  });

  it('links to the user activity dashboard', async () => {
    render(
      <MemoryRouter>
        <UserDropdown />
        <LocationValue />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /root/ }));
    fireEvent.click(await screen.findByRole('button', { name: '内容管理' }));
    fireEvent.click(await screen.findByRole('button', { name: '用户活动' }));

    expect(screen.getByLabelText('current location').textContent).toBe('/admin/activity');
  });
});
