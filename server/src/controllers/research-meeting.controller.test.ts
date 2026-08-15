import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockResearchMeetingModel,
  mockComputeLeaderboard,
  mockResearchModel,
  mockNotificationModel,
  mockProjectAccessService,
  mockResearchAgentService,
  mockGenerateMeetingMinutes,
  mockGetUserIdentityMap,
  mockManagedUploadCleanupService,
} = vi.hoisted(() => ({
  mockResearchMeetingModel: {
    createMeeting: vi.fn(),
    getMeetingById: vi.fn(),
    listProjectMeetings: vi.fn(),
    deleteMeeting: vi.fn(),
    updateMeeting: vi.fn(),
    archiveMeetingMinutes: vi.fn(),
    upsertMeetingRating: vi.fn(),
    getMeetingRatings: vi.fn(),
    getProjectRatings: vi.fn(),
  },
  mockComputeLeaderboard: vi.fn(),
  mockResearchModel: {
    getActiveProjectMemberUserIds: vi.fn(),
    logActivity: vi.fn(),
  },
  mockNotificationModel: {
    createNotification: vi.fn(),
    createNotificationForUsers: vi.fn(),
    deleteNotification: vi.fn(),
  },
  mockProjectAccessService: {
    getProjectAccess: vi.fn(),
    // The level → capability mapping is policy the controller relies on, so the
    // real implementation is kept here rather than stubbed.
    hasPermission: vi.fn((access: any, level: string) => ({
      read: access.canRead,
      write: access.canWrite,
      manage: access.canManage,
      discussion: access.canAccessDiscussion,
    }[level])),
    initializeProjectSettings: vi.fn(),
    setProjectVisibility: vi.fn(),
    applyProjectSettings: vi.fn(),
  },
  mockResearchAgentService: {
    isEnabled: vi.fn(),
    createChatCompletion: vi.fn(),
  },
  mockGenerateMeetingMinutes: vi.fn(),
  mockGetUserIdentityMap: vi.fn(),
  mockManagedUploadCleanupService: {
    cleanupUrls: vi.fn(),
  },
}));

vi.mock('../models/research-meeting.model.js', () => ({
  ResearchMeetingModel: mockResearchMeetingModel,
  computeLeaderboard: mockComputeLeaderboard,
}));

vi.mock('../models/research.model.js', () => ({
  ResearchModel: mockResearchModel,
}));

vi.mock('../models/notification.model.js', () => ({
  NotificationModel: mockNotificationModel,
}));

vi.mock('../models/profile.model.js', () => ({
  ProfileModel: {},
}));

vi.mock('../models/user-identity.util.js', () => ({
  getUserIdentityMap: mockGetUserIdentityMap,
}));

vi.mock('../services/managed-upload-cleanup.service.js', () => ({
  ManagedUploadCleanupService: mockManagedUploadCleanupService,
}));

vi.mock('../services/project-access.service.js', () => ({
  ProjectAccessService: mockProjectAccessService,
}));

vi.mock('../services/research-agent.service.js', () => ({
  RESEARCH_AGENT_SYSTEM_PROMPT: 'advisor system prompt',
  ResearchAgentDisabledError: class ResearchAgentDisabledError extends Error {
    statusCode = 503;
    code = 'AI_ADVISOR_DISABLED';

    constructor() {
      super('AI 顾问尚未配置');
    }
  },
  ResearchAgentUpstreamError: class ResearchAgentUpstreamError extends Error {
    statusCode = 502;
    code = 'AI_PROVIDER_ERROR';

    constructor() {
      super('AI 顾问暂时不可用，请稍后重试');
    }
  },
  ResearchAgentService: mockResearchAgentService,
}));

vi.mock('../services/meeting-ai.service.js', () => ({
  generateMeetingMinutes: mockGenerateMeetingMinutes,
}));

import { ResearchAgentUpstreamError } from '../services/research-agent.service.js';
import { ResearchMeetingController } from './research-meeting.controller.js';

function createResponse() {
  return {
    success: vi.fn(),
    error: vi.fn(),
  };
}

async function invokeHandler(
  handler: (req: any, res: any, next: (error?: unknown) => void) => void,
  req: any,
  res: ReturnType<typeof createResponse>
) {
  const next = vi.fn();
  handler(req, res, next);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(next).not.toHaveBeenCalled();
}

function buildAccess(overrides: Record<string, unknown> = {}) {
  return {
    project: { id: 'project-1', name_zh: '偏振课题' },
    membership: { user_id: 'member-1', role: 'member' },
    role: 'member',
    ownerUserId: 'owner-1',
    ownerStateValid: true,
    isAdmin: false,
    isMember: true,
    canRead: true,
    canWrite: true,
    canManage: false,
    canAccessDiscussion: true,
    canModerate: false,
    ...overrides,
  };
}

function buildOwnerAccess(overrides: Record<string, unknown> = {}) {
  return buildAccess({
    membership: { user_id: 'owner-1', role: 'owner' },
    role: 'owner',
    canManage: true,
    canModerate: true,
    ...overrides,
  });
}

function createMeeting(overrides: Record<string, unknown> = {}) {
  return {
    id: 'meeting-1',
    project_id: 'project-1',
    title: '第三次讨论会',
    scheduled_at: new Date('2026-08-20T11:00:00Z'),
    duration_minutes: 60,
    location: '线下教室 302',
    agenda: null,
    status: 'scheduled',
    created_by: 'owner-1',
    raw_notes: null,
    raw_file: null,
    attendee_ids: [],
    ai_scores: null,
    minutes: null,
    created_at: new Date('2026-08-10T02:00:00Z'),
    updated_at: new Date('2026-08-10T02:00:00Z'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResearchModel.getActiveProjectMemberUserIds.mockResolvedValue([
    'owner-1',
    'member-1',
    'member-2',
  ]);
  mockResearchModel.logActivity.mockResolvedValue('activity-1');
  mockNotificationModel.createNotificationForUsers.mockResolvedValue(undefined);
  mockManagedUploadCleanupService.cleanupUrls.mockResolvedValue(undefined);
  mockGetUserIdentityMap.mockResolvedValue(new Map());
  mockResearchAgentService.isEnabled.mockReturnValue(true);
});

describe('ResearchMeetingController access control', () => {
  it('rejects the meeting list for authenticated non-members', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildAccess({
      membership: null,
      role: null,
      isMember: false,
      canWrite: false,
      canManage: false,
      canAccessDiscussion: false,
    }));

    const req = { params: { projectId: 'project-1' }, user: { sub: 'outsider-1', username: 'out', role: 'user' } };
    const res = createResponse();

    await invokeHandler(ResearchMeetingController.getProjectMeetings, req, res);

    expect(res.error).toHaveBeenCalledWith('只有课题成员可以查看会议', 'FORBIDDEN', 403);
    expect(mockResearchMeetingModel.listProjectMeetings).not.toHaveBeenCalled();
  });

  it('rejects meeting creation for members without manage permission', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildAccess());

    const req = {
      params: { projectId: 'project-1' },
      body: { title: '第三次讨论会', scheduled_at: '2026-08-20T19:00' },
      user: { sub: 'member-1', username: 'alice', role: 'user' },
    };
    const res = createResponse();

    await invokeHandler(ResearchMeetingController.createProjectMeeting, req, res);

    expect(res.error).toHaveBeenCalledWith('只有组长可以安排会议', 'FORBIDDEN', 403);
    expect(mockResearchMeetingModel.createMeeting).not.toHaveBeenCalled();
  });
});

describe('ResearchMeetingController meeting deletion', () => {
  function buildDeleteRequest(user: { sub: string; username: string; role: 'user' | 'admin' }) {
    return {
      params: { projectId: 'project-1', meetingId: 'meeting-1' },
      user,
    };
  }

  it('rejects ordinary members without touching meeting data', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildAccess());

    const res = createResponse();
    await invokeHandler(
      ResearchMeetingController.deleteProjectMeeting,
      buildDeleteRequest({ sub: 'member-1', username: 'alice', role: 'user' }),
      res
    );

    expect(res.error).toHaveBeenCalledWith('只有管理员或组长可以删除会议', 'FORBIDDEN', 403);
    expect(mockResearchMeetingModel.deleteMeeting).not.toHaveBeenCalled();
    expect(mockManagedUploadCleanupService.cleanupUrls).not.toHaveBeenCalled();
  });

  it('rejects non-members with the same server-side boundary', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildAccess({
      membership: null,
      role: null,
      isMember: false,
      canWrite: false,
      canManage: false,
      canAccessDiscussion: false,
    }));

    const res = createResponse();
    await invokeHandler(
      ResearchMeetingController.deleteProjectMeeting,
      buildDeleteRequest({ sub: 'outsider-1', username: 'out', role: 'user' }),
      res
    );

    expect(res.error).toHaveBeenCalledWith('只有管理员或组长可以删除会议', 'FORBIDDEN', 403);
    expect(mockResearchMeetingModel.deleteMeeting).not.toHaveBeenCalled();
  });

  it('allows the authoritative owner and cleans the returned raw file after deletion', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildOwnerAccess());
    mockResearchMeetingModel.deleteMeeting.mockResolvedValue({
      rawFileUrl: '/uploads/meetings/meeting-1.docx',
    });

    const res = createResponse();
    await invokeHandler(
      ResearchMeetingController.deleteProjectMeeting,
      buildDeleteRequest({ sub: 'owner-1', username: 'boss', role: 'user' }),
      res
    );

    expect(mockResearchMeetingModel.deleteMeeting).toHaveBeenCalledWith('project-1', 'meeting-1');
    expect(mockManagedUploadCleanupService.cleanupUrls).toHaveBeenCalledWith(
      ['/uploads/meetings/meeting-1.docx'],
      { reason: 'research.project-meeting.delete:meeting-1' }
    );
    expect(mockResearchModel.logActivity).not.toHaveBeenCalled();
    expect(mockNotificationModel.createNotificationForUsers).not.toHaveBeenCalled();
    expect(res.success).toHaveBeenCalledWith(null, '会议已删除');
  });

  it('allows a global admin when legacy owner state is malformed', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildAccess({
      ownerStateValid: false,
      isAdmin: true,
      membership: null,
      isMember: false,
      canManage: false,
    }));
    mockResearchMeetingModel.deleteMeeting.mockResolvedValue({ rawFileUrl: null });

    const res = createResponse();
    await invokeHandler(
      ResearchMeetingController.deleteProjectMeeting,
      buildDeleteRequest({ sub: 'admin-1', username: 'admin', role: 'admin' }),
      res
    );

    expect(mockResearchMeetingModel.deleteMeeting).toHaveBeenCalledWith('project-1', 'meeting-1');
    expect(res.success).toHaveBeenCalledWith(null, '会议已删除');
  });

  it('returns not found without cleanup when the meeting is absent or from another project', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildOwnerAccess());
    mockResearchMeetingModel.deleteMeeting.mockResolvedValue(null);

    const res = createResponse();
    await invokeHandler(
      ResearchMeetingController.deleteProjectMeeting,
      buildDeleteRequest({ sub: 'owner-1', username: 'boss', role: 'user' }),
      res
    );

    expect(res.error).toHaveBeenCalledWith('会议未找到', 'MEETING_NOT_FOUND', 404);
    expect(mockManagedUploadCleanupService.cleanupUrls).not.toHaveBeenCalled();
  });

  it('keeps delete success when post-commit cleanup fails', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildOwnerAccess());
    mockResearchMeetingModel.deleteMeeting.mockResolvedValue({
      rawFileUrl: '/uploads/meetings/meeting-1.docx',
    });
    mockManagedUploadCleanupService.cleanupUrls.mockRejectedValue(new Error('disk unavailable'));

    const res = createResponse();
    await invokeHandler(
      ResearchMeetingController.deleteProjectMeeting,
      buildDeleteRequest({ sub: 'owner-1', username: 'boss', role: 'user' }),
      res
    );

    expect(res.success).toHaveBeenCalledWith(null, '会议已删除');
  });
});

describe('ResearchMeetingController AI score visibility', () => {
  const scoreEntries = [
    { user_id: 'member-1', score: 88, comment: '发言积极' },
    { user_id: 'member-2', score: 75, comment: '有贡献' },
  ];

  it('filters ai_scores down to the viewer for regular members', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildAccess());
    mockResearchMeetingModel.listProjectMeetings.mockResolvedValue([
      createMeeting({ status: 'completed', ai_scores: scoreEntries, has_minutes: true }),
    ]);

    const req = { params: { projectId: 'project-1' }, user: { sub: 'member-1', username: 'alice', role: 'user' } };
    const res = createResponse();

    await invokeHandler(ResearchMeetingController.getProjectMeetings, req, res);

    expect(res.success).toHaveBeenCalledTimes(1);
    const [meetings] = res.success.mock.calls[0];
    expect(meetings[0].ai_scores).toEqual([{ user_id: 'member-1', score: 88, comment: '发言积极' }]);
  });

  it('keeps all ai_scores for the owner', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildOwnerAccess());
    mockResearchMeetingModel.listProjectMeetings.mockResolvedValue([
      createMeeting({ status: 'completed', ai_scores: scoreEntries, has_minutes: true }),
    ]);

    const req = { params: { projectId: 'project-1' }, user: { sub: 'owner-1', username: 'boss', role: 'user' } };
    const res = createResponse();

    await invokeHandler(ResearchMeetingController.getProjectMeetings, req, res);

    const [meetings] = res.success.mock.calls[0];
    expect(meetings[0].ai_scores).toEqual(scoreEntries);
  });
});

describe('ResearchMeetingController minutes generation', () => {
  function buildGenerateRequest(body: Record<string, unknown> = {}) {
    return {
      params: { projectId: 'project-1', meetingId: 'meeting-1' },
      body: { raw_notes: '大家讨论了偏振实验方案。', attendee_ids: ['member-1'], ...body },
      user: { sub: 'owner-1', username: 'boss', role: 'user' },
    };
  }

  beforeEach(() => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildOwnerAccess());
    mockResearchMeetingModel.getMeetingById.mockResolvedValue(createMeeting());
  });

  it('returns 503 when the AI advisor is unconfigured', async () => {
    mockResearchAgentService.isEnabled.mockReturnValue(false);

    const res = createResponse();
    await invokeHandler(ResearchMeetingController.generateMeetingMinutesPreview, buildGenerateRequest(), res);

    expect(res.error).toHaveBeenCalledWith('AI 顾问尚未配置', 'AI_ADVISOR_DISABLED', 503);
    expect(mockGenerateMeetingMinutes).not.toHaveBeenCalled();
  });

  it('rejects attendees outside the active member list', async () => {
    const res = createResponse();
    await invokeHandler(
      ResearchMeetingController.generateMeetingMinutesPreview,
      buildGenerateRequest({ attendee_ids: ['ghost-1'] }),
      res
    );

    expect(res.error).toHaveBeenCalledWith(
      '实到成员名单无效（须为课题活跃成员且不重复）',
      'VALIDATION_ERROR',
      400
    );
    expect(mockGenerateMeetingMinutes).not.toHaveBeenCalled();
  });

  it('passes identity-mapped attendees and returns the preview payload', async () => {
    mockGetUserIdentityMap.mockResolvedValue(new Map([
      ['member-1', { username: 'alice', nickname: null, real_name: null, show_real_name_publicly: false, avatar_url: null }],
    ]));
    mockGenerateMeetingMinutes.mockResolvedValue({
      minutes: '# 会议纪要',
      scores: [{ user_id: 'member-1', score: 90, comment: '推进了实验设计' }],
      model: 'gpt-test',
    });

    const res = createResponse();
    await invokeHandler(ResearchMeetingController.generateMeetingMinutesPreview, buildGenerateRequest(), res);

    expect(mockGenerateMeetingMinutes).toHaveBeenCalledWith(
      '大家讨论了偏振实验方案。',
      [{ id: 'member-1', name: 'alice' }]
    );
    expect(res.success).toHaveBeenCalledWith(
      {
        minutes_content: '# 会议纪要',
        ai_scores: [{ user_id: 'member-1', score: 90, comment: '推进了实验设计' }],
      },
      'AI 纪要已生成'
    );
  });

  it('maps upstream AI errors onto their own status code', async () => {
    const upstreamError = new ResearchAgentUpstreamError();
    upstreamError.message = 'AI 返回内容无法解析，请重试或改用手动纪要';
    mockGenerateMeetingMinutes.mockRejectedValue(upstreamError);

    const res = createResponse();
    await invokeHandler(ResearchMeetingController.generateMeetingMinutesPreview, buildGenerateRequest(), res);

    expect(res.error).toHaveBeenCalledWith(
      'AI 返回内容无法解析，请重试或改用手动纪要',
      'AI_PROVIDER_ERROR',
      502
    );
  });
});

describe('ResearchMeetingController minutes archiving', () => {
  function buildArchiveRequest(body: Record<string, unknown> = {}) {
    return {
      params: { projectId: 'project-1', meetingId: 'meeting-1' },
      body: {
        content: '## 议题\n偏振实验推进',
        attendee_ids: ['owner-1', 'member-1'],
        generated_by_ai: true,
        raw_notes: '原始讨论记录全文',
        ai_scores: [{ user_id: 'member-1', score: 90, comment: '推进了实验设计' }],
        ...body,
      },
      user: { sub: 'owner-1', username: 'boss', role: 'user' },
    };
  }

  beforeEach(() => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildOwnerAccess());
    mockResearchMeetingModel.getMeetingById.mockResolvedValue(createMeeting());
    mockResearchMeetingModel.archiveMeetingMinutes.mockResolvedValue('archived');
  });

  it('requires a raw record (pasted text or uploaded file)', async () => {
    const res = createResponse();
    await invokeHandler(
      ResearchMeetingController.archiveMeetingMinutes,
      buildArchiveRequest({ raw_notes: undefined, raw_file: undefined }),
      res
    );

    expect(res.error).toHaveBeenCalledWith(
      '请提供会议原始记录（粘贴文字或上传记录文件）',
      'VALIDATION_ERROR',
      400
    );
    expect(mockResearchMeetingModel.archiveMeetingMinutes).not.toHaveBeenCalled();
  });

  it('rejects raw_file urls outside the managed upload tree', async () => {
    const res = createResponse();
    await invokeHandler(
      ResearchMeetingController.archiveMeetingMinutes,
      buildArchiveRequest({ raw_file: { url: 'https://evil.example/notes.pdf' } }),
      res
    );

    expect(res.error).toHaveBeenCalledWith('会议记录文件地址无效', 'VALIDATION_ERROR', 400);
    expect(mockResearchMeetingModel.archiveMeetingMinutes).not.toHaveBeenCalled();
  });

  it('returns 409 when the meeting is already archived', async () => {
    mockResearchMeetingModel.archiveMeetingMinutes.mockResolvedValue('conflict');

    const res = createResponse();
    await invokeHandler(ResearchMeetingController.archiveMeetingMinutes, buildArchiveRequest(), res);

    expect(res.error).toHaveBeenCalledWith('该会议已归档或已取消', 'MEETING_ALREADY_ARCHIVED', 409);
    expect(mockResearchModel.logActivity).not.toHaveBeenCalled();
    expect(mockNotificationModel.createNotificationForUsers).not.toHaveBeenCalled();
  });

  it('archives the raw record and fans out notifications excluding the actor', async () => {
    const res = createResponse();
    await invokeHandler(ResearchMeetingController.archiveMeetingMinutes, buildArchiveRequest(), res);

    expect(mockResearchMeetingModel.archiveMeetingMinutes).toHaveBeenCalledWith(
      'project-1',
      'meeting-1',
      expect.objectContaining({
        content: '## 议题\n偏振实验推进',
        generated_by_ai: true,
        model: null,
        archived_by: 'owner-1',
        attendee_ids: ['owner-1', 'member-1'],
        raw_notes: '原始讨论记录全文',
        raw_file: null,
        ai_scores: [{ user_id: 'member-1', score: 90, comment: '推进了实验设计' }],
      })
    );
    expect(mockResearchModel.logActivity).toHaveBeenCalledWith(
      'project-1',
      'owner-1',
      'meeting_minutes_archived',
      'project_meeting',
      'meeting-1',
      { title: '第三次讨论会' }
    );
    expect(mockNotificationModel.createNotificationForUsers).toHaveBeenCalledWith(
      ['member-1', 'member-2'],
      expect.objectContaining({
        type: 'system',
        title: '会议纪要已归档，快去互评',
        action_url: '/lab/projects/project-1#project-meetings',
        data: { project_id: 'project-1', meeting_id: 'meeting-1' },
      })
    );
    expect(res.success).toHaveBeenCalledWith(null, '会议纪要已归档');
  });
});

describe('ResearchMeetingController member ratings', () => {
  function buildRatingRequest(body: Record<string, unknown> = {}) {
    return {
      params: { projectId: 'project-1', meetingId: 'meeting-1' },
      body: { ratee_id: 'member-2', score: 4, comment: '合作顺畅', ...body },
      user: { sub: 'member-1', username: 'alice', role: 'user' },
    };
  }

  beforeEach(() => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildAccess());
    mockResearchMeetingModel.getMeetingById.mockResolvedValue(createMeeting({
      status: 'completed',
      attendee_ids: ['member-1', 'member-2'],
    }));
    mockResearchMeetingModel.upsertMeetingRating.mockResolvedValue({ id: 'rating-1', created: true });
  });

  it('rejects rating yourself', async () => {
    const res = createResponse();
    await invokeHandler(
      ResearchMeetingController.upsertMyMeetingRating,
      buildRatingRequest({ ratee_id: 'member-1' }),
      res
    );

    expect(res.error).toHaveBeenCalledWith('不能评价自己', 'VALIDATION_ERROR', 400);
    expect(mockResearchMeetingModel.upsertMeetingRating).not.toHaveBeenCalled();
  });

  it('rejects rating before the minutes are archived', async () => {
    mockResearchMeetingModel.getMeetingById.mockResolvedValue(createMeeting({
      status: 'scheduled',
      attendee_ids: [],
    }));

    const res = createResponse();
    await invokeHandler(ResearchMeetingController.upsertMyMeetingRating, buildRatingRequest(), res);

    expect(res.error).toHaveBeenCalledWith('会议纪要归档后才能互评', 'MEETING_NOT_COMPLETED', 409);
    expect(mockResearchMeetingModel.upsertMeetingRating).not.toHaveBeenCalled();
  });

  it('rejects raters who were not attendees', async () => {
    mockResearchMeetingModel.getMeetingById.mockResolvedValue(createMeeting({
      status: 'completed',
      attendee_ids: ['member-2', 'member-3'],
    }));

    const res = createResponse();
    await invokeHandler(ResearchMeetingController.upsertMyMeetingRating, buildRatingRequest(), res);

    expect(res.error).toHaveBeenCalledWith('只有该会议的实到成员可以互评', 'FORBIDDEN', 403);
    expect(mockResearchMeetingModel.upsertMeetingRating).not.toHaveBeenCalled();
  });

  it('rejects ratees who were not attendees', async () => {
    mockResearchMeetingModel.getMeetingById.mockResolvedValue(createMeeting({
      status: 'completed',
      attendee_ids: ['member-1', 'member-3'],
    }));

    const res = createResponse();
    await invokeHandler(ResearchMeetingController.upsertMyMeetingRating, buildRatingRequest(), res);

    expect(res.error).toHaveBeenCalledWith('只能评价该会议的实到成员', 'FORBIDDEN', 403);
    expect(mockResearchMeetingModel.upsertMeetingRating).not.toHaveBeenCalled();
  });

  it('upserts a valid rating without notifying anyone', async () => {
    const res = createResponse();
    await invokeHandler(ResearchMeetingController.upsertMyMeetingRating, buildRatingRequest(), res);

    expect(mockResearchMeetingModel.upsertMeetingRating).toHaveBeenCalledWith(
      'project-1',
      'meeting-1',
      'member-1',
      'member-2',
      { score: 4, comment: '合作顺畅' }
    );
    // 互评匿名：不产生通知与活动日志。
    expect(mockNotificationModel.createNotificationForUsers).not.toHaveBeenCalled();
    expect(mockResearchModel.logActivity).not.toHaveBeenCalled();
    expect(res.success).toHaveBeenCalledWith(null, '互评已提交', 201);
  });

  it('returns own rows, anonymous aggregates, and own received comments', async () => {
    mockResearchMeetingModel.getMeetingRatings.mockResolvedValue([
      { id: 'r1', project_id: 'project-1', meeting_id: 'meeting-1', rater_id: 'member-2', ratee_id: 'member-1', score: 5, comment: '思路清晰' },
      { id: 'r2', project_id: 'project-1', meeting_id: 'meeting-1', rater_id: 'owner-1', ratee_id: 'member-1', score: 4, comment: null },
      { id: 'r3', project_id: 'project-1', meeting_id: 'meeting-1', rater_id: 'member-1', ratee_id: 'member-2', score: 3, comment: '继续加油' },
    ]);

    const req = {
      params: { projectId: 'project-1', meetingId: 'meeting-1' },
      user: { sub: 'member-1', username: 'alice', role: 'user' },
    };
    const res = createResponse();

    await invokeHandler(ResearchMeetingController.getMeetingRatings, req, res);

    expect(res.success).toHaveBeenCalledWith({
      my_given: [expect.objectContaining({ id: 'r3', ratee_id: 'member-2' })],
      aggregates: [
        { ratee_id: 'member-1', avg: 4.5, count: 2 },
        { ratee_id: 'member-2', avg: 3, count: 1 },
      ],
      my_received_comments: ['思路清晰'],
    });
  });
});

describe('ResearchMeetingController leaderboard', () => {
  const standings = [
    { user_id: 'member-2', rank: 1, composite: 4.6, ai_avg: 4.4, peer_avg: 4.8, rated_meetings: 3 },
    { user_id: 'owner-1', rank: 2, composite: 4.2, ai_avg: 4.2, peer_avg: null, rated_meetings: 2 },
    { user_id: 'member-1', rank: 3, composite: 3.9, ai_avg: null, peer_avg: 3.9, rated_meetings: 2 },
    { user_id: 'member-3', rank: 4, composite: 3.1, ai_avg: 3.1, peer_avg: null, rated_meetings: 1 },
  ];

  beforeEach(() => {
    mockResearchMeetingModel.listProjectMeetings.mockResolvedValue([]);
    mockResearchMeetingModel.getProjectRatings.mockResolvedValue([]);
    mockComputeLeaderboard.mockReturnValue(standings);
    mockGetUserIdentityMap.mockResolvedValue(new Map([
      ['member-2', { username: 'bob', nickname: '小波', real_name: null, show_real_name_publicly: false, avatar_url: null }],
    ]));
  });

  it('returns Top 3 plus own standing without the full list for members', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildAccess());

    const req = { params: { projectId: 'project-1' }, user: { sub: 'member-1', username: 'alice', role: 'user' } };
    const res = createResponse();

    await invokeHandler(ResearchMeetingController.getProjectLeaderboard, req, res);

    expect(res.success).toHaveBeenCalledTimes(1);
    const [payload] = res.success.mock.calls[0];
    expect(payload.top).toHaveLength(3);
    expect(payload.top[0]).toEqual(expect.objectContaining({ user_id: 'member-2', rank: 1, username: 'bob', nickname: '小波' }));
    expect(payload.me).toEqual({ rank: 3, composite: 3.9, ai_avg: null, peer_avg: 3.9, rated_meetings: 2 });
    expect(payload.all).toBeUndefined();
  });

  it('includes the full list for the owner', async () => {
    mockProjectAccessService.getProjectAccess.mockResolvedValue(buildOwnerAccess());

    const req = { params: { projectId: 'project-1' }, user: { sub: 'owner-1', username: 'boss', role: 'user' } };
    const res = createResponse();

    await invokeHandler(ResearchMeetingController.getProjectLeaderboard, req, res);

    const [payload] = res.success.mock.calls[0];
    expect(payload.all).toHaveLength(4);
    expect(payload.me).toEqual({ rank: 2, composite: 4.2, ai_avg: 4.2, peer_avg: null, rated_meetings: 2 });
  });
});
