import { beforeEach, describe, expect, it, vi } from 'vitest';

const doubles = vi.hoisted(() => ({
  findByUsername: vi.fn(),
  findByEmail: vi.fn(),
  updateProfile: vi.fn(),
  invalidateAllForUser: vi.fn(),
  createResetToken: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('../models/user.model.js', () => ({
  UserModel: {
    findByUsername: doubles.findByUsername,
    findByEmail: doubles.findByEmail,
    updateProfile: doubles.updateProfile,
  },
}));

vi.mock('../models/password-reset.model.js', () => ({
  PasswordResetModel: {
    DEFAULT_EXPIRY_MINUTES: 15,
    invalidateAllForUser: doubles.invalidateAllForUser,
    create: doubles.createResetToken,
  },
}));

vi.mock('../config/index.js', () => ({
  config: {
    email: { enabled: true },
    isDevelopment: false,
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('./email.service.js', () => ({
  EmailService: {
    sendPasswordResetEmail: doubles.sendPasswordResetEmail,
  },
}));

import type { ForgotPasswordInput, User } from '../types/auth.types.js';
import { AuthService } from './auth.service.js';

const genericResponse = {
  message: '如果该用户存在，将收到密码重置说明',
};

function createUser(email: string | null): User {
  return {
    id: 'user-1',
    username: 'alice',
    nickname: null,
    real_name: null,
    password_hash: 'password-hash',
    client_salt: 'client-salt',
    client_hash_algorithm: 'sha256',
    role: 'user',
    avatar_url: null,
    is_active: true,
    email,
    email_verified: false,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    last_login_at: null,
  };
}

describe('AuthService.forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the generic response without falling back to an email lookup for unknown usernames', async () => {
    doubles.findByUsername.mockResolvedValue(null);

    await expect(
      AuthService.forgotPassword({
        username: 'missing@example.com',
        email: 'attacker@example.com',
      } as ForgotPasswordInput & { email: string })
    ).resolves.toEqual(genericResponse);

    expect(doubles.findByEmail).not.toHaveBeenCalled();
    expect(doubles.updateProfile).not.toHaveBeenCalled();
    expect(doubles.invalidateAllForUser).not.toHaveBeenCalled();
    expect(doubles.createResetToken).not.toHaveBeenCalled();
    expect(doubles.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('ignores an attacker-supplied email when the account has no stored email', async () => {
    doubles.findByUsername.mockResolvedValue(createUser(null));

    await expect(
      AuthService.forgotPassword({
        username: 'alice',
        email: 'attacker@example.com',
      } as ForgotPasswordInput & { email: string })
    ).resolves.toEqual(genericResponse);

    expect(doubles.updateProfile).not.toHaveBeenCalled();
    expect(doubles.invalidateAllForUser).not.toHaveBeenCalled();
    expect(doubles.createResetToken).not.toHaveBeenCalled();
    expect(doubles.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('sends the reset token only to the email already stored on the account', async () => {
    doubles.findByUsername.mockResolvedValue(createUser('owner@example.com'));
    doubles.invalidateAllForUser.mockResolvedValue(1);
    doubles.createResetToken.mockResolvedValue({ token: 'reset-token' });
    doubles.sendPasswordResetEmail.mockResolvedValue(true);

    await expect(
      AuthService.forgotPassword({
        username: 'alice',
        email: 'attacker@example.com',
      } as ForgotPasswordInput & { email: string })
    ).resolves.toEqual(genericResponse);

    expect(doubles.updateProfile).not.toHaveBeenCalled();
    expect(doubles.invalidateAllForUser).toHaveBeenCalledWith('user-1');
    expect(doubles.createResetToken).toHaveBeenCalledWith('user-1');
    expect(doubles.sendPasswordResetEmail).toHaveBeenCalledWith(
      'owner@example.com',
      'alice',
      'reset-token'
    );
  });
});
