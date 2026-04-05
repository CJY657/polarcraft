export interface MembershipLifecycleLike {
  active?: boolean | null;
  removed_at?: Date | string | null;
}

export type NormalizedProjectRole = 'owner' | 'member';

type Query = Record<string, unknown>;

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

export function isProjectManagerRole(role?: string | null): boolean {
  const normalizedRole = normalizeProjectRole(role);
  return normalizedRole === 'owner';
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
