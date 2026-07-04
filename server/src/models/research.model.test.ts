import { beforeEach, describe, expect, it, vi } from 'vitest';

const membersFind = vi.fn();
const membersFindOne = vi.fn();
const membersInsertOne = vi.fn();
const membersUpdateOne = vi.fn();
const membersCountDocuments = vi.fn();
const projectsFindOne = vi.fn();
const canvasesCountDocuments = vi.fn();
const projectSettingsFindOne = vi.fn();
const applicationsFind = vi.fn();
const projectCommentsFind = vi.fn();
const activityFind = vi.fn();
const creatorProfilesFind = vi.fn();
const usersFind = vi.fn();

vi.mock('../database/connection.js', () => ({
  getCollection: (name: string) => {
    switch (name) {
      case 'research_project_members':
        return {
          find: (...args: unknown[]) => membersFind(...args),
          findOne: (...args: unknown[]) => membersFindOne(...args),
          insertOne: (...args: unknown[]) => membersInsertOne(...args),
          updateOne: (...args: unknown[]) => membersUpdateOne(...args),
          countDocuments: (...args: unknown[]) => membersCountDocuments(...args),
        };
      case 'research_projects':
        return {
          findOne: (...args: unknown[]) => projectsFindOne(...args),
          find: () => ({ sort: () => ({ toArray: async () => [] }) }),
        };
      case 'research_canvases':
        return {
          countDocuments: (...args: unknown[]) => canvasesCountDocuments(...args),
        };
      case 'research_project_settings':
        return {
          findOne: (...args: unknown[]) => projectSettingsFindOne(...args),
        };
      case 'research_project_applications':
        return {
          find: (...args: unknown[]) => applicationsFind(...args),
        };
      case 'research_project_comments':
        return {
          find: (...args: unknown[]) => projectCommentsFind(...args),
        };
      case 'research_activity_log':
        return {
          find: (...args: unknown[]) => activityFind(...args),
        };
      case 'research_project_creator_profiles':
        return {
          find: (...args: unknown[]) => creatorProfilesFind(...args),
        };
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

describe('ResearchModel.addProjectMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    membersInsertOne.mockResolvedValue({});
    membersUpdateOne.mockResolvedValue({ matchedCount: 1 });
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
