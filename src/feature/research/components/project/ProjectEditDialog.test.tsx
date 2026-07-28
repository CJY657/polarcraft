// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResearchProject } from '@/lib/research.service';
import { ProjectEditDialog } from './ProjectEditDialog';

const mockUseAuth = vi.fn(() => ({ user: { role: 'user' } }));
const mockUpdateProject = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, isOpen }: { children: unknown; isOpen: boolean }) => isOpen ? <div>{children}</div> : null,
}));

vi.mock('@/lib/research.service', () => ({
  researchApi: { updateProject: (...args: unknown[]) => mockUpdateProject(...args) },
}));

const project: ResearchProject = {
  id: 'project-1',
  name_zh: '偏振课题',
  name_en: null,
  description_zh: null,
  description_en: null,
  thumbnail: null,
  status: 'active',
  is_public: true,
  allow_guest_comments: false,
  enable_task_board: true,
  member_count: 1,
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-11T00:00:00.000Z',
};

describe('ProjectEditDialog lifecycle control', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { role: 'user' } });
    mockUpdateProject.mockReset();
    mockUpdateProject.mockResolvedValue(project);
  });

  it('shows all statuses but only enables the current and next status', () => {
    render(
      <ProjectEditDialog
        isOpen
        onClose={vi.fn()}
        project={project}
        onSuccess={vi.fn()}
      />
    );

    const statusSelect = screen.getByLabelText('project.edit.status');
    const options = within(statusSelect).getAllByRole('option');
    expect(options.map((option) => option.getAttribute('value'))).toEqual([
      'draft',
      'recruiting',
      'forming',
      'active',
      'review_pending',
      'showcased',
      'relay_open',
      'archived',
    ]);
    expect(options.filter((option) => !(option as HTMLOptionElement).disabled).map((option) => option.getAttribute('value'))).toEqual([
      'active',
      'review_pending',
    ]);
  });

  it('focuses the research question field when opened from the management shortcut', async () => {
    render(
      <ProjectEditDialog
        isOpen
        onClose={vi.fn()}
        project={project}
        onSuccess={vi.fn()}
        initialFocusField="questions"
      />
    );

    const questionField = screen.getByLabelText('研究问题（中文，每行一个）');
    await waitFor(() => {
      expect(document.activeElement).toBe(questionField);
    });
  });

  it('enables every status for administrators', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'admin' } });

    render(
      <ProjectEditDialog
        isOpen
        onClose={vi.fn()}
        project={project}
        onSuccess={vi.fn()}
      />
    );

    const statusSelect = screen.getByLabelText('project.edit.status');
    const options = within(statusSelect).getAllByRole('option');
    expect(options.map((option) => option.getAttribute('value'))).toEqual([
      'draft',
      'recruiting',
      'forming',
      'active',
      'review_pending',
      'showcased',
      'relay_open',
      'archived',
    ]);
    expect(options.filter((option) => !(option as HTMLOptionElement).disabled).map((option) => option.getAttribute('value'))).toEqual([
      'draft',
      'recruiting',
      'forming',
      'active',
      'review_pending',
      'showcased',
      'relay_open',
      'archived',
    ]);
  });

  it('warns ordinary users before advancing because they cannot roll back', async () => {
    render(
      <ProjectEditDialog
        isOpen
        onClose={vi.fn()}
        project={project}
        onSuccess={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('project.edit.status'), {
      target: { value: 'review_pending' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    expect(screen.getByRole('alertdialog', { name: '确认推进课题阶段？' })).toBeTruthy();
    expect(screen.getByText('推进后你将无法自行回退，只有管理员可以回退课题进度。请确认当前阶段工作已经完成。')).toBeTruthy();
    expect(mockUpdateProject).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '仍然推进' }));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ status: 'review_pending' })
      );
    });
  });
});
