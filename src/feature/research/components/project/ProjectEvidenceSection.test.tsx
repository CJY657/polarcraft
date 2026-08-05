// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectEvidence } from '@/lib/research.service';
import { ProjectEvidenceSection } from './ProjectEvidenceSection';

const mockGetProjectEvidence = vi.fn();
const mockCreateProjectEvidence = vi.fn();
const mockUpdateProjectEvidence = vi.fn();
const mockDeleteProjectEvidence = vi.fn();
const mockReorderProjectEvidence = vi.fn();
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
    reorderProjectEvidence: (...args: unknown[]) => mockReorderProjectEvidence(...args),
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
    attachments: [{
      url: '/uploads/courses/project-evidence-project-1/image/a.png',
      original_name: 'a.png',
      size: 128,
      mime_type: 'image/png',
      category: 'image',
    }],
    sort_order: 0,
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
    mockReorderProjectEvidence.mockReset();
    mockUploadProjectEvidenceAttachment.mockReset();
    mockGetPublicProjectEvidence.mockReset();
    mockCreateProjectEvidence.mockResolvedValue(createEvidence());
    mockUpdateProjectEvidence.mockResolvedValue(createEvidence());
    mockDeleteProjectEvidence.mockResolvedValue(undefined);
    mockReorderProjectEvidence.mockResolvedValue([]);
    mockUploadProjectEvidenceAttachment.mockResolvedValue({
      url: '/uploads/courses/project-evidence-project-1/image/new.png',
      filename: 'new.png',
      originalName: '中文证据.png',
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
    mockGetPublicProjectEvidence.mockResolvedValue([createEvidence({
      attachments: [
        {
          url: '/uploads/courses/project-evidence-project-1/image/a.png',
          original_name: 'a.png',
          size: 128,
          mime_type: 'image/png',
          category: 'image',
        },
        {
          url: '/uploads/courses/project-evidence-project-1/pdf/support.pdf',
          original_name: 'support.pdf',
          size: 512,
          mime_type: 'application/pdf',
          category: 'pdf',
        },
      ],
    })]);

    render(<ProjectEvidenceSection projectId="project-1" canManage={false} usePublicEndpoint />);

    expect(await screen.findByText('偏振图样观察')).toBeTruthy();
    expect(mockGetPublicProjectEvidence).toHaveBeenCalledWith('project-1');
    expect(screen.getByText('只读浏览：新增和编辑证据仅对课题成员开放。')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /编辑证据/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /删除证据/ })).toBeNull();
    expect(screen.getByText('a.png')).toBeTruthy();
    expect(screen.getByText('support.pdf')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '调整顺序' })).toBeNull();
  });

  it('creates evidence with an uploaded attachment and refreshes the list', async () => {
    mockGetProjectEvidence
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        createEvidence({
          title: '新证据',
          attachment_original_name: '中文证据.png',
          attachments: [{
            url: '/uploads/courses/project-evidence-project-1/image/new.png',
            original_name: '中文证据.png',
            size: 256,
            mime_type: 'image/png',
            category: 'image',
          }],
        }),
      ]);
    const { container } = render(<ProjectEvidenceSection projectId="project-1" canManage />);

    fireEvent.click(await screen.findByRole('button', { name: '上传第一条研究证据' }));
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '新证据' } });
    fireEvent.change(screen.getByLabelText('过程说明'), { target: { value: '新的观察说明' } });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['image-bytes'], '中文证据.png', { type: 'image/png' });
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
        attachments: [{
          url: '/uploads/courses/project-evidence-project-1/image/new.png',
          original_name: '中文证据.png',
          size: 256,
          mime_type: 'image/png',
          category: 'image',
        }],
      })
    );
    expect(await screen.findByText('新证据')).toBeTruthy();
    expect(screen.getByText('中文证据.png')).toBeTruthy();
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

  it('selects multiple files, promotes a supporting file, and saves attachment order', async () => {
    mockGetProjectEvidence.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockUploadProjectEvidenceAttachment
      .mockResolvedValueOnce({
        url: '/uploads/courses/project-evidence-project-1/pdf/support.pdf',
        filename: 'support.pdf',
        originalName: '支持材料.pdf',
        size: 512,
        mimeType: 'application/pdf',
        category: 'pdf',
        unitId: 'project-evidence-project-1',
      })
      .mockResolvedValueOnce({
        url: '/uploads/courses/project-evidence-project-1/image/primary.png',
        filename: 'primary.png',
        originalName: '原主附件.png',
        size: 256,
        mimeType: 'image/png',
        category: 'image',
        unitId: 'project-evidence-project-1',
      });
    const { container } = render(<ProjectEvidenceSection projectId="project-1" canManage />);

    fireEvent.click(await screen.findByRole('button', { name: '上传第一条研究证据' }));
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '多附件证据' } });
    const image = new File(['image'], '原主附件.png', { type: 'image/png' });
    const pdf = new File(['pdf'], '支持材料.pdf', { type: 'application/pdf' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [image, pdf] } });

    expect(screen.getByText('2/10')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '设为主附件 支持材料.pdf' }));
    fireEvent.click(screen.getByRole('button', { name: '保存证据' }));

    await waitFor(() => expect(mockCreateProjectEvidence).toHaveBeenCalled());
    expect(mockUploadProjectEvidenceAttachment).toHaveBeenNthCalledWith(1, 'project-1', 'pdf', pdf);
    expect(mockUploadProjectEvidenceAttachment).toHaveBeenNthCalledWith(2, 'project-1', 'image', image);
    expect(mockCreateProjectEvidence).toHaveBeenCalledWith(
      'project-1',
      expect.objectContaining({
        attachments: [
          expect.objectContaining({ original_name: '支持材料.pdf' }),
          expect.objectContaining({ original_name: '原主附件.png' }),
        ],
      })
    );
  });

  it('enforces the ten-attachment selection limit before upload', async () => {
    mockGetProjectEvidence.mockResolvedValue([]);
    const { container } = render(<ProjectEvidenceSection projectId="project-1" canManage />);

    fireEvent.click(await screen.findByRole('button', { name: '上传第一条研究证据' }));
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const firstTen = Array.from({ length: 10 }, (_, index) => (
      new File([String(index)], `${index}.png`, { type: 'image/png' })
    ));
    fireEvent.change(fileInput, { target: { files: firstTen } });
    expect(screen.getByText('10/10')).toBeTruthy();

    fireEvent.change(fileInput, {
      target: { files: [new File(['extra'], 'extra.png', { type: 'image/png' })] },
    });
    expect(screen.getByText('每条证据最多保留 10 个附件')).toBeTruthy();
    expect(mockUploadProjectEvidenceAttachment).not.toHaveBeenCalled();
  });

  it('keeps successful uploads in the draft when a later upload fails', async () => {
    mockGetProjectEvidence.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockUploadProjectEvidenceAttachment
      .mockResolvedValueOnce({
        url: '/uploads/courses/project-evidence-project-1/image/a.png',
        filename: 'a.png',
        originalName: 'a.png',
        size: 128,
        mimeType: 'image/png',
        category: 'image',
        unitId: 'project-evidence-project-1',
      })
      .mockRejectedValueOnce(new Error('第二个文件上传失败'))
      .mockResolvedValueOnce({
        url: '/uploads/courses/project-evidence-project-1/pdf/b.pdf',
        filename: 'b.pdf',
        originalName: 'b.pdf',
        size: 256,
        mimeType: 'application/pdf',
        category: 'pdf',
        unitId: 'project-evidence-project-1',
      });
    const { container } = render(<ProjectEvidenceSection projectId="project-1" canManage />);

    fireEvent.click(await screen.findByRole('button', { name: '上传第一条研究证据' }));
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '重试证据' } });
    const first = new File(['a'], 'a.png', { type: 'image/png' });
    const second = new File(['b'], 'b.pdf', { type: 'application/pdf' });
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [first, second] },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存证据' }));

    expect(await screen.findByText('第二个文件上传失败')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '保存证据' }));

    await waitFor(() => expect(mockCreateProjectEvidence).toHaveBeenCalled());
    expect(mockUploadProjectEvidenceAttachment).toHaveBeenCalledTimes(3);
    expect(mockUploadProjectEvidenceAttachment.mock.calls.map((call) => (call[2] as File).name))
      .toEqual(['a.png', 'b.pdf', 'b.pdf']);
  });

  it('reorders evidence with save and restores the saved order on cancel', async () => {
    const first = createEvidence({ id: 'evidence-1', title: '第一条', sort_order: 0 });
    const second = createEvidence({ id: 'evidence-2', title: '第二条', sort_order: 1 });
    mockGetProjectEvidence.mockResolvedValue([first, second]);
    mockReorderProjectEvidence.mockResolvedValue([second, first]);

    render(<ProjectEvidenceSection projectId="project-1" canManage />);

    fireEvent.click(await screen.findByRole('button', { name: '调整顺序' }));
    fireEvent.click(screen.getByRole('button', { name: '上移证据 第二条' }));
    fireEvent.click(screen.getByRole('button', { name: '保存顺序' }));

    await waitFor(() => {
      expect(mockReorderProjectEvidence).toHaveBeenCalledWith('project-1', {
        expectedEvidenceIds: ['evidence-1', 'evidence-2'],
        evidenceIds: ['evidence-2', 'evidence-1'],
      });
    });
    fireEvent.click(screen.getByRole('button', { name: '调整顺序' }));
    fireEvent.click(screen.getByRole('button', { name: '下移证据 第二条' }));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    const headings = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(['第二条', '第一条']);
  });

  it('keeps reorder mode open when saving the order fails', async () => {
    mockGetProjectEvidence.mockResolvedValue([
      createEvidence({ id: 'evidence-1', title: '第一条', sort_order: 0 }),
      createEvidence({ id: 'evidence-2', title: '第二条', sort_order: 1 }),
    ]);
    mockReorderProjectEvidence.mockRejectedValue(new Error('证据列表已发生变化'));

    render(<ProjectEvidenceSection projectId="project-1" canManage />);

    fireEvent.click(await screen.findByRole('button', { name: '调整顺序' }));
    fireEvent.click(screen.getByRole('button', { name: '保存顺序' }));

    expect(await screen.findByText('证据列表已发生变化')).toBeTruthy();
    expect(screen.getByRole('button', { name: '保存顺序' })).toBeTruthy();
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
