import { describe, expect, it } from 'vitest';

import { formatUserIdentity, getUserIdentityInitial } from './identity';

describe('formatUserIdentity', () => {
  it('renders username and real name when both exist and differ', () => {
    expect(formatUserIdentity({
      username: 'alice',
      nickname: '小爱',
      real_name: 'Alice Wang',
    })).toBe('alice（Alice Wang）');
  });

  it('renders only username when real name is empty or matches username', () => {
    expect(formatUserIdentity({ username: 'alice', real_name: '' })).toBe('alice');
    expect(formatUserIdentity({ username: 'alice', real_name: 'alice' })).toBe('alice');
  });

  it('falls back to legacy nickname only when username is missing', () => {
    expect(formatUserIdentity({ username: 'alice', nickname: '小爱' })).toBe('alice');
    expect(formatUserIdentity({ nickname: '小爱', real_name: 'Alice Wang' })).toBe('小爱（Alice Wang）');
    expect(formatUserIdentity({ username: 'alice' })).toBe('alice');
    expect(formatUserIdentity(null, '用户')).toBe('用户');
  });

  it('uses the formatted identity initial', () => {
    expect(getUserIdentityInitial({ username: 'alice', nickname: '小爱' })).toBe('A');
  });
});
