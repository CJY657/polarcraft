// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectEvidence } from '@/lib/research.service';
import { ProjectEvidenceSection } from './ProjectEvidenceSection';

const mockGetProjectEvidence = vi.fn();
const mockCreateProjectEvidence = vi.fn();
const mockUpdateProjectEvidence = vi.fn();
const mockDeleteProjectEvidence = vi.fn();
const mockUploadProjectEvidenceAttachment = vi.fn();
const mockGetPublicProjectEvidence = vi.fn();

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, isOpen }: { children: unknown; isOpen: boolean }) => (isOpen ? <div>{children}</div> : null),
}));

vi.mock('@/lib/research.service', () => ({
  researchApi: {
    getProjectEvidence: (...args: unknown[]) => mockGetProjectEvidence(...args),
    createProjectEvidence: (...args: unknown[]) => mockCreateProjectEvidence(...args),
    updateProjectEvidence: (...args: unknown[]) => mockUpdateProjectEvidence(...args),
    deleteProjectEvidence: (...args: unknown[]) => mockDeleteProjectEvidence(...args),
    uploadProjectEvidenceAttachment: (...args: unknown[]) => mockUploadProjectEvidenceAttachment(...args),
  },
}));

vi.mock('@/lib/profile.service', () => ({
  profileApi: {
    getPublicProjectEvidence: (...args: unknown[]) => mockGetPublicProjectEvidence(...args),
  },
}));

function createEvidence(overrides: Partial<ProjectEvidence> = {}): ProjectEvidence {
  return {
    id: 'evidence-1',
    project_id: 'project-1',
    title: '偏振图样观察',
    evidence_type: 'image_observation',
    description: '记录旋转偏振片后的明暗变化。',
    external_url: 'https://example.com/evidence',
    attachment_url: '/uploads/courses/project-evidence-project-1/image/a.png',
    attachment_original_name: 'a.png',
    attachment_size: 128,
    attachment_mime_type: 'image/png',
    attachment_category: 'image',
    attachment_note: '原始观察图',
    created_by: 'member-1',
    creator_username: '小林',
    creator_avatar_url: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('ProjectEvidenceSection', () => {
  beforeEach(() => {
    mockGetProjectEvidence.mockReset();
    mockCreateProjectEvidence.mockReset();
    mockUpdateProjectEvidence.mockReset();
    mockDeleteProjectEvidence.mockReset();
    mockUploadProjectEvidenceAttachment.mockReset();
    mockGetPublicProjectEvidence.mockReset();
    mockCreateProjectEvidence.mockResolvedValue(createEvidence());
    mockUpdateProjectEvidence.mockResolvedValue(createEvidence());
    mockDeleteProjectEvidence.mockResolvedValue(undefined);
    mockUploadProjectEvidenceAttachment.mockResolvedValue({
      url: '/uploads/courses/project-evidence-project-1/image/new.png',
      filename: 'new.png',
      originalName: 'new.png',
      size: 256,
      mimeType: 'image/png',
      category: 'image',
      unitId: 'project-evidence-project-1',
    });
  });

  it('shows a member empty state with first-evidence CTA', async () => {
    mockGetProjectEvidence.mockResolvedValue([]);

    render(<ProjectEvidenceSection projectId="project-1" canManage />);

    expect(await screen.findByText('还没有研究证据')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '上传第一条研究证据' }));

    expect(screen.getByText('新增研究证据')).toBeTruthy();
    expect(screen.getByLabelText('标题')).toBeTruthy();
  });

  it('uses the public endpoint and hides actions in read-only mode', async () => {
    mockGetPublicProjectEvidence.mockResolvedValue([createEvidence()]);

    render(<ProjectEvidenceSection projectId="project-1" canManage={false} usePublicEndpoint />);

    expect(await screen.findByText('偏振图样观察')).toBeTruthy();
    expect(mockGetPublicProjectEvidence).toHaveBeenCalledWith('project-1');
    expect(screen.getByText('只读浏览：新增和编辑证据仅对课题成员开放。')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /编辑证据/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /删除证据/ })).toBeNull();
  });

  it('creates evidence with an uploaded attachment and refreshes the list', async () => {
    mockGetProjectEvidence
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createEvidence({ title: '新证据' })]);
    const { container } = render(<ProjectEvidenceSection projectId="project-1" canManage />);

    fireEvent.click(await screen.findByRole('button', { name: '上传第一条研究证据' }));
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '新证据' } });
    fireEvent.change(screen.getByLabelText('过程说明'), { target: { value: '新的观察说明' } });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['image-bytes'], 'new.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: '保存证据' }));

    await waitFor(() => {
      expect(mockUploadProjectEvidenceAttachment).toHaveBeenCalledWith('project-1', 'image', file);
    });
    expect(mockCreateProjectEvidence).toHaveBeenCalledWith(
      'project-1',
      expect.objectContaining({
        title: '新证据',
        description: '新的观察说明',
        attachment_url: '/uploads/courses/project-evidence-project-1/image/new.png',
        attachment_original_name: 'new.png',
      })
    );
    expect(await screen.findByText('新证据')).toBeTruthy();
  });

  it('edits existing evidence without requiring a new attachment', async () => {
    mockGetProjectEvidence
      .mockResolvedValueOnce([createEvidence()])
      .mockResolvedValueOnce([createEvidence({ title: '更新后的证据' })]);

    render(<ProjectEvidenceSection projectId="project-1" canManage />);

    fireEvent.click(await screen.findByRole('button', { name: '编辑证据 偏振图样观察' }));
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '更新后的证据' } });
    fireEvent.click(screen.getByRole('button', { name: '保存证据' }));

    await waitFor(() => {
      expect(mockUpdateProjectEvidence).toHaveBeenCalledWith(
        'project-1',
        'evidence-1',
        expect.objectContaining({
          title: '更新后的证据',
          evidence_type: 'image_observation',
        })
      );
    });
    expect(mockUploadProjectEvidenceAttachment).not.toHaveBeenCalled();
  });

  it('confirms deletion before deleting evidence', async () => {
    mockGetProjectEvidence
      .mockResolvedValueOnce([createEvidence()])
      .mockResolvedValueOnce([]);

    render(<ProjectEvidenceSection projectId="project-1" canManage />);

    fireEvent.click(await screen.findByRole('button', { name: '删除证据 偏振图样观察' }));
    expect(screen.getByText('删除后无法恢复，后续引用可能失去依据。')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() => {
      expect(mockDeleteProjectEvidence).toHaveBeenCalledWith('project-1', 'evidence-1');
    });
    expect(await screen.findByText('还没有研究证据')).toBeTruthy();
  });

  it('shows load failure and can retry', async () => {
    mockGetProjectEvidence
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce([]);

    render(<ProjectEvidenceSection projectId="project-1" canManage />);

    expect(await screen.findByText('证据库加载失败')).toBeTruthy();
    expect(screen.getByText('network down')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '重试' }));

    expect(await screen.findByText('还没有研究证据')).toBeTruthy();
  });
});
