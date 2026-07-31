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
    });

    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(req.body).toMatchObject({
      username: 'student-1',
      real_name: 'Lin Chen',
      email: 'student@example.com',
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
});
