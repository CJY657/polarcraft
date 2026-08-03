import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  preparePasswordForRegistration: vi.fn(),
}));

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: mocks.post,
    put: vi.fn(),
  },
}));

vi.mock('./password.util', () => ({
  preparePasswordForRegistration: mocks.preparePasswordForRegistration,
  preparePasswordForLogin: vi.fn(),
  validatePassword: vi.fn(),
  getPasswordRequirements: vi.fn(),
}));

import { authApi } from './auth.service';

describe('authApi.register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.preparePasswordForRegistration.mockResolvedValue({
      hashedPassword: 'hashed-password',
      salt: 'client-salt',
    });
    mocks.post.mockResolvedValue({
      success: true,
      data: { user: {}, tokens: {} },
    });
  });

  it('sends the selected user type with the registration payload', async () => {
    await authApi.register({
      username: 'teacher-1',
      real_name: 'Lin Chen',
      password: 'Password1!',
      email: ' teacher@example.com ',
      user_type: 'teacher',
    });

    expect(mocks.post).toHaveBeenCalledWith('/api/auth/register', {
      username: 'teacher-1',
      real_name: 'Lin Chen',
      password: 'hashed-password',
      email: 'teacher@example.com',
      user_type: 'teacher',
      clientSalt: 'client-salt',
    });
  });
});
