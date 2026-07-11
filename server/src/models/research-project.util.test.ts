import { describe, expect, it } from 'vitest';

import {
  isProjectDormant,
  validateProjectStatusTransition,
} from './research-project.util.js';

describe('research project lifecycle policy', () => {
  const adjacentTransitions = [
    ['draft', 'recruiting'],
    ['recruiting', 'forming'],
    ['forming', 'active'],
    ['active', 'review_pending'],
    ['review_pending', 'showcased'],
    ['showcased', 'relay_open'],
    ['relay_open', 'archived'],
  ] as const;

  it.each(adjacentTransitions)('allows %s -> %s', (current, next) => {
    expect(validateProjectStatusTransition(current, next)).toEqual({ valid: true, changed: true });
  });

  it('allows keeping the current status during a metadata edit', () => {
    expect(validateProjectStatusTransition('active', 'active')).toEqual({ valid: true, changed: false });
    expect(validateProjectStatusTransition('archived', 'archived')).toEqual({ valid: true, changed: false });
  });

  it('allows administrators to move back to any earlier lifecycle state', () => {
    expect(validateProjectStatusTransition('active', 'forming', true)).toEqual({ valid: true, changed: true });
    expect(validateProjectStatusTransition('active', 'draft', true)).toEqual({ valid: true, changed: true });
    expect(validateProjectStatusTransition('archived', 'forming', true)).toEqual({ valid: true, changed: true });
    expect(validateProjectStatusTransition('archived', 'relay_open', true)).toEqual({ valid: true, changed: true });
  });

  it('allows administrators to move directly to any later lifecycle state', () => {
    expect(validateProjectStatusTransition('draft', 'active', true)).toEqual({ valid: true, changed: true });
    expect(validateProjectStatusTransition('active', 'relay_open', true)).toEqual({ valid: true, changed: true });
  });

  it('does not allow ordinary users to move lifecycle state backward', () => {
    expect(validateProjectStatusTransition('active', 'forming')).toEqual({ valid: false, changed: false });
  });

  it.each([
    ['draft', 'active'],
    ['active', 'forming'],
    ['archived', 'relay_open'],
    ['draft', 'unknown'],
  ])('rejects invalid transition %s -> %s', (current, next) => {
    expect(validateProjectStatusTransition(current, next)).toEqual({ valid: false, changed: false });
  });
});

describe('research project dormancy policy', () => {
  const now = new Date('2026-07-11T00:00:00.000Z');

  it('becomes dormant at 30 inactive days', () => {
    expect(isProjectDormant('active', new Date('2026-06-11T00:00:00.000Z'), now)).toBe(true);
  });

  it('is not dormant before 30 inactive days or after archival', () => {
    expect(isProjectDormant('active', new Date('2026-06-11T00:00:00.001Z'), now)).toBe(false);
    expect(isProjectDormant('archived', new Date('2020-01-01T00:00:00.000Z'), now)).toBe(false);
  });
});
