// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyEmail: vi.fn(),
}));

vi.mock('@/lib/auth.service', () => ({
  authApi: { verifyEmail: mocks.verifyEmail },
}));

import VerifyEmailPage from './VerifyEmailPage';

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/verify-email${search}`]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirms verification when the token is accepted', async () => {
    mocks.verifyEmail.mockResolvedValue(undefined);

    renderAt('?token=good-token');

    expect(await screen.findByText('邮箱验证成功')).toBeTruthy();
    expect(mocks.verifyEmail).toHaveBeenCalledWith('good-token');
  });

  it('surfaces the server message when the token is expired', async () => {
    mocks.verifyEmail.mockRejectedValue(new Error('邮箱验证链接无效或已过期'));

    renderAt('?token=stale-token');

    expect(await screen.findByText('链接已失效')).toBeTruthy();
    expect(await screen.findByText('邮箱验证链接无效或已过期')).toBeTruthy();
  });

  it('does not call the API when the link has no token', async () => {
    renderAt('');

    expect(await screen.findByText('链接已失效')).toBeTruthy();
    expect(mocks.verifyEmail).not.toHaveBeenCalled();
  });
});
