// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectDiscussionSection } from './ProjectDiscussionSection';

const mockGetProjectDiscussionComments = vi.fn();
const mockUploadProjectDiscussionImage = vi.fn();
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
});

describe('ProjectDiscussionSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjectDiscussionComments.mockResolvedValue([]);
    mockUploadProjectDiscussionImage.mockResolvedValue({ url: '/uploads/test.png' });
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
});
