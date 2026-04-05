export interface MembershipLifecycleLike {
  active?: boolean | null;
  removed_at?: Date | string | null;
}

type Query = Record<string, unknown>;

export function isMembershipActive(member?: MembershipLifecycleLike | null): boolean {
  return member?.active !== false;
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
