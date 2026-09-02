export const PROJECT_STATUSES = [
  'draft',
  'recruiting',
  'forming',
  'active',
  'review_pending',
  'showcased',
  'relay_open',
  'archived',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === 'string' && PROJECT_STATUSES.includes(value as ProjectStatus);
}

export function validateProjectStatusTransition(
  current: unknown,
  next: unknown,
  allowRollback = false
): { valid: boolean; changed: boolean } {
  if (!isProjectStatus(current) || !isProjectStatus(next)) {
    return { valid: false, changed: false };
  }

  if (current === next) {
    return { valid: true, changed: false };
  }

  if (allowRollback) {
    return { valid: true, changed: true };
  }

  const currentIndex = PROJECT_STATUSES.indexOf(current);
  const nextIndex = PROJECT_STATUSES.indexOf(next);
  const isAdjacentForward = nextIndex === currentIndex + 1;
  return {
    valid: isAdjacentForward,
    changed: isAdjacentForward,
  };
}

export function isProjectStatusRollback(current: unknown, next: unknown): boolean {
  if (!isProjectStatus(current) || !isProjectStatus(next)) {
    return false;
  }

  return PROJECT_STATUSES.indexOf(next) < PROJECT_STATUSES.indexOf(current);
}

export function isProjectDormant(
  status: unknown,
  lastActivityAt: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (status === 'archived' || !lastActivityAt) {
    return false;
  }

  const lastActivityTime = new Date(lastActivityAt).getTime();
  if (Number.isNaN(lastActivityTime)) {
    return false;
  }

  return now.getTime() - lastActivityTime >= 30 * 24 * 60 * 60 * 1000;
}

export function decorateResearchProject<T extends Record<string, any>>(project: T): T & {
  issue_number: number | null;
  last_activity_at: Date | string;
  is_dormant: boolean;
} {
  const lastActivityAt = project.last_activity_at ?? project.updated_at ?? project.created_at;
  return {
    ...project,
    issue_number:
      Number.isSafeInteger(project.issue_number) && project.issue_number > 0
        ? project.issue_number
        : null,
    last_activity_at: lastActivityAt,
    is_dormant: isProjectDormant(project.status, lastActivityAt),
  };
}
