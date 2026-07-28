// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectDiscussionSection } from './ProjectDiscussionSection';

const mockGetProjectDiscussionComments = vi.fn();
const mockUploadProjectDiscussionImage = vi.fn();
const mockUploadProjectDiscussionVideo = vi.fn();
const mockAddProjectDiscussionComment = vi.fn();
const mockDeleteProjectDiscussionComment = vi.fn();
const mockUpdateProjectDiscussionComment = vi.fn();

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
    updateProjectDiscussionComment: (...args: unknown[]) => mockUpdateProjectDiscussionComment(...args),
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

function openGeneralDiscussion() {
  fireEvent.click(screen.getByRole('button', { name: /其它讨论/ }));
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
    mockUpdateProjectDiscussionComment.mockResolvedValue(undefined);
  });

  it('supports pasting an image into the new comment composer', async () => {
    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
      />
    );

    openGeneralDiscussion();

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

    openGeneralDiscussion();

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

    openGeneralDiscussion();

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

  it('groups root comments by question and keeps only one discussion row open', async () => {
    mockGetProjectDiscussionComments.mockResolvedValue([
      createComment({
        id: 'question-0-root',
        content: '问题一答案',
        question_index: 0,
      }),
      createComment({
        id: 'question-0-reply',
        parent_comment_id: 'question-0-root',
        content: '问题一追问',
        user_id: 'user-2',
        updated_at: '2026-04-12T08:00:00.000Z',
      }),
      createComment({
        id: 'question-1-root',
        content: '问题二答案',
        question_index: 1,
      }),
      createComment({
        id: 'legacy-general',
        content: '旧版其它讨论',
      }),
    ]);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
        outline={{
          topicSummary: '研究摘要',
          questions: ['第一个核心问题', '第二个核心问题'],
          hypotheses: [],
        }}
      />
    );

    const firstQuestion = await screen.findByRole('button', { name: /第一个核心问题/ });
    const secondQuestion = screen.getByRole('button', { name: /第二个核心问题/ });
    const general = screen.getByRole('button', { name: /其它讨论/ });

    expect(firstQuestion.textContent).toContain('2 条讨论');
    expect(firstQuestion.textContent).toContain('最近活动');
    expect(general.textContent).toContain('1 条讨论');

    fireEvent.click(firstQuestion);
    expect(await screen.findByText('问题一答案')).toBeTruthy();
    expect(screen.queryByText('问题二答案')).toBeNull();
    expect(screen.queryByText('旧版其它讨论')).toBeNull();

    fireEvent.click(secondQuestion);
    expect(secondQuestion.getAttribute('aria-expanded')).toBe('true');
    expect(firstQuestion.getAttribute('aria-expanded')).toBe('false');
    expect(await screen.findByText('问题二答案')).toBeTruthy();
    expect(screen.queryByText('问题一答案')).toBeNull();

    fireEvent.click(general);
    expect(general.getAttribute('aria-expanded')).toBe('true');
    expect(secondQuestion.getAttribute('aria-expanded')).toBe('false');
    expect(await screen.findByText('旧版其它讨论')).toBeTruthy();
    expect(screen.queryByText('问题二答案')).toBeNull();
  });

  it('clears the top-level draft when switching discussion rows', async () => {
    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
        outline={{
          topicSummary: '',
          questions: ['第一个核心问题', '第二个核心问题'],
          hypotheses: [],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /第一个核心问题/ }));
    fireEvent.change(screen.getByPlaceholderText(/写下你的答案或新观点/), {
      target: { value: '只属于问题一的草稿' },
    });

    fireEvent.click(screen.getByRole('button', { name: /第二个核心问题/ }));

    expect((await screen.findByPlaceholderText(
      /写下你的答案或新观点/
    ) as HTMLTextAreaElement).value).toBe('');
  });

  it('keeps the top-level draft when collapsing and reopening the same row', async () => {
    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
        outline={{
          topicSummary: '',
          questions: ['核心问题'],
          hypotheses: [],
        }}
      />
    );

    const questionRow = screen.getByRole('button', { name: /核心问题/ });
    fireEvent.click(questionRow);
    fireEvent.change(screen.getByPlaceholderText(/写下你的答案或新观点/), {
      target: { value: '尚未发布的草稿' },
    });

    fireEvent.click(questionRow);
    fireEvent.click(questionRow);

    expect((await screen.findByPlaceholderText(
      /写下你的答案或新观点/
    ) as HTMLTextAreaElement).value).toBe('尚未发布的草稿');
  });

  it('sends questionIndex for a question answer', async () => {
    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
        outline={{
          topicSummary: '',
          questions: ['需要回答的问题'],
          hypotheses: [],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /需要回答的问题/ }));
    const composer = screen.getByPlaceholderText(/写下你的答案或新观点/);
    fireEvent.change(composer, { target: { value: '我的答案' } });
    fireEvent.click(screen.getByRole('button', { name: '发布' }));

    await waitFor(() => {
      expect(mockAddProjectDiscussionComment).toHaveBeenCalledWith('project-1', {
        content: '我的答案',
        imageUrls: [],
        videoUrls: [],
        questionIndex: 0,
      });
    });
  });

  it('keeps topic comments out of general and replies send only parentCommentId', async () => {
    mockGetProjectDiscussionComments.mockResolvedValue([
      createComment({
        id: 'question-root',
        content: '问题答案',
        question_index: 0,
      }),
    ]);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
        outline={{
          topicSummary: '',
          questions: ['核心问题'],
          hypotheses: [],
        }}
      />
    );

    openGeneralDiscussion();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /其它讨论/ }).textContent).toContain('0 条讨论');
    });
    expect(screen.queryByText('问题答案')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /核心问题/ }));
    await screen.findByText('问题答案');
    fireEvent.click(screen.getByRole('button', { name: '回复' }));
    fireEvent.change(
      screen.getByPlaceholderText('补充你的看法、建议或追问（支持 Ctrl+V 粘贴图片）'),
      { target: { value: '继续追问' } }
    );
    fireEvent.click(screen.getByRole('button', { name: '发送回复' }));

    await waitFor(() => {
      expect(mockAddProjectDiscussionComment).toHaveBeenCalledWith('project-1', {
        content: '继续追问',
        parentCommentId: 'question-root',
        imageUrls: [],
        videoUrls: [],
      });
    });
  });

  it('keeps nested replies collapsed by default', async () => {
    mockGetProjectDiscussionComments.mockResolvedValue([
      createComment({
        id: 'question-root',
        content: '问题答案',
        question_index: 0,
      }),
      createComment({
        id: 'first-reply',
        parent_comment_id: 'question-root',
        content: '一级追问',
      }),
      createComment({
        id: 'nested-reply',
        parent_comment_id: 'first-reply',
        content: '二级追问',
      }),
    ]);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
        outline={{
          topicSummary: '',
          questions: ['核心问题'],
          hypotheses: [],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /核心问题/ }));
    await screen.findByText('问题答案');
    expect(screen.queryByText('一级追问')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /展开 2 条回复/ }));
    expect(await screen.findByText('一级追问')).toBeTruthy();
    expect(screen.queryByText('二级追问')).toBeNull();
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
      expect(screen.getByRole('button', { name: /其它讨论/ }).getAttribute('aria-expanded')).toBe(
        'true'
      );
    });
    await waitFor(() => {
      expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });
    expect((HTMLElement.prototype.scrollIntoView as any).mock.contexts[0]).toBe(
      document.getElementById('discussion-comments')
    );
  });

  it('opens the scoped question, expands reply ancestors and scrolls to a targeted reply', async () => {
    mockGetProjectDiscussionComments.mockResolvedValue([
      createComment({
        id: 'parent-comment',
        content: '父级讨论',
        question_index: 0,
      }),
      createComment({
        id: 'middle-reply',
        parent_comment_id: 'parent-comment',
        content: '中间回复',
        user_id: 'user-2',
        username: '回复者',
      }),
      createComment({
        id: 'reply-comment',
        parent_comment_id: 'middle-reply',
        content: '目标回复',
        user_id: 'user-3',
        username: '目标回复者',
      }),
    ]);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
        outline={{
          topicSummary: '',
          questions: ['深链问题'],
          hypotheses: [],
        }}
        jumpRequest={{ section: 'comments', commentId: 'reply-comment', version: 1 }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('目标回复')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: /深链问题/ }).getAttribute('aria-expanded')).toBe(
      'true'
    );
    expect(screen.getByRole('button', { name: /其它讨论/ }).getAttribute('aria-expanded')).toBe(
      'false'
    );
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

    openGeneralDiscussion();
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

    openGeneralDiscussion();
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

  it('lets the author edit their own comment inline and shows the edited marker', async () => {
    mockGetProjectDiscussionComments
      .mockResolvedValueOnce([createComment()])
      .mockResolvedValueOnce([
        createComment({
          content: '修改后的讨论',
          updated_at: '2026-04-11T08:00:00.000Z',
        }),
      ]);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
      />
    );

    openGeneralDiscussion();
    await screen.findByText('基础讨论');

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    const editor = screen.getByLabelText('编辑留言内容') as HTMLTextAreaElement;
    expect(editor.value).toBe('基础讨论');

    fireEvent.change(editor, { target: { value: '修改后的讨论' } });
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }));

    await waitFor(() => {
      expect(mockUpdateProjectDiscussionComment).toHaveBeenCalledWith('comment-1', '修改后的讨论');
    });
    expect(await screen.findByText('修改后的讨论')).toBeTruthy();
    expect(screen.getByText('已编辑')).toBeTruthy();
  });

  it('hides the edit action on other members comments', async () => {
    mockGetProjectDiscussionComments.mockResolvedValue([
      createComment({ user_id: 'user-2', username: '其他成员' }),
    ]);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
      />
    );

    openGeneralDiscussion();
    await screen.findByText('基础讨论');

    expect(screen.queryByRole('button', { name: '编辑' })).toBeNull();
  });

  it('rejects saving an empty edit on a text-only comment', async () => {
    mockGetProjectDiscussionComments.mockResolvedValue([createComment()]);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
      />
    );

    openGeneralDiscussion();
    await screen.findByText('基础讨论');

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    fireEvent.change(screen.getByLabelText('编辑留言内容'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }));

    expect(await screen.findByText('留言内容不能为空')).toBeTruthy();
    expect(mockUpdateProjectDiscussionComment).not.toHaveBeenCalled();
  });

  it('renders the first 20 threads and expands older ones on demand', async () => {
    const manyThreads = Array.from({ length: 25 }, (_, index) =>
      createComment({
        id: `thread-${index}`,
        content: `讨论串 ${index}`,
        created_at: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
        updated_at: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
      })
    );
    mockGetProjectDiscussionComments.mockResolvedValue(manyThreads);

    render(
      <ProjectDiscussionSection
        projectId="project-1"
        canParticipate
        currentUserId="user-1"
      />
    );

    openGeneralDiscussion();

    // 顶层按时间倒序排列：最新的 24 号先出现，最早的 0-4 号先被折叠
    await screen.findByText('讨论串 24');
    expect(screen.getByText('讨论串 5')).toBeTruthy();
    expect(screen.queryByText('讨论串 4')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /展开更早的讨论（还有 5 条）/ }));

    expect(await screen.findByText('讨论串 0')).toBeTruthy();
    expect(screen.queryByText(/展开更早的讨论/)).toBeNull();
  });
});
