// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectMember, ProjectTask } from '@/lib/research.service';
import { ProjectTasksSection } from './ProjectTasksSection';

const mockGetProjectTasks = vi.fn();
const mockCreateProjectTask = vi.fn();
const mockUpdateProjectTask = vi.fn();
const mockDeleteProjectTask = vi.fn();

vi.mock('@/lib/research.service', () => ({
  researchApi: {
    getProjectTasks: (...args: unknown[]) => mockGetProjectTasks(...args),
    createProjectTask: (...args: unknown[]) => mockCreateProjectTask(...args),
    updateProjectTask: (...args: unknown[]) => mockUpdateProjectTask(...args),
    deleteProjectTask: (...args: unknown[]) => mockDeleteProjectTask(...args),
  },
}));

const members: ProjectMember[] = [
  {
    id: 'member-owner',
    project_id: 'project-1',
    user_id: 'owner-1',
    role: 'owner',
    joined_at: '2026-01-01T00:00:00.000Z',
    username: '组长',
    avatar_url: null,
  },
  {
    id: 'member-1',
    project_id: 'project-1',
    user_id: 'member-a',
    role: 'member',
    joined_at: '2026-01-02T00:00:00.000Z',
    username: '小林',
    avatar_url: null,
  },
];

function createTask(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: 'task-1',
    project_id: 'project-1',
    cycle_id: 'cycle-1',
    title: '整理第一轮观察数据',
    assignee_user_id: 'member-a',
    status: 'todo',
    due_date: null,
    created_by: 'member-a',
    completed_at: null,
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    assignee_username: '小林',
    assignee_avatar_url: null,
    ...overrides,
  };
}

describe('ProjectTasksSection', () => {
  beforeEach(() => {
    mockGetProjectTasks.mockReset();
    mockCreateProjectTask.mockReset();
    mockUpdateProjectTask.mockReset();
    mockDeleteProjectTask.mockReset();
    mockCreateProjectTask.mockResolvedValue(createTask());
    mockUpdateProjectTask.mockResolvedValue(createTask());
    mockDeleteProjectTask.mockResolvedValue(undefined);
  });

  it('groups tasks by status and shows completion progress', async () => {
    mockGetProjectTasks.mockResolvedValue([
      createTask(),
      createTask({ id: 'task-2', title: '搭建偏振演示装置', status: 'doing' }),
      createTask({ id: 'task-3', title: '撰写阶段小结', status: 'done', completed_at: '2026-07-02T00:00:00.000Z' }),
    ]);

    render(
      <ProjectTasksSection projectId="project-1" members={members} currentUserId="owner-1" canManage />
    );

    expect(await screen.findByText('整理第一轮观察数据')).toBeTruthy();
    expect(screen.getByText('搭建偏振演示装置')).toBeTruthy();
    expect(screen.getByText('撰写阶段小结')).toBeTruthy();
    expect(screen.getByText('1 进行中 · 1 待办 · 1 已完成')).toBeTruthy();
    expect(screen.getByRole('button', { name: '开始' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '完成' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '重开' })).toBeTruthy();
  });

  it('creates a task with assignee and due date', async () => {
    mockGetProjectTasks
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createTask({ due_date: '2026-08-01' })]);

    render(
      <ProjectTasksSection projectId="project-1" members={members} currentUserId="owner-1" canManage />
    );

    expect(await screen.findByText('还没有任务')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('任务标题'), {
      target: { value: '整理第一轮观察数据' },
    });
    fireEvent.change(screen.getByLabelText('负责人'), { target: { value: 'member-a' } });
    fireEvent.change(screen.getByLabelText('截止日期'), {
      target: { value: '2026-08-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: '添加任务' }));

    await waitFor(() => {
      expect(mockCreateProjectTask).toHaveBeenCalledWith('project-1', {
        title: '整理第一轮观察数据',
        assignee_user_id: 'member-a',
        due_date: '2026-08-01',
      });
    });
    expect(await screen.findByText('整理第一轮观察数据')).toBeTruthy();
  });

  it('moves a task to done via the complete button', async () => {
    mockGetProjectTasks
      .mockResolvedValueOnce([createTask({ status: 'doing' })])
      .mockResolvedValueOnce([createTask({ status: 'done', completed_at: '2026-07-03T00:00:00.000Z' })]);

    render(
      <ProjectTasksSection projectId="project-1" members={members} currentUserId="member-a" canManage={false} />
    );

    fireEvent.click(await screen.findByRole('button', { name: '完成' }));

    await waitFor(() => {
      expect(mockUpdateProjectTask).toHaveBeenCalledWith('task-1', { status: 'done' });
    });
    expect(await screen.findByRole('button', { name: '重开' })).toBeTruthy();
  });

  it('marks overdue tasks', async () => {
    mockGetProjectTasks.mockResolvedValue([createTask({ due_date: '2020-01-01' })]);

    render(
      <ProjectTasksSection projectId="project-1" members={members} currentUserId="owner-1" canManage />
    );

    expect(await screen.findByText(/逾期/)).toBeTruthy();
  });

  it('only offers deletion to the creator, owner, or admin and confirms first', async () => {
    mockGetProjectTasks
      .mockResolvedValueOnce([
        createTask({ id: 'task-own', title: '我创建的任务', created_by: 'member-a' }),
        createTask({ id: 'task-other', title: '别人创建的任务', created_by: 'owner-1' }),
      ])
      .mockResolvedValueOnce([createTask({ id: 'task-other', title: '别人创建的任务', created_by: 'owner-1' })]);

    render(
      <ProjectTasksSection
        projectId="project-1"
        members={members}
        currentUserId="member-a"
        canManage={false}
      />
    );

    expect(await screen.findByText('我创建的任务')).toBeTruthy();
    expect(screen.getByRole('button', { name: '删除任务 我创建的任务' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '删除任务 别人创建的任务' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '删除任务 我创建的任务' }));
    expect(screen.getByText('删除这个任务？')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() => {
      expect(mockDeleteProjectTask).toHaveBeenCalledWith('task-own');
    });
  });
});
