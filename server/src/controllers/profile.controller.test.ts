import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockProfileModel, mockResearchModel } = vi.hoisted(() => ({
  mockProfileModel: {
    getPublicProjectById: vi.fn(),
  },
  mockResearchModel: {
    getProjectEvidence: vi.fn(),
  },
}));

vi.mock('../models/profile.model.js', () => ({
  ProfileModel: mockProfileModel,
}));

vi.mock('../models/research.model.js', () => ({
  ResearchModel: mockResearchModel,
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { ProfileController } from './profile.controller.js';

function createResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe('ProfileController.getPublicProjectEvidence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns evidence only after the project is publicly visible', async () => {
    mockProfileModel.getPublicProjectById.mockResolvedValue({
      id: 'project-1',
      name_zh: '公开课题',
    });
    mockResearchModel.getProjectEvidence.mockResolvedValue([
      { id: 'evidence-1', title: '公开证据' },
    ]);

    const req = {
      params: { projectId: 'project-1' },
      user: undefined,
    };
    const res = createResponse();

    await ProfileController.getPublicProjectEvidence(req as any, res as any);

    expect(mockProfileModel.getPublicProjectById).toHaveBeenCalledWith('project-1', undefined);
    expect(mockResearchModel.getProjectEvidence).toHaveBeenCalledWith('project-1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: 'evidence-1', title: '公开证据' }],
    });
  });

  it('does not return evidence for private or hidden projects', async () => {
    mockProfileModel.getPublicProjectById.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-1' },
      user: undefined,
    };
    const res = createResponse();

    await ProfileController.getPublicProjectEvidence(req as any, res as any);

    expect(mockResearchModel.getProjectEvidence).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'PROJECT_NOT_FOUND', message: '公开课题不存在或暂未开放' },
    });
  });
});
