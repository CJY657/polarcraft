// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectActivityItem } from '@/lib/research.service';
import { getActivityLabel, ProjectActivityFeed } from './ProjectActivityFeed';

const mockGetProjectActivity = vi.fn();

vi.mock('@/lib/research.service', () => ({
  researchApi: {
    getProjectActivity: (...args: unknown[]) => mockGetProjectActivity(...args),
  },
}));

function createActivity(overrides: Partial<ProjectActivityItem> = {}): ProjectActivityItem {
  return {
    id: 'activity-1',
    project_id: 'project-1',
    user_id: 'member-a',
    action: 'add_comment',
    target_type: 'project_comment',
    target_id: 'comment-1',
    changes: null,
    created_at: new Date().toISOString(),
    username: '小林',
    avatar_url: null,
    ...overrides,
  };
}

describe('ProjectActivityFeed', () => {
  beforeEach(() => {
    mockGetProjectActivity.mockReset();
  });

  it('requests the configured number of activities and renders mapped labels', async () => {
    mockGetProjectActivity.mockResolvedValue([
      createActivity({
        id: 'activity-status',
        action: 'project_status_changed',
        changes: { from_status: 'active', to_status: 'review_pending' },
      }),
      createActivity({
        id: 'activity-task',
        action: 'task_completed',
        changes: { title: '整理观察数据' },
        username: '组长',
      }),
      createActivity({ id: 'activity-review', action: 'review_submitted', username: '评审同学' }),
    ]);

    render(<ProjectActivityFeed projectId="project-1" limit={15} />);

    expect(await screen.findByText('最近动态')).toBeTruthy();
    expect(mockGetProjectActivity).toHaveBeenCalledWith('project-1', 15);
    expect(screen.getByText('把课题阶段从「进行中」推进到「待评审」')).toBeTruthy();
    expect(screen.getByText('完成了任务「整理观察数据」')).toBeTruthy();
    expect(screen.getByText('提交了同伴评审')).toBeTruthy();
    expect(screen.getAllByText('刚刚').length).toBe(3);
  });

  it('shows an empty state when there is no activity yet', async () => {
    mockGetProjectActivity.mockResolvedValue([]);

    render(<ProjectActivityFeed projectId="project-1" />);

    await waitFor(() => {
      expect(mockGetProjectActivity).toHaveBeenCalledWith('project-1', 15);
    });
    expect(
      await screen.findByText('还没有动态记录，推进阶段、发布讨论或完成任务后会在这里出现。')
    ).toBeTruthy();
  });

  it('falls back to a generic label for unknown actions', () => {
    expect(getActivityLabel(createActivity({ action: 'mystery_action' }))).toBe('更新了课题内容');
    expect(getActivityLabel(createActivity({ action: 'add_comment', changes: { parent_comment_id: 'c1' } }))).toBe(
      '回复了讨论留言'
    );
    expect(getActivityLabel(createActivity({ action: 'task_created', changes: {} }))).toBe('创建了任务');
  });
});
