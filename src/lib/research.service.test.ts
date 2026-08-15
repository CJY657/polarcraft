import { beforeEach, describe, expect, it, vi } from 'vitest';

const { put, post, deleteRequest, ensureApiSuccess, unwrapApiData } = vi.hoisted(() => ({
  put: vi.fn(),
  post: vi.fn(),
  deleteRequest: vi.fn(),
  ensureApiSuccess: vi.fn(),
  unwrapApiData: vi.fn(),
}));

vi.mock('./api', () => ({
  api: {
    put,
    post,
    delete: deleteRequest,
  },
  ensureApiSuccess,
  unwrapApiData,
}));

import { researchApi } from './research.service';

describe('researchApi leadership transfer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    put.mockResolvedValue({ success: true });
    post.mockResolvedValue({ success: true });
    deleteRequest.mockResolvedValue({ success: true });
  });

  it('uses the project leadership-transfer lifecycle endpoints', async () => {
    await researchApi.nominateProjectLeadershipTransfer('project-1', 'user-2');
    await researchApi.cancelProjectLeadershipTransfer('project-1', 'transfer-1');
    await researchApi.acceptProjectLeadershipTransfer('project-1', 'transfer-1');
    await researchApi.declineProjectLeadershipTransfer('project-1', 'transfer-1');

    expect(put).toHaveBeenCalledWith('/api/research/projects/project-1/leadership-transfer', {
      targetUserId: 'user-2',
    });
    expect(deleteRequest).toHaveBeenCalledWith(
      '/api/research/projects/project-1/leadership-transfer/transfer-1'
    );
    expect(post).toHaveBeenNthCalledWith(
      1,
      '/api/research/projects/project-1/leadership-transfer/transfer-1/accept'
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/api/research/projects/project-1/leadership-transfer/transfer-1/decline'
    );
    expect(ensureApiSuccess).toHaveBeenCalledTimes(4);
  });
});

describe('researchApi evidence ordering', () => {
  it('uses the project evidence order endpoint with the optimistic snapshot', async () => {
    const response = { success: true, data: [] };
    put.mockResolvedValue(response);
    unwrapApiData.mockReturnValue([]);

    await researchApi.reorderProjectEvidence('project-1', {
      expectedEvidenceIds: ['evidence-1', 'evidence-2'],
      evidenceIds: ['evidence-2', 'evidence-1'],
    });

    expect(put).toHaveBeenCalledWith('/api/research/projects/project-1/evidence/order', {
      expectedEvidenceIds: ['evidence-1', 'evidence-2'],
      evidenceIds: ['evidence-2', 'evidence-1'],
    });
    expect(unwrapApiData).toHaveBeenCalledWith(response, '更新证据顺序失败');
  });
});

describe('researchApi meeting deletion', () => {
  it('uses the project-scoped meeting delete endpoint', async () => {
    const response = { success: true };
    deleteRequest.mockResolvedValue(response);

    await researchApi.deleteProjectMeeting('project-1', 'meeting-1');

    expect(deleteRequest).toHaveBeenCalledWith(
      '/api/research/projects/project-1/meetings/meeting-1'
    );
    expect(ensureApiSuccess).toHaveBeenCalledWith(response, '删除会议失败');
  });
});
