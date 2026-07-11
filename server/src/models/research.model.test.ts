import { beforeEach, describe, expect, it, vi } from 'vitest';

const membersFind = vi.fn();
const membersFindOne = vi.fn();
const membersInsertOne = vi.fn();
const membersUpdateOne = vi.fn();
const membersDeleteMany = vi.fn();
const membersCountDocuments = vi.fn();
const projectsFindOne = vi.fn();
const projectsUpdateOne = vi.fn();
const projectsInsertOne = vi.fn();
const projectsDeleteOne = vi.fn();
const canvasesFind = vi.fn();
const canvasesDeleteMany = vi.fn();
const canvasesCountDocuments = vi.fn();
const canvasesInsertOne = vi.fn();
const nodesFind = vi.fn();
const nodesDeleteMany = vi.fn();
const edgesDeleteMany = vi.fn();
const commentsDeleteMany = vi.fn();
const projectCommentsDeleteMany = vi.fn();
const agentMessagesDeleteMany = vi.fn();
const activityDeleteMany = vi.fn();
const projectSettingsDeleteMany = vi.fn();
const projectSettingsFindOne = vi.fn();
const applicationsFind = vi.fn();
const applicationsDeleteMany = vi.fn();
const projectCommentsFind = vi.fn();
const activityFind = vi.fn();
const creatorProfilesFind = vi.fn();
const creatorProfilesDeleteMany = vi.fn();
const evidenceFind = vi.fn();
const evidenceFindOne = vi.fn();
const evidenceInsertOne = vi.fn();
const evidenceUpdateOne = vi.fn();
const evidenceDeleteOne = vi.fn();
const evidenceDeleteMany = vi.fn();
const usersFind = vi.fn();
const cycleDeleteMany = vi.fn();
const charterDeleteMany = vi.fn();
const taskDeleteMany = vi.fn();
const reviewDeleteMany = vi.fn();
const outcomeDeleteMany = vi.fn();
const cycleInsertOne = vi.fn();

vi.mock('../database/connection.js', () => ({
  getCollection: (name: string) => {
    switch (name) {
      case 'research_project_members':
        return {
          find: (...args: unknown[]) => membersFind(...args),
          findOne: (...args: unknown[]) => membersFindOne(...args),
          insertOne: (...args: unknown[]) => membersInsertOne(...args),
          updateOne: (...args: unknown[]) => membersUpdateOne(...args),
          deleteMany: (...args: unknown[]) => membersDeleteMany(...args),
          countDocuments: (...args: unknown[]) => membersCountDocuments(...args),
        };
      case 'research_projects':
        return {
          findOne: (...args: unknown[]) => projectsFindOne(...args),
          updateOne: (...args: unknown[]) => projectsUpdateOne(...args),
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
          deleteMany: (...args: unknown[]) => nodesDeleteMany(...args),
        };
      case 'research_edges':
        return {
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
          deleteMany: (...args: unknown[]) => projectCommentsDeleteMany(...args),
        };
      case 'research_activity_log':
        return {
          find: (...args: unknown[]) => activityFind(...args),
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

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
  },
}));

import { ResearchModel } from './research.model.js';

describe('ResearchModel.createProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectsInsertOne.mockResolvedValue({});
    projectsUpdateOne.mockResolvedValue({ matchedCount: 1 });
    cycleInsertOne.mockResolvedValue({});
    membersFindOne.mockResolvedValue(null);
    membersInsertOne.mockResolvedValue({});
    canvasesInsertOne.mockResolvedValue({});
  });

  it('always starts at draft with activity time and cycle 1', async () => {
    const projectId = await ResearchModel.createProject({
      name_zh: '新课题',
      status: 'active',
      is_public: true,
    }, 'owner-1');

    expect(projectsInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      id: projectId,
      name_zh: '新课题',
      status: 'draft',
      is_public: true,
      last_activity_at: expect.any(Date),
    }));
    expect(cycleInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      project_id: projectId,
      cycle_number: 1,
    }));
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

describe('ResearchModel.getProjectAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectsFindOne.mockResolvedValue({
      id: 'project-1',
      name_zh: '私有课题',
      is_public: false,
    });
    membersFindOne.mockResolvedValue(null);
    membersCountDocuments.mockResolvedValue(1);
    canvasesCountDocuments.mockResolvedValue(0);
  });

  it('grants admin full project capabilities without creating membership state', async () => {
    const access = await ResearchModel.getProjectAccess('project-1', 'admin-1', 'admin');

    expect(access).toEqual(
      expect.objectContaining({
        membership: null,
        role: null,
        isAdmin: true,
        isMember: false,
        canRead: true,
        canWrite: true,
        canManage: true,
        canAccessDiscussion: true,
        canModerate: true,
      })
    );
  });

  it('keeps ordinary non-members limited to public read access', async () => {
    projectsFindOne.mockResolvedValue({
      id: 'project-1',
      name_zh: '公开课题',
      is_public: true,
    });
    projectSettingsFindOne.mockResolvedValue({ project_id: 'project-1', visibility: 'public' });

    const access = await ResearchModel.getProjectAccess('project-1', 'candidate-1', 'user');

    expect(access).toEqual(
      expect.objectContaining({
        membership: null,
        role: null,
        isAdmin: false,
        isMember: false,
        canRead: true,
        canWrite: false,
        canManage: false,
        canAccessDiscussion: false,
        canModerate: false,
      })
    );
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
    evidenceInsertOne.mockResolvedValue({});
    evidenceUpdateOne.mockResolvedValue({ matchedCount: 1 });
    evidenceDeleteOne.mockResolvedValue({ deletedCount: 1 });
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
          { attachment_url: null },
          { attachment_url: '   ' },
        ],
      }),
    });

    const urls = await ResearchModel.getProjectEvidenceAttachmentUrls('project-1');

    expect(urls).toEqual(['/uploads/courses/project-evidence-project-1/image/a.png']);
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

    const deleted = await ResearchModel.deleteProject('project-1');

    expect(deleted).toBe(true);
    expect(evidenceDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(cycleDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(charterDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(taskDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(reviewDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(outcomeDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
  });
});
