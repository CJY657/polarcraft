// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  PROJECT_LIFECYCLE_STATUSES,
  ProjectLifecycleBadges,
  ProjectLifecycleJourney,
  getProjectStatusControlOptions,
  getProjectStatusMeta,
} from './projectLifecycle';

describe('research project lifecycle metadata', () => {
  it('defines all eight lifecycle states in transition order', () => {
    expect(PROJECT_LIFECYCLE_STATUSES).toEqual([
      'draft',
      'recruiting',
      'forming',
      'active',
      'review_pending',
      'showcased',
      'relay_open',
      'archived',
    ]);
    expect(PROJECT_LIFECYCLE_STATUSES.map((status) => getProjectStatusMeta(status).label)).toEqual([
      '草稿',
      '招募中',
      '组队中',
      '进行中',
      '待评审',
      '已展示',
      '接力开放',
      '已归档',
    ]);
  });

  it('shows every lifecycle state while enabling only the current and next state', () => {
    const options = getProjectStatusControlOptions('active');
    expect(options.map((option) => option.value)).toEqual(PROJECT_LIFECYCLE_STATUSES);
    expect(options.filter((option) => !option.disabled).map((option) => option.value)).toEqual([
      'active',
      'review_pending',
    ]);
  });

  it('enables every lifecycle state for administrators', () => {
    const options = getProjectStatusControlOptions('active', true);
    expect(options.map((option) => option.value)).toEqual(PROJECT_LIFECYCLE_STATUSES);
    expect(options.filter((option) => !option.disabled).map((option) => option.value)).toEqual(PROJECT_LIFECYCLE_STATUSES);
  });

  it('renders dormancy as a separate coral outline badge', () => {
    render(<ProjectLifecycleBadges status="forming" isDormant />);

    expect(screen.getByText('组队中')).toBeTruthy();
    const dormantBadge = screen.getByText('休眠');
    expect(dormantBadge).toBeTruthy();
    expect(dormantBadge.getAttribute('style')).toContain('rgb(168, 50, 36)');
  });

  it('renders legacy and unknown statuses without hiding or crashing', () => {
    render(
      <>
        <ProjectLifecycleBadges status="completed" />
        <ProjectLifecycleBadges status="paused" />
      </>
    );

    expect(screen.getByText('待评审（旧状态）')).toBeTruthy();
    expect(screen.getByText('状态：paused')).toBeTruthy();
  });

  it('renders the full project journey with completed, current, and upcoming stages', () => {
    render(<ProjectLifecycleJourney status="active" />);

    expect(screen.getByRole('heading', { name: '课题旅程' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(PROJECT_LIFECYCLE_STATUSES.length);
    expect(screen.getByText('组队中').closest('li')?.getAttribute('data-state')).toBe('completed');
    expect(screen.getByText('进行中').closest('li')?.getAttribute('aria-current')).toBe('step');
    expect(screen.getByText('待评审').closest('li')?.getAttribute('data-state')).toBe('upcoming');
  });

  it('maps the legacy completed status onto the review stage in the journey', () => {
    render(<ProjectLifecycleJourney status="completed" />);

    expect(screen.getByText('待评审').closest('li')?.getAttribute('aria-current')).toBe('step');
  });
});
