import { beforeEach, describe, expect, it, vi } from 'vitest';

const applicationCollection = {
  find: vi.fn(),
  findOne: vi.fn(),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
};
const projectSettingsCollection = {
  find: vi.fn(),
  findOne: vi.fn(),
};
const researchProjectsCollection = {
  find: vi.fn(),
  findOne: vi.fn(),
};
const projectMembersCollection = {
  find: vi.fn(),
};
const usersCollection = {
  find: vi.fn(),
  findOne: vi.fn(),
};
const canvasesCollection = {
  find: vi.fn(),
};
const nodesCollection = {
  find: vi.fn(),
};
const projectCommentsCollection = {
  find: vi.fn(),
};

vi.mock('../database/connection.js', () => ({
  getCollection: (name: string) => {
    if (name === 'research_project_applications') {
      return applicationCollection;
    }
    if (name === 'research_project_settings') {
      return projectSettingsCollection;
    }
    if (name === 'research_projects') {
      return researchProjectsCollection;
    }
    if (name === 'research_project_members') {
      return projectMembersCollection;
    }
    if (name === 'users') {
      return usersCollection;
    }
    if (name === 'research_canvases') {
      return canvasesCollection;
    }
    if (name === 'research_nodes') {
      return nodesCollection;
    }
    if (name === 'research_project_comments') {
      return projectCommentsCollection;
    }

    return {
      find: () => ({
        project: () => ({ toArray: async () => [] }),
        sort: () => ({ toArray: async () => [] }),
        toArray: async () => [],
      }),
      findOne: async () => null,
      updateOne: async () => ({ matchedCount: 0 }),
      insertOne: async () => ({}),
      project: () => ({ toArray: async () => [] }),
      toArray: async () => [],
    };
  },
}));

vi.mock('../utils/crypto.util.js', () => ({
  generateId: () => 'generated-application-id',
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
  },
}));

import { ProfileModel } from './profile.model.js';

describe('ProfileModel.getPublicProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectSettingsCollection.find.mockReturnValue({
      toArray: async () => [
        { project_id: 'draft-1', visibility: 'public', is_recruiting: true },
        { project_id: 'archived-1', visibility: 'public', is_recruiting: false },
        { project_id: 'legacy-1', visibility: 'public', is_recruiting: false },
      ],
    });
    researchProjectsCollection.find.mockReturnValue({
      sort: () => ({
        toArray: async () => [
          { id: 'draft-1', name_zh: '草稿课题', status: 'draft' },
          { id: 'archived-1', name_zh: '归档课题', status: 'archived' },
          { id: 'legacy-1', name_zh: '旧状态课题', status: 'completed' },
        ],
      }),
    });
    projectMembersCollection.find.mockReturnValue({ toArray: async () => [] });
    canvasesCollection.find.mockReturnValue({
      project: () => ({ toArray: async () => [] }),
    });
    projectCommentsCollection.find.mockReturnValue({
      project: () => ({
        sort: () => ({ toArray: async () => [] }),
      }),
    });
  });

  it('returns public projects regardless of lifecycle or legacy status', async () => {
    const projects = await ProfileModel.getPublicProjects();

    expect(researchProjectsCollection.find).toHaveBeenCalledWith({
      id: { $in: ['draft-1', 'archived-1', 'legacy-1'] },
    });
    expect(projects.map((project) => project.status)).toEqual(['draft', 'archived', 'completed']);
  });
});

describe('ProfileModel.createApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reuses an existing non-pending application row when the user reapplies', async () => {
    applicationCollection.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'existing-application',
        project_id: 'project-1',
        user_id: 'user-1',
        status: 'rejected',
      });
    usersCollection.findOne.mockResolvedValue({
      id: 'user-1',
      username: 'candidate',
      nickname: '旧昵称',
      real_name: '候选人',
      avatar_url: null,
    });

    const applicationId = await ProfileModel.createApplication('project-1', 'user-1', {
      display_name: '客户端传入名称',
      organization: '组织',
      desired_role: '观察记录员',
      proposed_contribution: '整理第一轮观察记录',
      weekly_time_commitment: '每周 2 小时',
    });

    expect(applicationId).toBe('existing-application');
    expect(applicationCollection.updateOne).toHaveBeenCalledWith(
      { id: 'existing-application' },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'pending',
          review_notes: null,
          display_name: 'candidate',
          desired_role: '观察记录员',
          proposed_contribution: '整理第一轮观察记录',
          weekly_time_commitment: '每周 2 小时',
        }),
      })
    );
    expect(applicationCollection.insertOne).not.toHaveBeenCalled();
  });
});

describe('ProfileModel.getPublicProjectById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectSettingsCollection.findOne.mockResolvedValue({
      id: 'settings-1',
      project_id: 'project-1',
      visibility: 'public',
      require_approval: false,
      recruitment_requirements: '欢迎加入',
      max_members: 4,
      is_recruiting: true,
    });
    researchProjectsCollection.find.mockImplementation(() => {
      throw new Error('single public project lookup should not load the full public project list');
    });
    researchProjectsCollection.findOne.mockResolvedValue({
      id: 'project-1',
      name_zh: '公开课题',
      description_zh: '研究背景',
      challenge_value_zh: '研究价值',
      challenge_beginner_steps_zh: '先做观察',
      challenge_roles_zh: '观察记录员',
      challenge_min_deliverables_zh: '观察记录',
      challenge_timeline_zh: '四周',
      challenge_review_criteria_zh: '记录完整',
      status: 'active',
      is_public: true,
      created_at: new Date('2026-01-01T00:00:00Z'),
      updated_at: new Date('2026-01-02T00:00:00Z'),
    });
    projectMembersCollection.find.mockReturnValue({
      toArray: async () => [
        {
          project_id: 'project-1',
          user_id: 'member-1',
          role: 'member',
          member_role_label: '数据整理',
          joined_at: new Date('2026-01-03T00:00:00Z'),
        },
        {
          project_id: 'project-1',
          user_id: 'owner-1',
          role: 'owner',
          joined_at: new Date('2026-01-01T00:00:00Z'),
        },
      ],
    });
    applicationCollection.find.mockReturnValue({
      project: () => ({
        toArray: async () => [{ project_id: 'project-1' }],
      }),
    });
    usersCollection.find.mockReturnValue({
      project: () => ({
        toArray: async () => [
          { id: 'owner-1', username: '组长', avatar_url: null },
          { id: 'member-1', username: '成员', avatar_url: null },
        ],
      }),
    });
    canvasesCollection.find.mockReturnValue({
      project: () => ({
        toArray: async () => [],
      }),
    });
    nodesCollection.find.mockReturnValue({
      project: () => ({
        sort: () => ({ toArray: async () => [] }),
      }),
    });
    projectCommentsCollection.find.mockReturnValue({
      project: () => ({
        sort: () => ({ toArray: async () => [] }),
      }),
    });
  });

  it('loads and enriches a single public project without materializing the full public list', async () => {
    const project = await ProfileModel.getPublicProjectById('project-1', 'candidate-1');

    expect(projectSettingsCollection.findOne).toHaveBeenCalledWith({
      project_id: 'project-1',
      visibility: 'public',
    });
    expect(researchProjectsCollection.findOne).toHaveBeenCalledWith({ id: 'project-1' });
    expect(researchProjectsCollection.find).not.toHaveBeenCalled();
    expect(project).toEqual(
      expect.objectContaining({
        id: 'project-1',
        visibility: 'public',
        require_approval: false,
        is_recruiting: true,
        member_count: 2,
        is_member: false,
        has_pending_application: true,
        owner_username: '组长',
        owner_nickname: null,
        owner_real_name: null,
        owner_show_real_name_publicly: false,
        members: [
          { username: '组长', nickname: null, real_name: null, show_real_name_publicly: false, avatar_url: null, role: 'owner', member_role_label: null },
          { username: '成员', nickname: null, real_name: null, show_real_name_publicly: false, avatar_url: null, role: 'member', member_role_label: '数据整理' },
        ],
      })
    );
  });

  it('keeps incomplete and dormant public projects visible', async () => {
    researchProjectsCollection.findOne.mockResolvedValue({
      id: 'project-1',
      name_zh: '不完整课题',
      description_zh: '只有背景',
      status: 'active',
      is_public: true,
      last_activity_at: new Date('2020-01-01T00:00:00Z'),
    });

    await expect(ProfileModel.getPublicProjectById('project-1')).resolves.toEqual(
      expect.objectContaining({
        id: 'project-1',
        visibility: 'public',
        is_dormant: true,
      })
    );
  });

  it('keeps archived public projects visible', async () => {
    researchProjectsCollection.findOne.mockResolvedValue({
      id: 'project-1',
      name_zh: '已归档课题',
      status: 'archived',
      is_public: true,
    });

    await expect(ProfileModel.getPublicProjectById('project-1')).resolves.toEqual(
      expect.objectContaining({ id: 'project-1', status: 'archived' })
    );
  });

  it('keeps projects with legacy statuses visible', async () => {
    researchProjectsCollection.findOne.mockResolvedValue({
      id: 'project-1',
      name_zh: '旧状态课题',
      status: 'completed',
      is_public: true,
    });

    await expect(ProfileModel.getPublicProjectById('project-1')).resolves.toEqual(
      expect.objectContaining({ id: 'project-1', status: 'completed' })
    );
  });
});
