// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ProjectLeaderboardEntry,
  ProjectMeeting,
  ProjectMember,
} from '@/lib/research.service';
import { ProjectMeetingsSection } from './ProjectMeetingsSection';

const mockGetProjectMeetings = vi.fn();
const mockGetProjectMeeting = vi.fn();
const mockCreateProjectMeeting = vi.fn();
const mockUpdateProjectMeeting = vi.fn();
const mockGenerateMeetingMinutes = vi.fn();
const mockArchiveMeetingMinutes = vi.fn();
const mockUploadMeetingRecordFile = vi.fn();
const mockUpsertMyMeetingRating = vi.fn();
const mockGetMeetingRatings = vi.fn();
const mockGetProjectLeaderboard = vi.fn();

vi.mock('@/lib/research.service', () => ({
  researchApi: {
    getProjectMeetings: (...args: unknown[]) => mockGetProjectMeetings(...args),
    getProjectMeeting: (...args: unknown[]) => mockGetProjectMeeting(...args),
    createProjectMeeting: (...args: unknown[]) => mockCreateProjectMeeting(...args),
    updateProjectMeeting: (...args: unknown[]) => mockUpdateProjectMeeting(...args),
    generateMeetingMinutes: (...args: unknown[]) => mockGenerateMeetingMinutes(...args),
    archiveMeetingMinutes: (...args: unknown[]) => mockArchiveMeetingMinutes(...args),
    uploadMeetingRecordFile: (...args: unknown[]) => mockUploadMeetingRecordFile(...args),
    upsertMyMeetingRating: (...args: unknown[]) => mockUpsertMyMeetingRating(...args),
    getMeetingRatings: (...args: unknown[]) => mockGetMeetingRatings(...args),
    getProjectLeaderboard: (...args: unknown[]) => mockGetProjectLeaderboard(...args),
  },
}));

const DAY_IN_MS = 86_400_000;

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
  {
    id: 'member-2',
    project_id: 'project-1',
    user_id: 'member-b',
    role: 'member',
    joined_at: '2026-01-03T00:00:00.000Z',
    username: '小周',
    avatar_url: null,
  },
];

function createMeeting(overrides: Partial<ProjectMeeting> = {}): ProjectMeeting {
  return {
    id: 'meeting-1',
    project_id: 'project-1',
    title: '第一次例会',
    scheduled_at: '2026-08-01T10:00:00.000Z',
    duration_minutes: 60,
    location: '物理楼 302',
    agenda: null,
    status: 'completed',
    created_by: 'owner-1',
    raw_file: null,
    attendee_ids: ['owner-1', 'member-a'],
    ai_scores: null,
    minutes: null,
    has_minutes: false,
    created_at: '2026-07-30T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function createLeaderboardEntry(
  overrides: Partial<ProjectLeaderboardEntry> = {}
): ProjectLeaderboardEntry {
  return {
    user_id: 'owner-1',
    username: '组长',
    nickname: null,
    real_name: null,
    show_real_name_publicly: false,
    avatar_url: null,
    rank: 1,
    composite: 4.8,
    ai_avg: 4.6,
    peer_avg: 5,
    rated_meetings: 3,
    ...overrides,
  };
}

describe('ProjectMeetingsSection', () => {
  beforeEach(() => {
    mockGetProjectMeetings.mockReset();
    mockGetProjectMeeting.mockReset();
    mockCreateProjectMeeting.mockReset();
    mockUpdateProjectMeeting.mockReset();
    mockGenerateMeetingMinutes.mockReset();
    mockArchiveMeetingMinutes.mockReset();
    mockUploadMeetingRecordFile.mockReset();
    mockUpsertMyMeetingRating.mockReset();
    mockGetMeetingRatings.mockReset();
    mockGetProjectLeaderboard.mockReset();

    mockGetProjectMeetings.mockResolvedValue([]);
    mockGetProjectLeaderboard.mockResolvedValue({ top: [], me: null });
    mockGetProjectMeeting.mockResolvedValue(createMeeting());
    mockGetMeetingRatings.mockResolvedValue({
      my_given: [],
      aggregates: [],
      my_received_comments: [],
    });
  });

  it('renders the upcoming meeting and history with status chips', async () => {
    mockGetProjectMeetings.mockResolvedValue([
      createMeeting({
        id: 'meeting-upcoming',
        title: '下一次讨论会',
        status: 'scheduled',
        scheduled_at: new Date(Date.now() + 3 * DAY_IN_MS).toISOString(),
      }),
      createMeeting({ id: 'meeting-done', title: '第一次例会', status: 'completed' }),
      createMeeting({
        id: 'meeting-cancelled',
        title: '被取消的临时会',
        status: 'cancelled',
        scheduled_at: '2026-07-20T10:00:00.000Z',
      }),
    ]);

    render(
      <ProjectMeetingsSection
        projectId="project-1"
        members={members}
        currentUserId="member-a"
        canManage={false}
      />
    );

    expect(await screen.findByText('下一次讨论会')).toBeTruthy();
    expect(screen.getByText('下次会议')).toBeTruthy();
    expect(screen.getByText('待举行')).toBeTruthy();
    expect(screen.getByText('第一次例会')).toBeTruthy();
    expect(screen.getByText('已完成')).toBeTruthy();
    expect(screen.getByText('被取消的临时会')).toBeTruthy();
    expect(screen.getByText('已取消')).toBeTruthy();
    // 实到成员可对已完成会议发起互评
    expect(screen.getByRole('button', { name: '去互评' })).toBeTruthy();
    // 有未来会议且非组长：不出现督促提示与排期按钮
    expect(screen.queryByText(/尚未安排下次讨论/)).toBeNull();
    expect(screen.queryByRole('button', { name: '安排会议' })).toBeNull();
  });

  it('prompts managers to schedule the next meeting when none is upcoming', async () => {
    mockGetProjectMeetings.mockResolvedValue([
      createMeeting({
        id: 'meeting-past',
        title: '第一次例会',
        status: 'completed',
        scheduled_at: new Date(Date.now() - 10 * DAY_IN_MS - 3_600_000).toISOString(),
      }),
    ]);

    const { unmount } = render(
      <ProjectMeetingsSection
        projectId="project-1"
        members={members}
        currentUserId="owner-1"
        canManage
      />
    );

    expect(await screen.findByText('距上次会议已 10 天，尚未安排下次讨论')).toBeTruthy();
    expect(screen.getByRole('button', { name: '安排会议' })).toBeTruthy();
    unmount();

    render(
      <ProjectMeetingsSection
        projectId="project-1"
        members={members}
        currentUserId="member-a"
        canManage={false}
      />
    );

    expect(await screen.findByText('第一次例会')).toBeTruthy();
    expect(screen.queryByText(/尚未安排下次讨论/)).toBeNull();
    expect(screen.queryByRole('button', { name: '安排会议' })).toBeNull();
  });

  it('prompts managers to schedule the first meeting when none exists', async () => {
    render(
      <ProjectMeetingsSection
        projectId="project-1"
        members={members}
        currentUserId="owner-1"
        canManage
      />
    );

    expect(await screen.findByText('尚未安排第一次讨论')).toBeTruthy();
    expect(screen.getByText('还没有会议')).toBeTruthy();
    expect(screen.getByRole('button', { name: '安排会议' })).toBeTruthy();
  });

  it('renders the top leaderboard entries and my standing', async () => {
    mockGetProjectLeaderboard.mockResolvedValue({
      top: [
        createLeaderboardEntry({ user_id: 'owner-1', username: '组长', rank: 1, composite: 4.8 }),
        createLeaderboardEntry({ user_id: 'member-a', username: '小林', rank: 2, composite: 4.2 }),
        createLeaderboardEntry({ user_id: 'member-b', username: '小周', rank: 3, composite: 3.9 }),
      ],
      me: { rank: 2, composite: 4.2, ai_avg: 4.0, peer_avg: 4.4, rated_meetings: 3 },
    });

    render(
      <ProjectMeetingsSection
        projectId="project-1"
        members={members}
        currentUserId="member-a"
        canManage={false}
      />
    );

    expect(await screen.findByText('表现榜')).toBeTruthy();
    expect(screen.getByText('组长')).toBeTruthy();
    expect(screen.getByText('小林')).toBeTruthy();
    expect(screen.getByText('综合 4.8 / 5')).toBeTruthy();
    expect(screen.getByText('我的名次：第 2 名 · 综合 4.2 / 5')).toBeTruthy();
    // 普通成员没有完整榜单入口
    expect(screen.queryByRole('button', { name: '展开完整榜单' })).toBeNull();
  });

  it('lets managers expand the full leaderboard', async () => {
    mockGetProjectLeaderboard.mockResolvedValue({
      top: [createLeaderboardEntry()],
      me: { rank: 1, composite: 4.8, ai_avg: 4.6, peer_avg: 5, rated_meetings: 3 },
      all: [
        createLeaderboardEntry(),
        createLeaderboardEntry({ user_id: 'member-b', username: '小周', rank: 4, composite: 2.5 }),
      ],
    });

    render(
      <ProjectMeetingsSection
        projectId="project-1"
        members={members}
        currentUserId="owner-1"
        canManage
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: '展开完整榜单' }));

    expect(screen.getByText('完整榜单')).toBeTruthy();
    expect(screen.getByText('小周')).toBeTruthy();
    expect(screen.getByText('综合 2.5 / 5')).toBeTruthy();
  });

  it('shows the empty leaderboard hint when no performance data exists', async () => {
    render(
      <ProjectMeetingsSection
        projectId="project-1"
        members={members}
        currentUserId="member-a"
        canManage={false}
      />
    );

    expect(await screen.findByText(/暂无表现数据/)).toBeTruthy();
  });
});
