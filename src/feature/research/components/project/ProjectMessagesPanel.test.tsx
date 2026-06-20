// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectMessagesPanel } from './ProjectMessagesPanel';

const mockGetProjectMessages = vi.fn();
const mockSendProjectMessage = vi.fn();
const mockSendProjectAnnouncement = vi.fn();
const mockMarkProjectMessagesRead = vi.fn();
const mockFetchUnreadCount = vi.fn();

vi.mock('@/lib/research.service', () => ({
  researchApi: {
    getProjectMessages: (...args: unknown[]) => mockGetProjectMessages(...args),
    sendProjectMessage: (...args: unknown[]) => mockSendProjectMessage(...args),
    sendProjectAnnouncement: (...args: unknown[]) => mockSendProjectAnnouncement(...args),
    markProjectMessagesRead: (...args: unknown[]) => mockMarkProjectMessagesRead(...args),
  },
}));

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: (selector: (state: { fetchUnreadCount: () => Promise<void> }) => unknown) =>
    selector({ fetchUnreadCount: mockFetchUnreadCount }),
}));

function createMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'message-1',
    project_id: 'project-1',
    sender_id: 'member-1',
    kind: 'message',
    content: '已有消息',
    created_at: '2026-06-20T08:00:00.000Z',
    username: '成员一',
    avatar_url: null,
    ...overrides,
  };
}

describe('ProjectMessagesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjectMessages.mockResolvedValue([createMessage()]);
    mockSendProjectMessage.mockResolvedValue({ id: 'message-2' });
    mockSendProjectAnnouncement.mockResolvedValue({ id: 'message-3' });
    mockMarkProjectMessagesRead.mockResolvedValue({ updated_count: 1 });
    mockFetchUnreadCount.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders messages and sends non-empty content', async () => {
    mockGetProjectMessages
      .mockResolvedValueOnce([createMessage()])
      .mockResolvedValueOnce([
        createMessage(),
        createMessage({
          id: 'message-2',
          sender_id: 'member-2',
          content: '新的同步',
          username: '成员二',
        }),
      ]);

    render(
      <ProjectMessagesPanel
        projectId="project-1"
        currentUserId="member-1"
        canAnnounce={false}
      />
    );

    expect(await screen.findByText('已有消息')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('消息内容'), {
      target: { value: '新的同步' },
    });
    fireEvent.click(screen.getByRole('button', { name: '发送消息' }));

    await waitFor(() => {
      expect(mockSendProjectMessage).toHaveBeenCalledWith('project-1', '新的同步');
    });
    expect(await screen.findByText('新的同步')).toBeTruthy();
    expect(mockSendProjectAnnouncement).not.toHaveBeenCalled();
  });

  it('shows announcement mode only when allowed', async () => {
    const { rerender } = render(
      <ProjectMessagesPanel
        projectId="project-1"
        currentUserId="member-1"
        canAnnounce={false}
      />
    );

    await screen.findByText('已有消息');
    expect(screen.queryByRole('button', { name: '公告' })).toBeNull();

    rerender(
      <ProjectMessagesPanel
        projectId="project-1"
        currentUserId="member-1"
        canAnnounce
      />
    );

    expect(screen.getByRole('button', { name: '公告' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '公告' }));
    fireEvent.change(screen.getByLabelText('公告内容'), {
      target: { value: '阶段汇报周五完成' },
    });
    fireEvent.click(screen.getByRole('button', { name: '发布公告' }));

    await waitFor(() => {
      expect(mockSendProjectAnnouncement).toHaveBeenCalledWith('project-1', '阶段汇报周五完成');
    });
  });
});
