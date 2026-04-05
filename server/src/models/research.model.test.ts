import { beforeEach, describe, expect, it, vi } from 'vitest';

const membersFind = vi.fn();
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
        role: 'viewer',
        active: false,
        project_id: 'project-1',
      }),
    ]);
  });
});
