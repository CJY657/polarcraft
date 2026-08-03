// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from './auth.service';

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  identify: vi.fn(),
  setPersonProperties: vi.fn(),
  reset: vi.fn(),
  capture: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: mocks,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn() },
}));

const user: UserProfile = {
  id: 'user-1',
  username: 'alice',
  nickname: null,
  real_name: 'Alice Chen',
  show_real_name_publicly: false,
  role: 'user',
  user_type: 'teacher',
  avatar_url: null,
  email: 'alice@example.com',
  email_verified: true,
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
  last_login_at: null,
};

async function loadPostHog() {
  vi.resetModules();
  vi.stubEnv('VITE_PUBLIC_POSTHOG_KEY', 'test-key');
  return import('./posthog');
}

describe('syncPostHogUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('includes user_type when identifying and refreshing a person', async () => {
    const { syncPostHogUser } = await loadPostHog();

    syncPostHogUser(user);
    expect(mocks.identify).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ user_type: 'teacher', role: 'user' })
    );

    syncPostHogUser({ ...user, user_type: 'student' });
    expect(mocks.setPersonProperties).toHaveBeenCalledWith(
      expect.objectContaining({ user_type: 'student', role: 'user' })
    );
  });
});
