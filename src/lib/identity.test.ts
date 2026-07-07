import { describe, expect, it } from 'vitest';

import { formatUserIdentity, getUserIdentityInitial } from './identity';

describe('formatUserIdentity', () => {
  it('renders nickname and real name when both exist and differ', () => {
    expect(formatUserIdentity({
      username: 'alice',
      nickname: '小爱',
      real_name: 'Alice Wang',
    })).toBe('小爱（Alice Wang）');
  });

  it('falls back to nickname, then username, then fallback text', () => {
    expect(formatUserIdentity({ username: 'alice', nickname: '小爱' })).toBe('小爱');
    expect(formatUserIdentity({ username: 'alice' })).toBe('alice');
    expect(formatUserIdentity(null, '用户')).toBe('用户');
  });

  it('uses the formatted identity initial', () => {
    expect(getUserIdentityInitial({ username: 'alice', nickname: '小爱' })).toBe('小');
  });
});
