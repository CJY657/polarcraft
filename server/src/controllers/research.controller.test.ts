import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockResearchModel, mockProfileModel } = vi.hoisted(() => ({
  mockResearchModel: {
    getProjectAccess: vi.fn(),
    getUserProjects: vi.fn(),
    getProjectById: vi.fn(),
    getProjectMembers: vi.fn(),
    getFormerProjectMembers: vi.fn(),
    getProjectMembership: vi.fn(),
    addProjectMember: vi.fn(),
    removeProjectMember: vi.fn(),
    deleteProject: vi.fn(),
  },
  mockProfileModel: {
    getProjectApplications: vi.fn(),
    getPendingApplication: vi.fn(),
    getApplicationById: vi.fn(),
    updateApplicationStatus: vi.fn(),
  },
}));

vi.mock('../models/research.model.js', () => ({
  ResearchModel: mockResearchModel,
}));

vi.mock('../models/profile.model.js', () => ({
  ProfileModel: mockProfileModel,
}));

import { ResearchController } from './research.controller.js';

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

describe('ResearchController member management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes former_members when the requester is the owner', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1', name_zh: '课题', member_count: 1 },
      membership: { user_id: 'owner-1', role: 'owner' },
      role: 'owner',
      isMember: true,
      canRead: true,
      canWrite: true,
      canManage: true,
      canAccessDiscussion: true,
      canModerate: true,
    });
    mockResearchModel.getProjectById.mockResolvedValue({ id: 'project-1', name_zh: '课题', member_count: 1 });
    mockResearchModel.getProjectMembers.mockResolvedValue([
      { user_id: 'owner-1', role: 'owner', username: 'owner' },
    ]);
    mockResearchModel.getFormerProjectMembers.mockResolvedValue([
      { user_id: 'former-1', role: 'member', username: 'former', removed_at: new Date().toISOString() },
    ]);
    mockProfileModel.getPendingApplication.mockResolvedValue(null);

    const req = { params: { id: 'project-1' }, user: { sub: 'owner-1' } };
    const res = createResponse();

    await invokeHandler(ResearchController.getProject, req, res);

    expect(mockResearchModel.getFormerProjectMembers).toHaveBeenCalledWith('project-1');
    expect(res.success).toHaveBeenCalledWith(
      expect.objectContaining({
        members: expect.any(Array),
        former_members: expect.any(Array),
      })
    );
  });

  it('includes pending-application state for non-members', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1', name_zh: '课题', member_count: 1 },
      membership: null,
      role: null,
      isMember: false,
      canRead: true,
      canWrite: false,
      canManage: false,
      canAccessDiscussion: false,
      canModerate: false,
    });
    mockResearchModel.getProjectById.mockResolvedValue({ id: 'project-1', name_zh: '课题', member_count: 1 });
    mockResearchModel.getProjectMembers.mockResolvedValue([
      { user_id: 'owner-1', role: 'owner', username: 'owner' },
    ]);
    mockProfileModel.getPendingApplication.mockResolvedValue({ id: 'application-1', status: 'pending' });

    const req = { params: { id: 'project-1' }, user: { sub: 'candidate-1' } };
    const res = createResponse();

    await invokeHandler(ResearchController.getProject, req, res);

    expect(mockProfileModel.getPendingApplication).toHaveBeenCalledWith('project-1', 'candidate-1');
    expect(res.success).toHaveBeenCalledWith(
      expect.objectContaining({
        has_pending_application: true,
      })
    );
  });

  it('rejects addProjectMember when the requester is not the owner', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: null,
      role: null,
      isMember: false,
      canRead: true,
      canWrite: false,
      canManage: false,
      canAccessDiscussion: false,
      canModerate: false,
    });

    const req = {
      params: { id: 'project-1' },
      body: { userId: 'former-1' },
      user: { sub: 'member-1', username: 'member' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.addProjectMember, req, res);

    expect(res.error).toHaveBeenCalledWith('只有组长可以拉回成员', 'FORBIDDEN', 403);
    expect(mockResearchModel.addProjectMember).not.toHaveBeenCalled();
  });

  it('reactivates a former member as member when the requester is the owner', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: { user_id: 'owner-1', role: 'owner' },
      role: 'owner',
      isMember: true,
      canRead: true,
      canWrite: true,
      canManage: true,
      canAccessDiscussion: true,
      canModerate: true,
    });
    mockResearchModel.getProjectMembership.mockResolvedValue({
      user_id: 'former-1',
      role: 'member',
      active: false,
    });
    mockProfileModel.getPendingApplication.mockResolvedValue({
      id: 'application-1',
      status: 'pending',
    });
    mockProfileModel.updateApplicationStatus.mockResolvedValue(true);
    mockResearchModel.addProjectMember.mockResolvedValue(true);

    const req = {
      params: { id: 'project-1' },
      body: { userId: 'former-1', role: 'member' },
      user: { sub: 'owner-1', username: 'owner' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.addProjectMember, req, res);

    expect(mockResearchModel.addProjectMember).toHaveBeenCalledWith('project-1', 'former-1', 'member');
    expect(mockProfileModel.updateApplicationStatus).toHaveBeenCalledWith(
      'application-1',
      'approved',
      'owner-1',
      '组长直接拉回成员'
    );
    expect(res.success).toHaveBeenCalledWith(null, '成员已拉回');
  });

  it('allows restoring a legacy former member without an existing membership row', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: { user_id: 'owner-1', role: 'owner' },
      role: 'owner',
      isMember: true,
      canRead: true,
      canWrite: true,
      canManage: true,
      canAccessDiscussion: true,
      canModerate: true,
    });
    mockResearchModel.getProjectMembership.mockResolvedValue(null);
    mockResearchModel.getFormerProjectMembers.mockResolvedValue([
      { user_id: 'legacy-user', role: 'member', username: 'legacy' },
    ]);
    mockProfileModel.getPendingApplication.mockResolvedValue(null);
    mockResearchModel.addProjectMember.mockResolvedValue(true);

    const req = {
      params: { id: 'project-1' },
      body: { userId: 'legacy-user' },
      user: { sub: 'owner-1', username: 'owner' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.addProjectMember, req, res);

    expect(mockResearchModel.getFormerProjectMembers).toHaveBeenCalledWith('project-1');
    expect(mockResearchModel.addProjectMember).toHaveBeenCalledWith('project-1', 'legacy-user', 'member');
    expect(res.success).toHaveBeenCalledWith(null, '成员已拉回');
  });

  it('requires owner role to view project applications', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: null,
      role: null,
      isMember: false,
      canRead: true,
      canWrite: false,
      canManage: false,
      canAccessDiscussion: false,
      canModerate: false,
    });

    const req = {
      params: { id: 'project-1' },
      user: { sub: 'admin-1', username: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.getProjectApplications, req, res);

    expect(res.error).toHaveBeenCalledWith('无权查看申请列表', 'FORBIDDEN', 403);
    expect(mockProfileModel.getProjectApplications).not.toHaveBeenCalled();
  });

  it('allows an admin to delete a project without owner membership', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: null,
      role: null,
      isAdmin: true,
      isMember: false,
      canRead: true,
      canWrite: false,
      canManage: false,
      canAccessDiscussion: false,
      canModerate: false,
    });
    mockResearchModel.deleteProject.mockResolvedValue(true);

    const req = {
      params: { id: 'project-1' },
      user: { sub: 'admin-1', username: 'admin', role: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.deleteProject, req, res);

    expect(mockResearchModel.deleteProject).toHaveBeenCalledWith('project-1');
    expect(res.success).toHaveBeenCalledWith(null, '项目删除成功');
  });

  it('rejects project deletion for non-owner non-admin users', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: { user_id: 'member-1', role: 'member' },
      role: 'member',
      isAdmin: false,
      isMember: true,
      canRead: true,
      canWrite: true,
      canManage: false,
      canAccessDiscussion: true,
      canModerate: false,
    });

    const req = {
      params: { id: 'project-1' },
      user: { sub: 'member-1', username: 'member', role: 'user' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.deleteProject, req, res);

    expect(res.error).toHaveBeenCalledWith('只有管理员或组长可以删除课题', 'FORBIDDEN', 403);
    expect(mockResearchModel.deleteProject).not.toHaveBeenCalled();
  });

  it('approves applications by adding members as member', async () => {
    mockProfileModel.getApplicationById.mockResolvedValue({
      id: 'application-1',
      project_id: 'project-1',
      user_id: 'candidate-1',
      status: 'pending',
    });
    mockResearchModel.getProjectMembers.mockResolvedValue([
      { user_id: 'owner-1', role: 'owner', username: 'owner' },
    ]);
    mockResearchModel.getProjectMembership.mockResolvedValue({
      user_id: 'candidate-1',
      active: false,
    });
    mockProfileModel.updateApplicationStatus.mockResolvedValue(true);
    mockResearchModel.addProjectMember.mockResolvedValue(true);

    const req = {
      params: { id: 'application-1' },
      body: { status: 'approved' },
      user: { sub: 'owner-1', username: 'owner' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.updateApplicationStatus, req, res);

    expect(mockResearchModel.addProjectMember).toHaveBeenCalledWith('project-1', 'candidate-1', 'member');
    expect(res.success).toHaveBeenCalledWith(null, '申请已通过');
  });
});
