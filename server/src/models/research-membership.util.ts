import { compareRole } from '../database/mongo.util.js';

export interface MembershipLifecycleLike {
  active?: boolean | null;
  removed_at?: Date | string | null;
}

export type NormalizedProjectRole = 'owner' | 'member';

type Query = Record<string, unknown>;

/**
 * Order members by role priority, then by earliest join time.
 * 成员排序：先按角色优先级，再按加入时间升序
 */
export function compareMembersByRoleThenJoinedAt(
  a: { role: string; joined_at: Date | string },
  b: { role: string; joined_at: Date | string }
): number {
  const roleCompare = compareRole(a.role, b.role);
  if (roleCompare !== 0) {
    return roleCompare;
  }

  return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
}

export function isMembershipActive(member?: MembershipLifecycleLike | null): boolean {
  return member?.active !== false;
}

export function normalizeProjectRole(role?: string | null): NormalizedProjectRole | null {
  switch (role) {
    case 'owner':
      return 'owner';
    case 'member':
    case 'admin':
    case 'editor':
    case 'viewer':
      return 'member';
    default:
      return null;
  }
}

export function buildActiveMembershipFilter(filter: Query = {}): Query {
  const activeClause = {
    $or: [{ active: true }, { active: { $exists: false } }],
  };

  if ('$or' in filter || '$and' in filter) {
    return {
      $and: [filter, activeClause],
    };
  }

  return {
    ...filter,
    ...activeClause,
  };
}

export function buildInactiveMembershipFilter(filter: Query = {}): Query {
  if ('$or' in filter || '$and' in filter) {
    return {
      $and: [filter, { active: false }],
    };
  }

  return {
    ...filter,
    active: false,
  };
}
