import { beforeEach, describe, expect, it, vi } from 'vitest';

const applicationCollection = {
  findOne: vi.fn(),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
};

vi.mock('../database/connection.js', () => ({
  getCollection: (name: string) => {
    if (name === 'research_project_applications') {
      return applicationCollection;
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

    const applicationId = await ProfileModel.createApplication('project-1', 'user-1', {
      display_name: '用户',
      organization: '组织',
    });

    expect(applicationId).toBe('existing-application');
    expect(applicationCollection.updateOne).toHaveBeenCalledWith(
      { id: 'existing-application' },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'pending',
          review_notes: null,
        }),
      })
    );
    expect(applicationCollection.insertOne).not.toHaveBeenCalled();
  });
});
