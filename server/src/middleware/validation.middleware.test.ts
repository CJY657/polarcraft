import { describe, expect, it, vi } from 'vitest';

import {
  validateForgotPassword,
  validateRegister,
  validateUpdateProfile,
} from './validation.middleware.js';

type Middleware = (req: any, res: any, next: (error?: unknown) => void) => void | Promise<void>;

async function runValidationStack(stack: Middleware[], body: Record<string, unknown>) {
  const req = { body };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  const next = vi.fn();

  for (const middleware of stack) {
    await middleware(req, res, next);
    if (res.json.mock.calls.length > 0) {
      break;
    }
  }

  return { req, res, next };
}

describe('auth/profile validation', () => {
  it.each([
    ['missing', undefined],
    ['blank', '   '],
  ])('rejects %s email when registering', async (_label, email) => {
    const { res } = await runValidationStack(validateRegister as Middleware[], {
      username: 'student-1',
      real_name: 'Lin Chen',
      password: 'a'.repeat(64),
      clientSalt: 'client-salt',
      user_type: 'student',
      ...(email === undefined ? {} : { email }),
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
          ]),
        }),
      })
    );
  });

  it('rejects malformed email when registering', async () => {
    const { res } = await runValidationStack(validateRegister as Middleware[], {
      username: 'student-1',
      real_name: 'Lin Chen',
      password: 'a'.repeat(64),
      clientSalt: 'client-salt',
      email: 'not-an-email',
      user_type: 'student',
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
          ]),
        }),
      })
    );
  });

  it('requires real name when registering', async () => {
    const { res } = await runValidationStack(validateRegister as Middleware[], {
      username: 'student-1',
      password: 'a'.repeat(64),
      clientSalt: 'client-salt',
      email: 'student@example.com',
      user_type: 'student',
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'real_name' }),
          ]),
        }),
      })
    );
  });

  it('normalizes registration fields', async () => {
    const { req, res, next } = await runValidationStack(validateRegister as Middleware[], {
      username: ' student-1 ',
      real_name: ' Lin Chen ',
      password: 'a'.repeat(64),
      clientSalt: 'client-salt',
      email: ' Student@Example.COM ',
      user_type: 'teacher',
    });

    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(req.body).toMatchObject({
      username: 'student-1',
      real_name: 'Lin Chen',
      email: 'student@example.com',
      user_type: 'teacher',
    });
  });

  it('validates forgot-password requests by username only', async () => {
    const { req, res, next } = await runValidationStack(
      validateForgotPassword as Middleware[],
      {
        username: ' student-1 ',
        email: 'not-an-email',
      }
    );

    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(req.body.username).toBe('student-1');
  });

  it.each([
    ['missing', undefined],
    ['invalid', 'guardian'],
  ])('rejects %s user type when registering', async (_label, userType) => {
    const { res } = await runValidationStack(validateRegister as Middleware[], {
      username: 'student-1',
      real_name: 'Lin Chen',
      password: 'a'.repeat(64),
      clientSalt: 'client-salt',
      email: 'student@example.com',
      ...(userType === undefined ? {} : { user_type: userType }),
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'user_type' }),
          ]),
        }),
      })
    );
  });

  it.each(['student', 'teacher'])('accepts %s as a registration user type', async (userType) => {
    const { res, next } = await runValidationStack(validateRegister as Middleware[], {
      username: `${userType}-1`,
      real_name: 'Lin Chen',
      password: 'a'.repeat(64),
      clientSalt: 'client-salt',
      email: `${userType}@example.com`,
      user_type: userType,
    });

    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('rejects blank real name profile updates', async () => {
    const { res } = await runValidationStack(validateUpdateProfile as Middleware[], {
      real_name: '   ',
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'real_name' }),
          ]),
        }),
      })
    );
  });

  it('rejects an invalid profile user type', async () => {
    const { res } = await runValidationStack(validateUpdateProfile as Middleware[], {
      user_type: 'guardian',
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'user_type' }),
          ]),
        }),
      })
    );
  });

  it.each(['student', 'teacher'])('accepts %s as a profile user type', async (userType) => {
    const { res, next } = await runValidationStack(validateUpdateProfile as Middleware[], {
      user_type: userType,
    });

    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
