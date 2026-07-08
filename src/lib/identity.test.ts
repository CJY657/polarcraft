import { describe, expect, it } from 'vitest';

import { formatUserIdentity, getUserIdentityInitial } from './identity';

describe('formatUserIdentity', () => {
  it('renders username without real name by default', () => {
    expect(formatUserIdentity({
      username: 'alice',
      nickname: '小爱',
      real_name: 'Alice Wang',
    })).toBe('alice');
  });

  it('renders real name only when explicitly public or private formatting is requested', () => {
    const identity = {
      username: 'alice',
      nickname: '小爱',
      real_name: 'Alice Wang',
    };

    expect(formatUserIdentity({ ...identity, show_real_name_publicly: true })).toBe('alice（Alice Wang）');
    expect(formatUserIdentity(identity, '用户', { includePrivateRealName: true })).toBe('alice（Alice Wang）');
  });

  it('renders only the public name when real name is empty or matches the public name', () => {
    expect(formatUserIdentity({ username: 'alice', real_name: '' })).toBe('alice');
    expect(formatUserIdentity({
      nickname: 'legacy-name',
      username: 'alice',
      real_name: 'alice',
      show_real_name_publicly: true,
    })).toBe('alice');
  });

  it('uses username as the public name', () => {
    expect(formatUserIdentity({ username: 'alice', nickname: '小爱' })).toBe('alice');
    expect(formatUserIdentity({ nickname: '小爱', real_name: 'Alice Wang' })).toBe('用户');
    expect(formatUserIdentity({ username: 'alice' })).toBe('alice');
    expect(formatUserIdentity(null, '用户')).toBe('用户');
  });

  it('uses the formatted identity initial', () => {
    expect(getUserIdentityInitial({ username: 'alice', nickname: '小爱' })).toBe('A');
  });
});
