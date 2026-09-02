import { beforeEach, describe, expect, it, vi } from 'vitest';

const { allocateProjectIssueNumber, databaseSession, withDatabaseTransaction } = vi.hoisted(() => {
  const databaseSession = { id: 'database-session' };
  return {
    allocateProjectIssueNumber: vi.fn(),
    databaseSession,
    withDatabaseTransaction: vi.fn(
      async (operation: (session: typeof databaseSession) => Promise<unknown>) => operation(databaseSession)
    ),
  };
});

const membersFind = vi.fn();
const membersFindOne = vi.fn();
const membersInsertOne = vi.fn();
const membersUpdateOne = vi.fn();
const membersUpdateMany = vi.fn();
const membersDeleteMany = vi.fn();
const membersCountDocuments = vi.fn();
const projectsFindOne = vi.fn();
const projectsUpdateOne = vi.fn();
const projectsFindOneAndUpdate = vi.fn();
const projectsInsertOne = vi.fn();
const projectsDeleteOne = vi.fn();
const canvasesFind = vi.fn();
const canvasesDeleteMany = vi.fn();
const canvasesCountDocuments = vi.fn();
const canvasesInsertOne = vi.fn();
const nodesFind = vi.fn();
const nodesAggregate = vi.fn();
const nodesDeleteMany = vi.fn();
const edgesAggregate = vi.fn();
const edgesDeleteMany = vi.fn();
const commentsDeleteMany = vi.fn();
const projectCommentsDeleteMany = vi.fn();
const projectCommentsInsertOne = vi.fn();
const agentMessagesDeleteMany = vi.fn();
const activityDeleteMany = vi.fn();
const projectSettingsDeleteMany = vi.fn();
const projectSettingsFindOne = vi.fn();
const applicationsFind = vi.fn();
const applicationsDeleteMany = vi.fn();
const projectCommentsFind = vi.fn();
const activityFind = vi.fn();
const activityInsertOne = vi.fn();
const creatorProfilesFind = vi.fn();
const creatorProfilesDeleteMany = vi.fn();
const evidenceFind = vi.fn();
const evidenceFindOne = vi.fn();
const evidenceInsertOne = vi.fn();
const evidenceUpdateOne = vi.fn();
const evidenceDeleteOne = vi.fn();
const evidenceDeleteMany = vi.fn();
const evidenceBulkWrite = vi.fn();
const usersFind = vi.fn();
const cycleDeleteMany = vi.fn();
const charterDeleteMany = vi.fn();
const taskDeleteMany = vi.fn();
const reviewDeleteMany = vi.fn();
const outcomeDeleteMany = vi.fn();
const cycleInsertOne = vi.fn();
const projectMeetingsDeleteMany = vi.fn();
const meetingRatingsDeleteMany = vi.fn();

vi.mock('../database/connection.js', () => ({
  withDatabaseTransaction,
  getCollection: (name: string) => {
    switch (name) {
      case 'research_project_members':
        return {
          find: (...args: unknown[]) => membersFind(...args),
          findOne: (...args: unknown[]) => membersFindOne(...args),
          insertOne: (...args: unknown[]) => membersInsertOne(...args),
          updateOne: (...args: unknown[]) => membersUpdateOne(...args),
          updateMany: (...args: unknown[]) => membersUpdateMany(...args),
          deleteMany: (...args: unknown[]) => membersDeleteMany(...args),
          countDocuments: (...args: unknown[]) => membersCountDocuments(...args),
        };
      case 'research_projects':
        return {
          findOne: (...args: unknown[]) => projectsFindOne(...args),
          updateOne: (...args: unknown[]) => projectsUpdateOne(...args),
          findOneAndUpdate: (...args: unknown[]) => projectsFindOneAndUpdate(...args),
          insertOne: (...args: unknown[]) => projectsInsertOne(...args),
          deleteOne: (...args: unknown[]) => projectsDeleteOne(...args),
          find: () => ({ sort: () => ({ toArray: async () => [] }) }),
        };
      case 'research_canvases':
        return {
          find: (...args: unknown[]) => canvasesFind(...args),
          deleteMany: (...args: unknown[]) => canvasesDeleteMany(...args),
          countDocuments: (...args: unknown[]) => canvasesCountDocuments(...args),
          insertOne: (...args: unknown[]) => canvasesInsertOne(...args),
        };
      case 'research_nodes':
        return {
          find: (...args: unknown[]) => nodesFind(...args),
          aggregate: (...args: unknown[]) => nodesAggregate(...args),
          deleteMany: (...args: unknown[]) => nodesDeleteMany(...args),
        };
      case 'research_edges':
        return {
          aggregate: (...args: unknown[]) => edgesAggregate(...args),
          deleteMany: (...args: unknown[]) => edgesDeleteMany(...args),
        };
      case 'research_node_comments':
        return {
          deleteMany: (...args: unknown[]) => commentsDeleteMany(...args),
        };
      case 'research_project_settings':
        return {
          findOne: (...args: unknown[]) => projectSettingsFindOne(...args),
          deleteMany: (...args: unknown[]) => projectSettingsDeleteMany(...args),
        };
      case 'research_project_applications':
        return {
          find: (...args: unknown[]) => applicationsFind(...args),
          deleteMany: (...args: unknown[]) => applicationsDeleteMany(...args),
        };
      case 'research_project_comments':
        return {
          find: (...args: unknown[]) => projectCommentsFind(...args),
          insertOne: (...args: unknown[]) => projectCommentsInsertOne(...args),
          deleteMany: (...args: unknown[]) => projectCommentsDeleteMany(...args),
        };
      case 'research_activity_log':
        return {
          find: (...args: unknown[]) => activityFind(...args),
          insertOne: (...args: unknown[]) => activityInsertOne(...args),
          deleteMany: (...args: unknown[]) => activityDeleteMany(...args),
        };
      case 'research_project_creator_profiles':
        return {
          find: (...args: unknown[]) => creatorProfilesFind(...args),
          deleteMany: (...args: unknown[]) => creatorProfilesDeleteMany(...args),
        };
      case 'research_ai_messages':
        return {
          deleteMany: (...args: unknown[]) => agentMessagesDeleteMany(...args),
        };
      case 'research_project_evidence':
        return {
          find: (...args: unknown[]) => evidenceFind(...args),
          findOne: (...args: unknown[]) => evidenceFindOne(...args),
          insertOne: (...args: unknown[]) => evidenceInsertOne(...args),
          updateOne: (...args: unknown[]) => evidenceUpdateOne(...args),
          bulkWrite: (...args: unknown[]) => evidenceBulkWrite(...args),
          deleteOne: (...args: unknown[]) => evidenceDeleteOne(...args),
          deleteMany: (...args: unknown[]) => evidenceDeleteMany(...args),
        };
      case 'research_project_cycles':
        return {
          insertOne: (...args: unknown[]) => cycleInsertOne(...args),
          deleteMany: (...args: unknown[]) => cycleDeleteMany(...args),
        };
      case 'research_project_charters':
        return { deleteMany: (...args: unknown[]) => charterDeleteMany(...args) };
      case 'research_project_tasks':
        return { deleteMany: (...args: unknown[]) => taskDeleteMany(...args) };
      case 'research_project_reviews':
        return { deleteMany: (...args: unknown[]) => reviewDeleteMany(...args) };
      case 'research_project_outcomes':
        return { deleteMany: (...args: unknown[]) => outcomeDeleteMany(...args) };
      case 'research_project_meetings':
        return { deleteMany: (...args: unknown[]) => projectMeetingsDeleteMany(...args) };
      case 'research_meeting_member_ratings':
        return { deleteMany: (...args: unknown[]) => meetingRatingsDeleteMany(...args) };
      case 'users':
        return {
          find: (...args: unknown[]) => usersFind(...args),
        };
      default:
        return {
          find: () => ({ toArray: async () => [], project: () => ({ toArray: async () => [] }) }),
          findOne: async () => null,
          countDocuments: async () => 0,
        };
    }
  },
}));

vi.mock('./research-project-issue-number.util.js', () => ({
  allocateProjectIssueNumber,
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
  },
}));

import { ResearchModel } from './research.model.js';

describe('ResearchModel.createProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    allocateProjectIssueNumber.mockResolvedValue(42);
    projectsInsertOne.mockResolvedValue({});
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
    cycleInsertOne.mockResolvedValue({});
    membersFindOne.mockResolvedValue(null);
    membersInsertOne.mockResolvedValue({});
  });

  it('always starts at draft with activity time and cycle 1', async () => {
    const projectId = await ResearchModel.createProject({
      name_zh: '新课题',
      status: 'active',
      is_public: true,
    }, 'owner-1');

    expect(projectsInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      id: projectId,
      issue_number: 42,
      name_zh: '新课题',
      status: 'draft',
      is_public: true,
      owner_user_id: 'owner-1',
      last_activity_at: expect.any(Date),
    }));
    expect(allocateProjectIssueNumber).toHaveBeenCalledOnce();
    expect(cycleInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      project_id: projectId,
      cycle_number: 1,
    }));
    // 画布前端已下线，新课题不再自动生成画布文档。
    expect(canvasesInsertOne).not.toHaveBeenCalled();
  });
});

describe('ResearchModel.logActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activityInsertOne.mockResolvedValue({});
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('persists compact change payloads unchanged', async () => {
    await ResearchModel.logActivity(
      'project-1',
      'user-1',
      'task_created',
      'project_task',
      'task-1',
      { title: '标定光路' }
    );

    expect(activityInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      project_id: 'project-1',
      user_id: 'user-1',
      action: 'task_created',
      changes: { title: '标定光路' },
    }));
  });

  it('drops oversized change payloads instead of persisting them', async () => {
    await ResearchModel.logActivity(
      'project-1',
      'user-1',
      'task_created',
      'project_task',
      'task-1',
      { blob: 'x'.repeat(5000) }
    );

    expect(activityInsertOne).toHaveBeenCalledWith(expect.objectContaining({ changes: null }));
  });

  it('drops unserializable change payloads', async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    await ResearchModel.logActivity(
      'project-1',
      'user-1',
      'task_created',
      'project_task',
      'task-1',
      circular
    );

    expect(activityInsertOne).toHaveBeenCalledWith(expect.objectContaining({ changes: null }));
  });
});

describe('ResearchModel.updateProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('applies status-only transitions with the expected current status filter', async () => {
    await expect(ResearchModel.updateProject(
      'project-1',
      { status: 'review_pending' },
      'active'
    )).resolves.toBe('updated');

    expect(projectsUpdateOne).toHaveBeenCalledWith(
      { id: 'project-1', status: 'active' },
      { $set: expect.objectContaining({
        status: 'review_pending',
        updated_at: expect.any(Date),
        last_activity_at: expect.any(Date),
      }) }
    );
  });
});

describe('ResearchModel project question discussions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectCommentsInsertOne.mockResolvedValue({});
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('returns unique discussed top-level question indexes', async () => {
    projectCommentsFind.mockReturnValue({
      project: () => ({
        toArray: async () => [
          { question_index: 2 },
          { question_index: 0 },
          { question_index: 2 },
          { question_index: -1 },
        ],
      }),
    });

    await expect(ResearchModel.getDiscussedProjectQuestionIndexes('project-1'))
      .resolves.toEqual([0, 2]);
    expect(projectCommentsFind).toHaveBeenCalledWith({
      project_id: 'project-1',
      parent_comment_id: null,
      question_index: { $type: 'number' },
    });
  });

  it('stores question_index only for a scoped top-level comment', async () => {
    await ResearchModel.addProjectDiscussionComment(
      'project-1',
      'user-1',
      '回答',
      null,
      [],
      [],
      1
    );

    expect(projectCommentsInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'project-1',
        parent_comment_id: null,
        question_index: 1,
      })
    );
  });

  it('keeps legacy general comments and replies unscoped', async () => {
    await ResearchModel.addProjectDiscussionComment('project-1', 'user-1', '其它讨论');
    const generalComment = projectCommentsInsertOne.mock.calls[0][0];
    expect(generalComment).not.toHaveProperty('question_index');

    await ResearchModel.addProjectDiscussionComment(
      'project-1',
      'user-1',
      '回复',
      'parent-1',
      [],
      [],
      1
    );
    const reply = projectCommentsInsertOne.mock.calls[1][0];
    expect(reply).toEqual(expect.objectContaining({ parent_comment_id: 'parent-1' }));
    expect(reply).not.toHaveProperty('question_index');
  });
});

describe('ResearchModel.addProjectMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    membersInsertOne.mockResolvedValue({});
    membersUpdateOne.mockResolvedValue({ matchedCount: 1 });
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('stores the selected application role label when inserting a new member', async () => {
    membersFindOne.mockResolvedValue(null);

    await ResearchModel.addProjectMember('project-1', 'user-1', 'member', '数据整理');

    expect(membersInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'project-1',
        user_id: 'user-1',
        role: 'member',
        member_role_label: '数据整理',
        active: true,
        removed_at: null,
      })
    );
  });

  it('keeps the task role label nullable for permission-only members', async () => {
    membersFindOne.mockResolvedValue(null);

    await ResearchModel.addProjectMember('project-1', 'owner-1', 'owner');

    expect(membersInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'project-1',
        user_id: 'owner-1',
        role: 'owner',
        member_role_label: null,
      })
    );
  });

  it('updates the task role label when reactivating a former member from an application', async () => {
    membersFindOne.mockResolvedValue({
      project_id: 'project-1',
      user_id: 'user-1',
      role: 'member',
      active: false,
      member_role_label: null,
    });

    await ResearchModel.addProjectMember('project-1', 'user-1', 'member', '记录表达');

    expect(membersUpdateOne).toHaveBeenCalledWith(
      { project_id: 'project-1', user_id: 'user-1' },
      {
        $set: expect.objectContaining({
          role: 'member',
          active: true,
          removed_at: null,
          member_role_label: '记录表达',
        }),
      }
    );
  });
});

describe('ResearchModel.getFormerProjectMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    membersFind
      .mockImplementationOnce(() => ({
        toArray: async () => [],
      }))
      .mockImplementationOnce(() => ({
        project: () => ({
          toArray: async () => [],
        }),
      }));
    applicationsFind.mockImplementation(() => ({
      project: () => ({
        toArray: async () => [
          {
            user_id: 'legacy-user',
            created_at: new Date('2024-01-01T00:00:00Z'),
            reviewed_at: new Date('2024-01-02T00:00:00Z'),
          },
        ],
      }),
    }));
    projectCommentsFind.mockImplementation(() => ({
      project: () => ({ toArray: async () => [] }),
    }));
    activityFind.mockImplementation(() => ({
      project: () => ({ toArray: async () => [] }),
    }));
    creatorProfilesFind.mockImplementation(() => ({
      project: () => ({ toArray: async () => [] }),
    }));
    usersFind.mockImplementation(() => ({
      project: () => ({
        toArray: async () => [{ id: 'legacy-user', username: 'legacy', avatar_url: null }],
      }),
    }));
  });

  it('reconstructs legacy former members from approved application history', async () => {
    const formerMembers = await ResearchModel.getFormerProjectMembers('project-1');

    expect(formerMembers).toEqual([
      expect.objectContaining({
        user_id: 'legacy-user',
        username: 'legacy',
        role: 'member',
        active: false,
        project_id: 'project-1',
      }),
    ]);
  });
});

describe('ResearchModel.getActiveProjectMembership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when the user has no active membership', async () => {
    membersFindOne.mockResolvedValue(null);

    expect(await ResearchModel.getActiveProjectMembership('project-1', 'candidate-1')).toBeNull();
  });

  it('coerces an unrecognized stored role to member', async () => {
    membersFindOne.mockResolvedValue({ project_id: 'project-1', user_id: 'member-1', role: 'guest' });

    const membership = await ResearchModel.getActiveProjectMembership('project-1', 'member-1');

    expect(membership).toEqual(expect.objectContaining({ user_id: 'member-1', role: 'member' }));
  });

  it('preserves the owner role', async () => {
    membersFindOne.mockResolvedValue({ project_id: 'project-1', user_id: 'owner-1', role: 'owner' });

    const membership = await ResearchModel.getActiveProjectMembership('project-1', 'owner-1');

    expect(membership).toEqual(expect.objectContaining({ role: 'owner' }));
  });
});

describe('ResearchModel leadership transfers', () => {
  const transfer = {
    id: 'transfer-1',
    outgoing_owner_user_id: 'owner-1',
    nominee_user_id: 'member-1',
    initiated_by_user_id: 'owner-1',
    invitation_notification_id: 'notification-1',
    created_at: new Date('2026-08-05T00:00:00.000Z'),
    expires_at: new Date('2026-08-12T00:00:00.000Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    membersFindOne.mockResolvedValue({ user_id: 'member-1', active: true });
    membersUpdateMany.mockResolvedValue({ matchedCount: 1 });
    membersUpdateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('requires exactly one active owner for a legacy project', async () => {
    membersFind.mockReturnValue({
      project: () => ({
        toArray: async () => [{ user_id: 'owner-1' }, { user_id: 'owner-2' }],
      }),
    });

    await expect(ResearchModel.getLegacyProjectOwnerState('project-1')).resolves.toEqual({
      ownerUserId: null,
      valid: false,
      source: 'invalid',
    });

    expect(membersFind).toHaveBeenCalledWith({
      project_id: 'project-1',
      role: 'owner',
      $or: [{ active: true }, { active: { $exists: false } }],
    });
  });

  it('materializes the legacy owner while replacing the one bounded pending request', async () => {
    projectsFindOneAndUpdate.mockResolvedValue({
      id: 'project-1',
      pending_leadership_transfer: { ...transfer, id: 'old-transfer' },
    });

    await expect(
      ResearchModel.replacePendingLeadershipTransfer('project-1', 'owner-1', transfer)
    ).resolves.toEqual(expect.objectContaining({ id: 'old-transfer' }));

    expect(projectsFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'project-1',
        $or: expect.arrayContaining([{ owner_user_id: { $exists: false } }]),
      }),
      {
        $set: {
          owner_user_id: 'owner-1',
          pending_leadership_transfer: transfer,
        },
      },
      { returnDocument: 'before', session: databaseSession }
    );
  });

  it('does not nominate a member who became inactive during the request', async () => {
    membersFindOne.mockResolvedValueOnce(null);

    await expect(
      ResearchModel.replacePendingLeadershipTransfer('project-1', 'owner-1', transfer)
    ).resolves.toBe(false);

    expect(projectsFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('switches authority and membership roles in one transaction', async () => {
    projectsFindOneAndUpdate.mockResolvedValue({
      id: 'project-1',
      owner_user_id: 'owner-1',
      pending_leadership_transfer: transfer,
    });
    const now = new Date('2026-08-06T00:00:00.000Z');

    await expect(
      ResearchModel.acceptLeadershipTransfer(
        'project-1',
        'transfer-1',
        'owner-1',
        'member-1',
        now
      )
    ).resolves.toEqual(transfer);

    expect(projectsFindOneAndUpdate).toHaveBeenCalledWith(
      {
        id: 'project-1',
        owner_user_id: 'owner-1',
        'pending_leadership_transfer.id': 'transfer-1',
        'pending_leadership_transfer.outgoing_owner_user_id': 'owner-1',
        'pending_leadership_transfer.nominee_user_id': 'member-1',
        'pending_leadership_transfer.expires_at': { $gt: now },
      },
      {
        $set: { owner_user_id: 'member-1' },
        $unset: { pending_leadership_transfer: '' },
      },
      { returnDocument: 'before', session: databaseSession }
    );
    expect(membersUpdateMany).toHaveBeenCalledWith(
      {
        project_id: 'project-1',
        user_id: { $ne: 'member-1' },
        $or: [{ active: true }, { active: { $exists: false } }],
      },
      { $set: { role: 'member' } },
      { session: databaseSession }
    );
    expect(membersUpdateOne).toHaveBeenCalledWith(
      {
        project_id: 'project-1',
        user_id: 'member-1',
        $or: [{ active: true }, { active: { $exists: false } }],
      },
      { $set: { role: 'owner' } },
      { session: databaseSession }
    );
  });

  it('does not transfer authority when the nominee is no longer active', async () => {
    membersUpdateOne.mockResolvedValueOnce({ matchedCount: 0 });

    await expect(
      ResearchModel.acceptLeadershipTransfer(
        'project-1',
        'transfer-1',
        'owner-1',
        'member-1'
      )
    ).resolves.toBeNull();

    expect(projectsFindOneAndUpdate).not.toHaveBeenCalled();
    expect(membersUpdateMany).not.toHaveBeenCalled();
  });
});

describe('ResearchModel.removeProjectMember', () => {
  const pendingTransfer = {
    id: 'transfer-1',
    outgoing_owner_user_id: 'owner-1',
    nominee_user_id: 'member-1',
    initiated_by_user_id: 'owner-1',
    invitation_notification_id: 'notification-1',
    created_at: new Date('2026-08-05T00:00:00.000Z'),
    expires_at: new Date('2026-08-12T00:00:00.000Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    projectsFindOne.mockResolvedValue({
      owner_user_id: 'owner-1',
      pending_leadership_transfer: pendingTransfer,
    });
    membersUpdateOne.mockResolvedValue({ matchedCount: 1 });
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('removes a nominee and clears the pending transfer in one transaction', async () => {
    await expect(
      ResearchModel.removeProjectMember('project-1', 'member-1', 'owner-1')
    ).resolves.toEqual({
      removed: true,
      ownerConflict: false,
      clearedLeadershipTransfer: pendingTransfer,
    });

    expect(membersUpdateOne).toHaveBeenCalledWith(
      {
        project_id: 'project-1',
        user_id: 'member-1',
        $or: [{ active: true }, { active: { $exists: false } }],
      },
      { $set: { active: false, removed_at: expect.any(Date) } },
      { session: databaseSession }
    );
    expect(projectsUpdateOne).toHaveBeenCalledWith(
      { id: 'project-1', owner_user_id: { $ne: 'member-1' } },
      {
        $set: {
          updated_at: expect.any(Date),
          last_activity_at: expect.any(Date),
        },
        $unset: { pending_leadership_transfer: '' },
      },
      { session: databaseSession }
    );
  });

  it('refuses removal when the target became the authoritative owner', async () => {
    projectsFindOne.mockResolvedValueOnce({ owner_user_id: 'member-1' });

    await expect(
      ResearchModel.removeProjectMember('project-1', 'member-1', 'owner-1')
    ).resolves.toEqual({
      removed: false,
      ownerConflict: true,
      clearedLeadershipTransfer: null,
    });

    expect(membersUpdateOne).not.toHaveBeenCalled();
    expect(projectsUpdateOne).not.toHaveBeenCalled();
  });

  it('rolls back removal when the owner changes before the project write', async () => {
    projectsUpdateOne.mockResolvedValueOnce({ matchedCount: 0 });

    await expect(
      ResearchModel.removeProjectMember('project-1', 'member-1', 'owner-1')
    ).resolves.toEqual({
      removed: false,
      ownerConflict: true,
      clearedLeadershipTransfer: null,
    });
  });
});

describe('ResearchModel.getProjectMemberCapacity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('treats missing max_members as unlimited capacity', async () => {
    projectSettingsFindOne.mockResolvedValue({ project_id: 'project-1', max_members: null });
    membersCountDocuments.mockResolvedValue(4);

    const capacity = await ResearchModel.getProjectMemberCapacity('project-1');

    expect(capacity).toEqual({
      maxMembers: null,
      memberCount: 4,
      isFull: false,
    });
  });

  it('reports full capacity when active members reach max_members', async () => {
    projectSettingsFindOne.mockResolvedValue({ project_id: 'project-1', max_members: 4 });
    membersCountDocuments.mockResolvedValue(4);

    const capacity = await ResearchModel.getProjectMemberCapacity('project-1');

    expect(membersCountDocuments).toHaveBeenCalledWith({
      project_id: 'project-1',
      $or: [{ active: true }, { active: { $exists: false } }],
    });
    expect(capacity).toEqual({
      maxMembers: 4,
      memberCount: 4,
      isFull: true,
    });
  });
});

describe('ResearchModel project evidence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    evidenceFind.mockReturnValue({
      project: () => ({ toArray: async () => [] }),
      sort: () => ({ toArray: async () => [] }),
    });
    evidenceInsertOne.mockResolvedValue({});
    evidenceUpdateOne.mockResolvedValue({ matchedCount: 1 });
    evidenceDeleteOne.mockResolvedValue({ deletedCount: 1 });
    evidenceBulkWrite.mockResolvedValue({});
  });

  it('lists project evidence with creator profile data', async () => {
    evidenceFind.mockReturnValue({
      sort: () => ({
        toArray: async () => [
          {
            id: 'evidence-1',
            project_id: 'project-1',
            title: '偏振图样观察',
            evidence_type: 'image_observation',
            created_by: 'user-1',
            created_at: new Date('2026-01-02T00:00:00Z'),
          },
        ],
      }),
    });
    usersFind.mockReturnValue({
      project: () => ({
        toArray: async () => [{ id: 'user-1', username: '小林', avatar_url: '/avatar.png' }],
      }),
    });

    const evidence = await ResearchModel.getProjectEvidence('project-1');

    expect(evidenceFind).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(evidence).toEqual([
      expect.objectContaining({
        id: 'evidence-1',
        creator_username: '小林',
        creator_avatar_url: '/avatar.png',
      }),
    ]);
  });

  it('normalizes a legacy attachment and preserves created-desc order when sort order is missing', async () => {
    evidenceFind.mockReturnValue({
      sort: () => ({
        toArray: async () => [
          {
            id: 'evidence-newer',
            project_id: 'project-1',
            title: '较新的记录',
            evidence_type: 'experiment_log',
            created_by: 'user-1',
            created_at: new Date('2026-01-03T00:00:00Z'),
            attachment_url: '/uploads/courses/project-evidence-project-1/pdf/new.pdf',
            attachment_original_name: 'new.pdf',
            attachment_size: 2,
            attachment_mime_type: 'application/pdf',
            attachment_category: 'pdf',
          },
          {
            id: 'evidence-older',
            project_id: 'project-1',
            title: '较早的记录',
            evidence_type: 'experiment_log',
            created_by: 'user-1',
            created_at: new Date('2026-01-02T00:00:00Z'),
          },
        ],
      }),
    });
    usersFind.mockReturnValue({
      project: () => ({
        toArray: async () => [{ id: 'user-1', username: '小林' }],
      }),
    });

    const evidence = await ResearchModel.getProjectEvidence('project-1');

    expect(evidence.map((item) => item.id)).toEqual(['evidence-newer', 'evidence-older']);
    expect(evidence[0]).toEqual(expect.objectContaining({
      sort_order: 0,
      attachments: [{
        url: '/uploads/courses/project-evidence-project-1/pdf/new.pdf',
        original_name: 'new.pdf',
        size: 2,
        mime_type: 'application/pdf',
        category: 'pdf',
      }],
      attachment_urls: ['/uploads/courses/project-evidence-project-1/pdf/new.pdf'],
    }));
  });

  it('keeps legacy created-desc order ahead of a newly appended sorted record', async () => {
    evidenceFind.mockReturnValue({
      sort: () => ({
        toArray: async () => [
          {
            id: 'evidence-appended',
            project_id: 'project-1',
            title: '新追加',
            evidence_type: 'other',
            created_by: 'user-1',
            created_at: new Date('2026-01-04T00:00:00Z'),
            sort_order: 2,
          },
          {
            id: 'evidence-newer-legacy',
            project_id: 'project-1',
            title: '较新旧记录',
            evidence_type: 'other',
            created_by: 'user-1',
            created_at: new Date('2026-01-03T00:00:00Z'),
          },
          {
            id: 'evidence-older-legacy',
            project_id: 'project-1',
            title: '较早旧记录',
            evidence_type: 'other',
            created_by: 'user-1',
            created_at: new Date('2026-01-02T00:00:00Z'),
          },
        ],
      }),
    });
    usersFind.mockReturnValue({
      project: () => ({ toArray: async () => [{ id: 'user-1', username: '小林' }] }),
    });

    const evidence = await ResearchModel.getProjectEvidence('project-1');

    expect(evidence.map((item) => item.id)).toEqual([
      'evidence-newer-legacy',
      'evidence-older-legacy',
      'evidence-appended',
    ]);
  });

  it('creates evidence with nullable optional attachment fields', async () => {
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
    await ResearchModel.createProjectEvidence('project-1', 'user-1', {
      title: '变量表记录',
      evidence_type: 'data_table',
      description: '记录角度与亮度',
      external_url: null,
      attachment_url: null,
      attachment_original_name: null,
      attachment_size: null,
      attachment_mime_type: null,
      attachment_category: null,
      attachment_note: '表格暂存在外部链接',
    });

    expect(evidenceInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'project-1',
        title: '变量表记录',
        evidence_type: 'data_table',
        description: '记录角度与亮度',
        external_url: null,
        attachment_url: null,
        attachment_note: '表格暂存在外部链接',
        created_by: 'user-1',
      })
    );
  });

  it('stores ordered attachments and mirrors the first attachment into legacy fields', async () => {
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });

    await ResearchModel.createProjectEvidence('project-1', 'user-1', {
      title: '多附件证据',
      evidence_type: 'data_table',
      attachments: [
        {
          url: '/uploads/courses/project-evidence-project-1/pdf/primary.pdf',
          original_name: 'primary.pdf',
          size: 128,
          mime_type: 'application/pdf',
          category: 'pdf',
        },
        {
          url: '/uploads/courses/project-evidence-project-1/image/support.png',
          original_name: 'support.png',
          size: 256,
          mime_type: 'image/png',
          category: 'image',
        },
      ],
    });

    expect(evidenceInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [
        expect.objectContaining({ url: '/uploads/courses/project-evidence-project-1/pdf/primary.pdf' }),
        expect.objectContaining({ url: '/uploads/courses/project-evidence-project-1/image/support.png' }),
      ],
      attachment_urls: [
        '/uploads/courses/project-evidence-project-1/pdf/primary.pdf',
        '/uploads/courses/project-evidence-project-1/image/support.png',
      ],
      attachment_url: '/uploads/courses/project-evidence-project-1/pdf/primary.pdf',
      attachment_original_name: 'primary.pdf',
      attachment_size: 128,
      attachment_mime_type: 'application/pdf',
      attachment_category: 'pdf',
    }));
  });

  it('updates evidence attachment metadata', async () => {
    await ResearchModel.updateProjectEvidence('evidence-1', {
      title: '更新后的证据',
      evidence_type: 'experiment_log',
      attachment_url: '/uploads/courses/project-evidence-project-1/pdf/file.pdf',
      attachment_original_name: 'record.pdf',
      attachment_size: 128,
      attachment_mime_type: 'application/pdf',
      attachment_category: 'pdf',
    });

    expect(evidenceUpdateOne).toHaveBeenCalledWith(
      { id: 'evidence-1' },
      {
        $set: expect.objectContaining({
          title: '更新后的证据',
          evidence_type: 'experiment_log',
          attachment_url: '/uploads/courses/project-evidence-project-1/pdf/file.pdf',
          attachment_original_name: 'record.pdf',
          attachment_size: 128,
          attachment_mime_type: 'application/pdf',
          attachment_category: 'pdf',
          updated_at: expect.any(Date),
        }),
      }
    );
  });

  it('returns project evidence attachment URLs for lifecycle cleanup', async () => {
    evidenceFind.mockReturnValue({
      project: () => ({
        toArray: async () => [
          { attachment_url: '/uploads/courses/project-evidence-project-1/image/a.png' },
          {
            attachment_urls: [
              '/uploads/courses/project-evidence-project-1/pdf/b.pdf',
              '/uploads/courses/project-evidence-project-1/image/a.png',
            ],
          },
          { attachment_url: null },
          { attachment_url: '   ' },
        ],
      }),
    });

    const urls = await ResearchModel.getProjectEvidenceAttachmentUrls('project-1');

    expect(urls).toEqual([
      '/uploads/courses/project-evidence-project-1/image/a.png',
      '/uploads/courses/project-evidence-project-1/pdf/b.pdf',
    ]);
  });

  it('appends newly created evidence after the current visible records', async () => {
    evidenceFind.mockReturnValue({
      project: () => ({
        toArray: async () => [
          { sort_order: 0 },
          { sort_order: 2 },
        ],
      }),
      sort: () => ({ toArray: async () => [] }),
    });
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });

    await ResearchModel.createProjectEvidence('project-1', 'user-1', {
      title: '追加记录',
      evidence_type: 'other',
      attachments: [],
    });

    expect(evidenceInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      sort_order: 3,
      attachments: [],
      attachment_urls: [],
      attachment_url: null,
    }));
  });

  it('writes dense sort positions transactionally and rejects a stale visible order', async () => {
    evidenceFind.mockReturnValue({
      sort: () => ({
        toArray: async () => [
          { id: 'evidence-1', created_at: new Date('2026-01-02T00:00:00Z'), sort_order: 0 },
          { id: 'evidence-2', created_at: new Date('2026-01-01T00:00:00Z'), sort_order: 1 },
        ],
      }),
    });
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });

    await expect(ResearchModel.reorderProjectEvidence(
      'project-1',
      ['evidence-1', 'evidence-2'],
      ['evidence-2', 'evidence-1']
    )).resolves.toBe(true);
    expect(evidenceBulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { id: 'evidence-2', project_id: 'project-1' },
          update: { $set: { sort_order: 0 } },
        },
      },
      {
        updateOne: {
          filter: { id: 'evidence-1', project_id: 'project-1' },
          update: { $set: { sort_order: 1 } },
        },
      },
    ], { session: databaseSession });

    await expect(ResearchModel.reorderProjectEvidence(
      'project-1',
      ['evidence-2', 'evidence-1'],
      ['evidence-2', 'evidence-1']
    )).resolves.toBe(false);
    expect(evidenceBulkWrite).toHaveBeenCalledTimes(1);
  });

  it('deletes evidence rows when deleting a project', async () => {
    canvasesFind.mockReturnValue({
      project: () => ({ toArray: async () => [] }),
    });
    projectsDeleteOne.mockResolvedValue({ deletedCount: 1 });
    membersFind.mockReturnValue({ toArray: async () => [] });
    membersCountDocuments.mockResolvedValue(0);
    membersDeleteMany.mockResolvedValue({});
    canvasesDeleteMany.mockResolvedValue({});
    edgesDeleteMany.mockResolvedValue({});
    nodesDeleteMany.mockResolvedValue({});
    commentsDeleteMany.mockResolvedValue({});
    projectCommentsDeleteMany.mockResolvedValue({});
    evidenceDeleteMany.mockResolvedValue({});
    agentMessagesDeleteMany.mockResolvedValue({});
    activityDeleteMany.mockResolvedValue({});
    projectSettingsDeleteMany.mockResolvedValue({});
    creatorProfilesDeleteMany.mockResolvedValue({});
    applicationsDeleteMany.mockResolvedValue({});
    cycleDeleteMany.mockResolvedValue({});
    charterDeleteMany.mockResolvedValue({});
    taskDeleteMany.mockResolvedValue({});
    reviewDeleteMany.mockResolvedValue({});
    outcomeDeleteMany.mockResolvedValue({});
    projectMeetingsDeleteMany.mockResolvedValue({});
    meetingRatingsDeleteMany.mockResolvedValue({});

    const deleted = await ResearchModel.deleteProject('project-1');

    expect(deleted).toBe(true);
    expect(evidenceDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(cycleDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(charterDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(taskDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(reviewDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(outcomeDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(projectMeetingsDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(meetingRatingsDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
  });
});
