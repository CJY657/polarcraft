// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectDiscussionSection } from './ProjectDiscussionSection';

const mockGetProjectDiscussionComments = vi.fn();
const mockUploadProjectDiscussionImage = vi.fn();
const mockUploadProjectDiscussionVideo = vi.fn();
const mockAddProjectDiscussionComment = vi.fn();
const mockDeleteProjectDiscussionComment = vi.fn();

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, isOpen }: { children: unknown; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock('@/lib/research.service', () => ({
  researchApi: {
    getProjectDiscussionComments: (...args: unknown[]) => mockGetProjectDiscussionComments(...args),
    uploadProjectDiscussionImage: (...args: unknown[]) => mockUploadProjectDiscussionImage(...args),
    uploadProjectDiscussionVideo: (...args: unknown[]) => mockUploadProjectDiscussionVideo(...args),
    addProjectDiscussionComment: (...args: unknown[]) => mockAddProjectDiscussionComment(...args),
    deleteProjectDiscussionComment: (...args: unknown[]) => mockDeleteProjectDiscussionComment(...args),
  },
}));

class MockDataTransfer {
  private store: File[] = [];

  items = {
    add: (file: File) => {
      this.store.push(file);
    },
  };

  get files(): FileList {
    return this.store as unknown as FileList;
  }
}

function createComment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'comment-1',
    project_id: 'project-1',
    user_id: 'user-1',
    parent_comment_id: null,
    content: '基础讨论',
    image_urls: [],
    is_deleted: false,
    created_at: '2026-04-10T08:00:00.000Z',
    updated_at: '2026-04-10T08:00:00.000Z',
    username: '研究员',
    avatar_url: null,
    video_urls: [],
    ...overrides,
  };
}

function createClipboardImageItem(file: File) {
  return {
    type: file.type,
    getAsFile: () => file,
  };
}

beforeAll(() => {
  vi.stubGlobal('DataTransfer', MockDataTransfer);

  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: vi.fn((file: File) => `blob:${file.name}`),
  });

  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    writable: true,
    value: vi.fn(),
  });
});

describe('ProjectDiscussionSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjectDiscussionComments.mockResolvedValue([]);
    mockUploadProjectDiscussionImage.mockResolvedValue({ url: '/uploads/test.png' });
    mockUploadProjectDiscussionVideo.mockResolvedValue({ url: '/uploads/test.mp4' });
    mockAddProjectDiscussionComment.mockResolvedValue({ id: 'new-comment' });
    mockDeleteProjectDiscussionComment.mockResolvedValue(undefined);
  });

  it('supports pasting an image into the new comment composer', async () => {
    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开讨论区' }));

    const textarea = await screen.findByPlaceholderText(/支持 Ctrl\+V 粘贴图片/);
    const file = new File(['image-bytes'], 'pasted-comment.png', { type: 'image/png' });

    fireEvent.paste(textarea, {
      clipboardData: {
        items: [createClipboardImageItem(file)],
      },
    });

    await waitFor(() => {
      expect(screen.getByAltText('pasted-comment.png')).toBeTruthy();
    });
  });

  it('supports pasting an image into a reply composer', async () => {
    mockGetProjectDiscussionComments.mockResolvedValue([createComment()]);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开讨论区' }));

    await screen.findByText('基础讨论');
    fireEvent.click(screen.getByRole('button', { name: '回复' }));

    const replyTextarea = await screen.findByPlaceholderText('补充你的看法、建议或追问（支持 Ctrl+V 粘贴图片）');
    const file = new File(['image-bytes'], 'pasted-reply.png', { type: 'image/png' });

    fireEvent.paste(replyTextarea, {
      clipboardData: {
        items: [createClipboardImageItem(file)],
      },
    });

    await waitFor(() => {
      expect(screen.getByAltText('pasted-reply.png')).toBeTruthy();
    });
  });

  it('uploads a video attachment with a new comment', async () => {
    const { container } = render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开讨论区' }));

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['video-bytes'], 'demo.mp4', { type: 'video/mp4' });

    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(container.querySelector('video[src="blob:demo.mp4"]')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: '发布' }));

    await waitFor(() => {
      expect(mockUploadProjectDiscussionVideo).toHaveBeenCalledWith('project-1', file);
    });
    expect(mockAddProjectDiscussionComment).toHaveBeenCalledWith('project-1', {
      content: '',
      imageUrls: [],
      videoUrls: ['/uploads/test.mp4'],
    });
  });

  it('opens the requested discussion subsection when jumped from research info', async () => {
    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
        outline={{
          topicSummary: '研究摘要',
          questions: ['基础问题'],
          hypotheses: ['扩展假设'],
          basicPlan: '基础实验',
          extendedPlan: '扩展实验',
        }}
        jumpRequest={{ section: 'extended', index: 0, version: 1 }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '收起讨论区' })).toBeTruthy();
    });
    await waitFor(() => {
      expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  it('opens and scrolls to the comment composer when jumped to comments', async () => {
    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
        jumpRequest={{ section: 'comments', version: 1 }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '收起讨论区' })).toBeTruthy();
    });
    await waitFor(() => {
      expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });
    expect((HTMLElement.prototype.scrollIntoView as any).mock.contexts[0]).toBe(
      document.getElementById('discussion-comments')
    );
  });

  it('expands collapsed comment ancestors and scrolls to a targeted reply', async () => {
    mockGetProjectDiscussionComments.mockResolvedValue([
      createComment({
        id: 'parent-comment',
        content: '父级讨论',
      }),
      createComment({
        id: 'reply-comment',
        parent_comment_id: 'parent-comment',
        content: '目标回复',
        user_id: 'user-2',
        username: '回复者',
      }),
    ]);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
        jumpRequest={{ section: 'comments', commentId: 'reply-comment', version: 1 }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('目标回复')).toBeTruthy();
    });
    await waitFor(() => {
      const scrollMock = HTMLElement.prototype.scrollIntoView as any;
      const scrollContexts = scrollMock.mock.contexts;
      expect(scrollContexts[scrollContexts.length - 1]).toBe(
        document.getElementById('discussion-comment-reply-comment')
      );
    });
  });

  it('resets the lightbox zoom state after closing and reopening an image', async () => {
    mockGetProjectDiscussionComments.mockResolvedValue([
      createComment({
        image_urls: ['/uploads/discussion-image.png'],
      }),
    ]);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开讨论区' }));
    await screen.findByText('基础讨论');

    fireEvent.click(screen.getAllByAltText('研究员 上传的图片 1')[0]);

    const zoomButton = await screen.findByRole('button', { name: '放大图片' });
    expect(zoomButton.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('discussion-lightbox-image').getAttribute('data-zoomed')).toBe('false');

    fireEvent.click(zoomButton);

    expect(screen.getByRole('button', { name: '还原图片' }).getAttribute('aria-pressed')).toBe(
      'true'
    );
    expect(screen.getByTestId('discussion-lightbox-image').getAttribute('data-zoomed')).toBe(
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: '关闭大图预览' }));

    await waitFor(() => {
      expect(screen.queryByTestId('discussion-lightbox-image')).toBeNull();
    });

    fireEvent.click(screen.getAllByAltText('研究员 上传的图片 1')[0]);

    expect((await screen.findByRole('button', { name: '放大图片' })).getAttribute('aria-pressed')).toBe(
      'false'
    );
    expect(screen.getByTestId('discussion-lightbox-image').getAttribute('data-zoomed')).toBe(
      'false'
    );
  });

  it('asks for confirmation before deleting a comment', async () => {
    mockGetProjectDiscussionComments.mockResolvedValue([createComment()]);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开讨论区' }));
    await screen.findByText('基础讨论');

    fireEvent.click(screen.getByRole('button', { name: '删除' }));

    // Confirm window is shown and nothing is deleted yet.
    expect(screen.getByText('删除这条留言？')).toBeTruthy();
    expect(mockDeleteProjectDiscussionComment).not.toHaveBeenCalled();

    // The dialog's confirm button is the second "删除" button.
    const deleteButtons = screen.getAllByRole('button', { name: '删除' });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(mockDeleteProjectDiscussionComment).toHaveBeenCalledWith('comment-1');
    });
  });
});
