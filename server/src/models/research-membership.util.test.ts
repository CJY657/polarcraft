import { describe, expect, it } from 'vitest';
import {
  buildActiveMembershipFilter,
  buildInactiveMembershipFilter,
  compareMembersByRoleThenJoinedAt,
  isMembershipActive,
} from './research-membership.util.js';

describe('research-membership.util', () => {
  it('treats legacy rows without an active flag as active memberships', () => {
    expect(isMembershipActive(undefined)).toBe(true);
    expect(isMembershipActive({})).toBe(true);
    expect(isMembershipActive({ active: true })).toBe(true);
    expect(isMembershipActive({ active: false })).toBe(false);
  });

  it('builds active membership filters that keep legacy rows visible', () => {
    expect(buildActiveMembershipFilter({ project_id: 'project-1' })).toEqual({
      project_id: 'project-1',
      $or: [{ active: true }, { active: { $exists: false } }],
    });
  });

  it('builds inactive membership filters for former-member lookups', () => {
    expect(buildInactiveMembershipFilter({ project_id: 'project-1' })).toEqual({
      project_id: 'project-1',
      active: false,
    });
  });

  it('orders members by role priority, then by earliest join time', () => {
    const owner = { role: 'owner', joined_at: '2026-02-01T00:00:00.000Z' };
    const earlyMember = { role: 'member', joined_at: '2026-01-01T00:00:00.000Z' };
    const lateMember = { role: 'member', joined_at: '2026-03-01T00:00:00.000Z' };

    const sorted = [lateMember, earlyMember, owner].sort(compareMembersByRoleThenJoinedAt);

    expect(sorted).toEqual([owner, earlyMember, lateMember]);
  });
});
