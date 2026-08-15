import { beforeEach, describe, expect, it, vi } from 'vitest';

const { databaseSession, withDatabaseTransaction } = vi.hoisted(() => {
  const databaseSession = { id: 'database-session' };
  return {
    databaseSession,
    withDatabaseTransaction: vi.fn(
      async (operation: (session: typeof databaseSession) => Promise<unknown>) => operation(databaseSession)
    ),
  };
});
const meetingsFind = vi.fn();
const meetingsFindOne = vi.fn();
const meetingsInsertOne = vi.fn();
const meetingsUpdateOne = vi.fn();
const meetingsFindOneAndDelete = vi.fn();
const meetingsSort = vi.fn();
const meetingsProject = vi.fn();
const ratingsDeleteMany = vi.fn();
const ratingsFind = vi.fn();
const ratingsFindOne = vi.fn();
const ratingsUpdateOne = vi.fn();
const projectsUpdateOne = vi.fn();

vi.mock('../database/connection.js', () => ({
  withDatabaseTransaction,
  getCollection: (name: string) => {
    switch (name) {
      case 'research_project_meetings':
        return {
          find: (...args: unknown[]) => meetingsFind(...args),
          findOne: (...args: unknown[]) => meetingsFindOne(...args),
          insertOne: (...args: unknown[]) => meetingsInsertOne(...args),
          updateOne: (...args: unknown[]) => meetingsUpdateOne(...args),
          findOneAndDelete: (...args: unknown[]) => meetingsFindOneAndDelete(...args),
        };
      case 'research_meeting_member_ratings':
        return {
          find: (...args: unknown[]) => ratingsFind(...args),
          findOne: (...args: unknown[]) => ratingsFindOne(...args),
          updateOne: (...args: unknown[]) => ratingsUpdateOne(...args),
          deleteMany: (...args: unknown[]) => ratingsDeleteMany(...args),
        };
      case 'research_projects':
        return {
          updateOne: (...args: unknown[]) => projectsUpdateOne(...args),
        };
      default:
        return {
          find: () => ({ toArray: async () => [], project: () => ({ toArray: async () => [] }) }),
          findOne: async () => null,
          updateOne: async () => ({ matchedCount: 0 }),
        };
    }
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
  },
}));

import { computeLeaderboard, ResearchMeetingModel } from './research-meeting.model.js';

describe('ResearchMeetingModel.createMeeting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meetingsInsertOne.mockResolvedValue({});
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('inserts a scheduled meeting with empty archive fields and touches project activity', async () => {
    const scheduledAt = new Date('2026-08-20T09:00:00Z');
    const meetingId = await ResearchMeetingModel.createMeeting('project-1', 'owner-1', {
      title: '第一次例会',
      scheduled_at: scheduledAt,
    });

    expect(meetingsInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      id: meetingId,
      project_id: 'project-1',
      title: '第一次例会',
      scheduled_at: scheduledAt,
      duration_minutes: null,
      location: null,
      agenda: null,
      status: 'scheduled',
      created_by: 'owner-1',
      raw_notes: null,
      raw_file: null,
      attendee_ids: [],
      ai_scores: null,
      minutes: null,
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    }));
    expect(projectsUpdateOne).toHaveBeenCalledWith(
      { id: 'project-1' },
      { $set: { last_activity_at: expect.any(Date) } }
    );
  });
});

describe('ResearchMeetingModel.listProjectMeetings', () => {
  const archivedAt = new Date('2026-08-10T10:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
    meetingsProject.mockReturnValue({
      toArray: async () => [
        {
          _id: 'mongo-meeting-2',
          id: 'meeting-2',
          project_id: 'project-1',
          title: '第二次例会',
          scheduled_at: new Date('2026-08-10T09:00:00Z'),
          duration_minutes: 60,
          location: '线上会议室',
          agenda: '复盘光弹实验',
          status: 'completed',
          created_by: 'owner-1',
          raw_file: {
            url: '/uploads/research/record.txt',
            original_name: '会议记录.txt',
            mime_type: 'text/plain',
            size: 120,
          },
          attendee_ids: ['owner-1', 'member-1'],
          ai_scores: [{ user_id: 'member-1', score: 80, comment: '思路清晰' }],
          minutes: {
            generated_by_ai: true,
            model: 'test-model',
            archived_at: archivedAt,
            archived_by: 'owner-1',
          },
        },
        // 旧文档容忍：缺归档相关字段
        {
          _id: 'mongo-meeting-1',
          id: 'meeting-1',
          project_id: 'project-1',
          title: '第一次例会',
          scheduled_at: new Date('2026-08-03T09:00:00Z'),
          status: 'scheduled',
          created_by: 'owner-1',
          minutes: null,
        },
      ],
    });
    meetingsSort.mockReturnValue({ project: (...args: unknown[]) => meetingsProject(...args) });
    meetingsFind.mockReturnValue({ sort: (...args: unknown[]) => meetingsSort(...args) });
  });

  it('excludes the large text fields but keeps raw-file metadata and a has_minutes flag', async () => {
    const result = await ResearchMeetingModel.listProjectMeetings('project-1');

    expect(meetingsFind).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(meetingsSort).toHaveBeenCalledWith({ scheduled_at: -1 });
    expect(meetingsProject).toHaveBeenCalledWith({ _id: 0, raw_notes: 0, 'minutes.content': 0 });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'meeting-2',
      status: 'completed',
      has_minutes: true,
      minutes: {
        generated_by_ai: true,
        model: 'test-model',
        archived_at: archivedAt,
        archived_by: 'owner-1',
      },
      raw_file: {
        url: '/uploads/research/record.txt',
        original_name: '会议记录.txt',
        mime_type: 'text/plain',
        size: 120,
      },
      ai_scores: [{ user_id: 'member-1', score: 80, comment: '思路清晰' }],
    });
    expect(result[0]).not.toHaveProperty('raw_notes');
    expect(result[1]).toMatchObject({
      id: 'meeting-1',
      has_minutes: false,
      minutes: null,
      duration_minutes: null,
      location: null,
      agenda: null,
      raw_file: null,
      attendee_ids: [],
      ai_scores: null,
    });
  });
});

describe('ResearchMeetingModel.deleteMeeting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ratingsDeleteMany.mockResolvedValue({ deletedCount: 2 });
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('deletes the meeting and ratings with project-scoped filters in one transaction', async () => {
    meetingsFindOneAndDelete.mockResolvedValue({
      raw_file: { url: ' /uploads/meetings/record.docx ' },
    });

    await expect(ResearchMeetingModel.deleteMeeting('project-1', 'meeting-1')).resolves.toEqual({
      rawFileUrl: '/uploads/meetings/record.docx',
    });

    expect(meetingsFindOneAndDelete).toHaveBeenCalledWith(
      { id: 'meeting-1', project_id: 'project-1' },
      { projection: { _id: 0, 'raw_file.url': 1 }, session: databaseSession }
    );
    expect(ratingsDeleteMany).toHaveBeenCalledWith(
      { project_id: 'project-1', meeting_id: 'meeting-1' },
      { session: databaseSession }
    );
    expect(projectsUpdateOne).toHaveBeenCalledWith(
      { id: 'project-1' },
      { $set: { last_activity_at: expect.any(Date) } },
      { session: databaseSession }
    );
  });

  it('returns null without cascading when the meeting is missing from the project', async () => {
    meetingsFindOneAndDelete.mockResolvedValue(null);

    await expect(ResearchMeetingModel.deleteMeeting('project-1', 'meeting-404')).resolves.toBeNull();

    expect(ratingsDeleteMany).not.toHaveBeenCalled();
    expect(projectsUpdateOne).not.toHaveBeenCalled();
  });
});

describe('ResearchMeetingModel.getProjectMeetingRawFileUrls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meetingsFind.mockReturnValue({
      project: () => ({
        toArray: async () => [
          { raw_file: { url: ' /uploads/meetings/one.docx ' } },
          { raw_file: null },
          { raw_file: { url: '' } },
        ],
      }),
    });
  });

  it('collects only non-empty project-scoped meeting raw-file URLs', async () => {
    await expect(ResearchMeetingModel.getProjectMeetingRawFileUrls('project-1')).resolves.toEqual([
      '/uploads/meetings/one.docx',
    ]);
    expect(meetingsFind).toHaveBeenCalledWith({ project_id: 'project-1' });
  });
});

describe('ResearchMeetingModel.archiveMeetingMinutes', () => {
  const archiveInput = {
    content: '## 议题\n光弹实验推进',
    generated_by_ai: true,
    model: 'test-model',
    archived_by: 'owner-1',
    attendee_ids: ['owner-1', 'member-1'],
    raw_notes: '组长：本周完成标定……',
    raw_file: null,
    ai_scores: [{ user_id: 'member-1', score: 88, comment: '发言积极' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('archives via a single conditional update that requires scheduled status', async () => {
    meetingsUpdateOne.mockResolvedValue({ matchedCount: 1 });

    await expect(
      ResearchMeetingModel.archiveMeetingMinutes('project-1', 'meeting-1', archiveInput)
    ).resolves.toBe('archived');

    expect(meetingsUpdateOne).toHaveBeenCalledWith(
      { id: 'meeting-1', project_id: 'project-1', status: 'scheduled' },
      {
        $set: {
          status: 'completed',
          raw_notes: '组长：本周完成标定……',
          raw_file: null,
          attendee_ids: ['owner-1', 'member-1'],
          ai_scores: [{ user_id: 'member-1', score: 88, comment: '发言积极' }],
          minutes: {
            content: '## 议题\n光弹实验推进',
            generated_by_ai: true,
            model: 'test-model',
            archived_at: expect.any(Date),
            archived_by: 'owner-1',
          },
          updated_at: expect.any(Date),
        },
      }
    );
    expect(projectsUpdateOne).toHaveBeenCalled();
  });

  it('returns conflict for an already-archived or cancelled meeting', async () => {
    meetingsUpdateOne.mockResolvedValue({ matchedCount: 0 });
    meetingsFindOne.mockResolvedValue({ _id: 'mongo-meeting', id: 'meeting-1', status: 'completed' });

    await expect(
      ResearchMeetingModel.archiveMeetingMinutes('project-1', 'meeting-1', archiveInput)
    ).resolves.toBe('conflict');

    expect(meetingsFindOne).toHaveBeenCalledWith({ id: 'meeting-1', project_id: 'project-1' });
    expect(projectsUpdateOne).not.toHaveBeenCalled();
  });

  it('returns not_found when the meeting does not exist in the project', async () => {
    meetingsUpdateOne.mockResolvedValue({ matchedCount: 0 });
    meetingsFindOne.mockResolvedValue(null);

    await expect(
      ResearchMeetingModel.archiveMeetingMinutes('project-1', 'meeting-404', archiveInput)
    ).resolves.toBe('not_found');
  });
});

describe('ResearchMeetingModel.upsertMeetingRating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('upserts by the (meeting, rater, ratee) unique key', async () => {
    ratingsUpdateOne.mockResolvedValue({ matchedCount: 0, upsertedCount: 1 });

    const result = await ResearchMeetingModel.upsertMeetingRating(
      'project-1',
      'meeting-1',
      'rater-1',
      'ratee-1',
      { score: 4, comment: '推进有力' }
    );

    expect(ratingsUpdateOne).toHaveBeenCalledWith(
      { meeting_id: 'meeting-1', rater_id: 'rater-1', ratee_id: 'ratee-1' },
      {
        $set: {
          project_id: 'project-1',
          score: 4,
          comment: '推进有力',
          updated_at: expect.any(Date),
        },
        $setOnInsert: {
          id: result.id,
          created_at: expect.any(Date),
        },
      },
      { upsert: true }
    );
    expect(result.created).toBe(true);
    expect(ratingsFindOne).not.toHaveBeenCalled();
  });

  it('keeps the existing document id and defaults comment to null when updating', async () => {
    ratingsUpdateOne.mockResolvedValue({ matchedCount: 1, upsertedCount: 0 });
    ratingsFindOne.mockResolvedValue({
      _id: 'mongo-rating',
      id: 'rating-9',
      meeting_id: 'meeting-1',
      rater_id: 'rater-1',
      ratee_id: 'ratee-1',
      score: 5,
      comment: '推进有力',
    });

    const result = await ResearchMeetingModel.upsertMeetingRating(
      'project-1',
      'meeting-1',
      'rater-1',
      'ratee-1',
      { score: 2 }
    );

    expect(result).toEqual({ id: 'rating-9', created: false });
    expect(ratingsFindOne).toHaveBeenCalledWith({
      meeting_id: 'meeting-1',
      rater_id: 'rater-1',
      ratee_id: 'ratee-1',
    });
    const [, updateArg] = ratingsUpdateOne.mock.calls[0];
    expect(updateArg.$set.comment).toBeNull();
  });
});

describe('computeLeaderboard', () => {
  it('weights AI average (scaled to 5) and peer average 50/50 when both exist', () => {
    const meetings = [
      {
        id: 'meeting-1',
        status: 'completed' as const,
        ai_scores: [{ user_id: 'user-a', score: 80, comment: '推进有力' }],
      },
    ];
    const ratings = [
      { meeting_id: 'meeting-1', rater_id: 'user-b', ratee_id: 'user-a', score: 5 },
      { meeting_id: 'meeting-1', rater_id: 'user-c', ratee_id: 'user-a', score: 4 },
    ];

    expect(computeLeaderboard(meetings, ratings, ['user-a', 'user-b', 'user-c'])).toEqual([
      // ai 80/20 = 4，peer (5+4)/2 = 4.5，综合 (4+4.5)/2 = 4.25；b、c 无数据不入榜
      { user_id: 'user-a', rank: 1, composite: 4.25, ai_avg: 4, peer_avg: 4.5, rated_meetings: 1 },
    ]);
  });

  it('gives the single available source full weight', () => {
    const meetings = [
      {
        id: 'meeting-1',
        status: 'completed' as const,
        ai_scores: [{ user_id: 'user-b', score: 90, comment: '数据扎实' }],
      },
    ];
    const ratings = [{ meeting_id: 'meeting-1', rater_id: 'user-b', ratee_id: 'user-a', score: 3 }];

    expect(computeLeaderboard(meetings, ratings, ['user-a', 'user-b'])).toEqual([
      { user_id: 'user-b', rank: 1, composite: 4.5, ai_avg: 4.5, peer_avg: null, rated_meetings: 1 },
      { user_id: 'user-a', rank: 2, composite: 3, ai_avg: null, peer_avg: 3, rated_meetings: 1 },
    ]);
  });

  it('averages AI scores across completed meetings and counts rated meetings', () => {
    const meetings = [
      {
        id: 'meeting-1',
        status: 'completed' as const,
        ai_scores: [{ user_id: 'user-a', score: 80, comment: '' }],
      },
      {
        id: 'meeting-2',
        status: 'completed' as const,
        ai_scores: [{ user_id: 'user-a', score: 90, comment: '' }],
      },
    ];

    expect(computeLeaderboard(meetings, [], ['user-a'])).toEqual([
      { user_id: 'user-a', rank: 1, composite: 4.25, ai_avg: 4.25, peer_avg: null, rated_meetings: 2 },
    ]);
  });

  it('shares the rank between tied composites and skips the following rank', () => {
    const ratings = [
      { meeting_id: 'meeting-1', rater_id: 'user-c', ratee_id: 'user-a', score: 5 },
      { meeting_id: 'meeting-1', rater_id: 'user-a', ratee_id: 'user-b', score: 5 },
      { meeting_id: 'meeting-1', rater_id: 'user-a', ratee_id: 'user-c', score: 4 },
    ];

    const entries = computeLeaderboard([], ratings, ['user-a', 'user-b', 'user-c']);

    expect(entries.map((entry) => ({ user_id: entry.user_id, rank: entry.rank }))).toEqual([
      { user_id: 'user-a', rank: 1 },
      { user_id: 'user-b', rank: 1 },
      { user_id: 'user-c', rank: 3 },
    ]);
  });

  it('returns an empty leaderboard when there is no rating data', () => {
    expect(computeLeaderboard([], [], [])).toEqual([]);
    expect(computeLeaderboard([], [], ['user-a'])).toEqual([]);
  });

  it('ignores non-completed meetings, non-member ratees and self ratings', () => {
    const meetings = [
      {
        id: 'meeting-1',
        status: 'scheduled' as const,
        ai_scores: [{ user_id: 'user-a', score: 100, comment: '' }],
      },
      {
        id: 'meeting-2',
        status: 'completed' as const,
        ai_scores: [{ user_id: 'former-member', score: 100, comment: '' }],
      },
    ];
    const ratings = [
      { meeting_id: 'meeting-2', rater_id: 'user-a', ratee_id: 'former-member', score: 5 },
      { meeting_id: 'meeting-2', rater_id: 'user-a', ratee_id: 'user-a', score: 5 },
    ];

    expect(computeLeaderboard(meetings, ratings, ['user-a'])).toEqual([]);
  });
});
