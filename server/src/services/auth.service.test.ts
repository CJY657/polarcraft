import { beforeEach, describe, expect, it, vi } from 'vitest';

const doubles = vi.hoisted(() => ({
  createUser: vi.fn(),
  findById: vi.fn(),
  findByUsername: vi.fn(),
  findByEmail: vi.fn(),
  updateProfile: vi.fn(),
  verifyPassword: vi.fn(),
  updateLastLogin: vi.fn(),
  generateTokens: vi.fn(),
  invalidateAllForUser: vi.fn(),
  createResetToken: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  markEmailVerified: vi.fn(),
}));

vi.mock('../models/user.model.js', () => ({
  UserModel: {
    create: doubles.createUser,
    findById: doubles.findById,
    findByUsername: doubles.findByUsername,
    findByEmail: doubles.findByEmail,
    updateProfile: doubles.updateProfile,
    verifyPassword: doubles.verifyPassword,
    updateLastLogin: doubles.updateLastLogin,
    markEmailVerified: doubles.markEmailVerified,
  },
}));

vi.mock('./token.service.js', () => ({
  TokenService: {
    generateTokens: doubles.generateTokens,
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
    frontendUrl: 'https://polariscope.test',
    jwt: { accessSecret: 'test-access-secret' },
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('./email.service.js', () => ({
  EmailService: {
    sendPasswordResetEmail: doubles.sendPasswordResetEmail,
    sendEmailVerification: doubles.sendEmailVerification,
  },
}));

import type { ForgotPasswordInput, User } from '../types/auth.types.js';
import { AuthError } from '../types/auth.types.js';
import { generateEmailVerifyToken } from '../utils/jwt.util.js';
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
    user_type: 'student',
    avatar_url: null,
    is_active: true,
    email,
    email_verified: false,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    last_login_at: null,
  };
}

describe('AuthService user type responses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists and returns the selected type when registering without changing role', async () => {
    const user = {
      ...createUser('teacher@example.com'),
      real_name: 'Teacher Lin',
      user_type: 'teacher' as const,
    };
    doubles.createUser.mockResolvedValue(user);
    doubles.generateTokens.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: 900,
    });
    const input = {
      username: 'teacher-lin',
      real_name: 'Teacher Lin',
      password: 'a'.repeat(64),
      clientSalt: 'client-salt',
      email: 'teacher@example.com',
      user_type: 'teacher' as const,
    };

    const result = await AuthService.register(input);

    expect(doubles.createUser).toHaveBeenCalledWith(input);
    expect(result.user).toMatchObject({ role: 'user', user_type: 'teacher' });
  });

  it('serializes a legacy administrator without a stored type as null', async () => {
    const legacyAdmin = {
      ...createUser('admin@example.com'),
      role: 'admin' as const,
      user_type: undefined as never,
    };
    doubles.findByUsername.mockResolvedValue(legacyAdmin);
    doubles.verifyPassword.mockResolvedValue(true);
    doubles.updateLastLogin.mockResolvedValue(undefined);
    doubles.generateTokens.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: 900,
    });

    const result = await AuthService.login({
      username: 'alice',
      password: 'a'.repeat(64),
    });

    expect(result.user).toMatchObject({ role: 'admin', user_type: null });
    expect(doubles.generateTokens).toHaveBeenCalledWith(legacyAdmin, undefined, undefined);
  });
});

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

describe('AuthService email verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks the email verified when the token matches the current address', async () => {
    doubles.markEmailVerified.mockResolvedValue(true);
    const token = generateEmailVerifyToken('user-1', 'alice@example.com');

    await expect(AuthService.verifyEmail(token)).resolves.toEqual({
      message: '邮箱验证成功',
    });
    expect(doubles.markEmailVerified).toHaveBeenCalledWith('user-1', 'alice@example.com');
  });

  it('rejects a stale token whose email is no longer the current address', async () => {
    // markEmailVerified matches on { id, email }, so a replaced address never matches
    doubles.markEmailVerified.mockResolvedValue(false);
    const token = generateEmailVerifyToken('user-1', 'old@example.com');

    await expect(AuthService.verifyEmail(token)).rejects.toBeInstanceOf(AuthError);
  });

  it('rejects a malformed token without touching the database', async () => {
    await expect(AuthService.verifyEmail('not-a-token')).rejects.toBeInstanceOf(AuthError);
    expect(doubles.markEmailVerified).not.toHaveBeenCalled();
  });

  it('does not fail registration when the verification email cannot be sent', async () => {
    doubles.createUser.mockResolvedValue(createUser('alice@example.com'));
    doubles.generateTokens.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: 900,
    });
    doubles.sendEmailVerification.mockRejectedValue(new Error('SMTP down'));

    const result = await AuthService.register({
      username: 'alice',
      real_name: 'Alice',
      password: 'a'.repeat(64),
      clientSalt: 'client-salt',
      email: 'alice@example.com',
      user_type: 'student',
    });

    expect(result.user.username).toBe('alice');
    expect(doubles.sendEmailVerification).toHaveBeenCalled();
  });

  it('skips the resend when the email is already verified', async () => {
    doubles.findById.mockResolvedValue({
      ...createUser('alice@example.com'),
      email_verified: true,
    });

    await expect(AuthService.resendEmailVerification('user-1')).resolves.toEqual({
      message: '邮箱已验证',
    });
    expect(doubles.sendEmailVerification).not.toHaveBeenCalled();
  });
});
