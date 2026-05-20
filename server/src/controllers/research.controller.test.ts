import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockResearchModel, mockProfileModel, mockManagedUploadCleanupService } = vi.hoisted(() => ({
  mockResearchModel: {
    getProjectAccess: vi.fn(),
    getUserProjects: vi.fn(),
    getProjectById: vi.fn(),
    getProjectMembers: vi.fn(),
    getFormerProjectMembers: vi.fn(),
    getProjectMembership: vi.fn(),
    getProjectMemberCapacity: vi.fn(),
    getProjectDiscussionCommentById: vi.fn(),
    addProjectMember: vi.fn(),
    removeProjectMember: vi.fn(),
    deleteProjectDiscussionComment: vi.fn(),
    deleteProject: vi.fn(),
  },
  mockProfileModel: {
    getOrCreateProjectSettings: vi.fn(),
    getProjectApplications: vi.fn(),
    getPendingApplication: vi.fn(),
    createApplication: vi.fn(),
    getApplicationById: vi.fn(),
    updateApplicationStatus: vi.fn(),
  },
  mockManagedUploadCleanupService: {
    cleanupUrls: vi.fn(),
  },
}));

vi.mock('../models/research.model.js', () => ({
  ResearchModel: mockResearchModel,
}));

vi.mock('../models/profile.model.js', () => ({
  ProfileModel: mockProfileModel,
}));

vi.mock('../services/managed-upload-cleanup.service.js', () => ({
  ManagedUploadCleanupService: mockManagedUploadCleanupService,
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
    mockResearchModel.getProjectMemberCapacity.mockResolvedValue({
      maxMembers: null,
      memberCount: 1,
      isFull: false,
    });
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

  it('includes former_members when the requester is an admin without membership', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1', name_zh: '课题', member_count: 1 },
      membership: null,
      role: null,
      isAdmin: true,
      isMember: false,
      canRead: true,
      canWrite: true,
      canManage: true,
      canAccessDiscussion: true,
      canModerate: true,
    });
    mockResearchModel.getProjectMembers.mockResolvedValue([
      { user_id: 'owner-1', role: 'owner', username: 'owner' },
    ]);
    mockResearchModel.getFormerProjectMembers.mockResolvedValue([
      { user_id: 'former-1', role: 'member', username: 'former', removed_at: new Date().toISOString() },
    ]);
    mockProfileModel.getPendingApplication.mockResolvedValue(null);

    const req = { params: { id: 'project-1' }, user: { sub: 'admin-1', username: 'admin', role: 'admin' } };
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

  it('rejects restoring a former member when the project member limit is reached', async () => {
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
    mockResearchModel.getProjectMemberCapacity.mockResolvedValue({
      maxMembers: 2,
      memberCount: 2,
      isFull: true,
    });

    const req = {
      params: { id: 'project-1' },
      body: { userId: 'former-1', role: 'member' },
      user: { sub: 'owner-1', username: 'owner' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.addProjectMember, req, res);

    expect(res.error).toHaveBeenCalledWith(
      '该课题组可参与讨论的成员名额已满',
      'PROJECT_MEMBER_LIMIT_REACHED',
      400
    );
    expect(mockResearchModel.addProjectMember).not.toHaveBeenCalled();
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

  it('allows an admin to view project applications without owner membership', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: null,
      role: null,
      isAdmin: true,
      isMember: false,
      canRead: true,
      canWrite: true,
      canManage: true,
      canAccessDiscussion: true,
      canModerate: true,
    });
    mockProfileModel.getProjectApplications.mockResolvedValue([
      { id: 'application-1', status: 'pending' },
    ]);

    const req = {
      params: { id: 'project-1' },
      user: { sub: 'admin-1', username: 'admin', role: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.getProjectApplications, req, res);

    expect(mockProfileModel.getProjectApplications).toHaveBeenCalledWith('project-1');
    expect(res.success).toHaveBeenCalledWith([{ id: 'application-1', status: 'pending' }]);
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
      body: { confirmationText: 'DELETE' },
      user: { sub: 'admin-1', username: 'admin', role: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.deleteProject, req, res);

    expect(mockResearchModel.deleteProject).toHaveBeenCalledWith('project-1');
    expect(res.success).toHaveBeenCalledWith(null, '项目删除成功');
  });

  it('requires DELETE confirmation text before deleting a project', async () => {
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

    const req = {
      params: { id: 'project-1' },
      body: { confirmationText: 'delete' },
      user: { sub: 'admin-1', username: 'admin', role: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.deleteProject, req, res);

    expect(res.error).toHaveBeenCalledWith(
      '请输入大写 DELETE 以确认删除课题',
      'DELETE_CONFIRMATION_REQUIRED',
      400
    );
    expect(mockResearchModel.deleteProject).not.toHaveBeenCalled();
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

  it('allows an admin to remove a non-owner member without membership', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: null,
      role: null,
      isAdmin: true,
      isMember: false,
      canRead: true,
      canWrite: true,
      canManage: true,
      canAccessDiscussion: true,
      canModerate: true,
    });
    mockResearchModel.getProjectMembers.mockResolvedValue([
      { user_id: 'owner-1', role: 'owner', username: 'owner' },
      { user_id: 'member-1', role: 'member', username: 'member' },
    ]);
    mockResearchModel.removeProjectMember.mockResolvedValue(true);

    const req = {
      params: { id: 'project-1', userId: 'member-1' },
      user: { sub: 'admin-1', username: 'admin', role: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.removeProjectMember, req, res);

    expect(mockResearchModel.removeProjectMember).toHaveBeenCalledWith('project-1', 'member-1');
    expect(res.success).toHaveBeenCalledWith(null, '成员移除成功');
  });

  it('does not allow an admin to remove the project owner', async () => {
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: null,
      role: null,
      isAdmin: true,
      isMember: false,
      canRead: true,
      canWrite: true,
      canManage: true,
      canAccessDiscussion: true,
      canModerate: true,
    });
    mockResearchModel.getProjectMembers.mockResolvedValue([
      { user_id: 'owner-1', role: 'owner', username: 'owner' },
    ]);

    const req = {
      params: { id: 'project-1', userId: 'owner-1' },
      user: { sub: 'admin-1', username: 'admin', role: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.removeProjectMember, req, res);

    expect(res.error).toHaveBeenCalledWith('不能移除组长', 'CANNOT_REMOVE_OWNER', 403);
    expect(mockResearchModel.removeProjectMember).not.toHaveBeenCalled();
  });

  it('rejects member removal by non-owner users', async () => {
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
    mockResearchModel.getProjectMembers.mockResolvedValue([
      { user_id: 'member-1', role: 'member', username: 'member' },
      { user_id: 'member-2', role: 'member', username: 'other' },
    ]);

    const req = {
      params: { id: 'project-1', userId: 'member-2' },
      user: { sub: 'member-1', username: 'member', role: 'user' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.removeProjectMember, req, res);

    expect(res.error).toHaveBeenCalledWith('无权移除成员', 'FORBIDDEN', 403);
    expect(mockResearchModel.removeProjectMember).not.toHaveBeenCalled();
  });

  it('allows an admin to delete another user project discussion comment', async () => {
    mockResearchModel.getProjectDiscussionCommentById.mockResolvedValue({
      id: 'comment-1',
      project_id: 'project-1',
      user_id: 'member-1',
      image_urls: ['/uploads/project-discussion-project-1/comment.png'],
    });
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: null,
      role: null,
      isAdmin: true,
      isMember: false,
      canRead: true,
      canWrite: true,
      canManage: true,
      canAccessDiscussion: true,
      canModerate: true,
    });
    mockResearchModel.deleteProjectDiscussionComment.mockResolvedValue(true);
    mockManagedUploadCleanupService.cleanupUrls.mockResolvedValue(undefined);

    const req = {
      params: { id: 'comment-1' },
      user: { sub: 'admin-1', username: 'admin', role: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.deleteProjectDiscussionComment, req, res);

    expect(mockResearchModel.deleteProjectDiscussionComment).toHaveBeenCalledWith('comment-1');
    expect(mockManagedUploadCleanupService.cleanupUrls).toHaveBeenCalledWith(
      ['/uploads/project-discussion-project-1/comment.png'],
      { reason: 'research.project-comment.delete:comment-1' }
    );
    expect(res.success).toHaveBeenCalledWith(null, '讨论留言删除成功');
  });

  it('approves applications by adding members as member', async () => {
    mockProfileModel.getApplicationById.mockResolvedValue({
      id: 'application-1',
      project_id: 'project-1',
      user_id: 'candidate-1',
      status: 'pending',
    });
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: { user_id: 'owner-1', role: 'owner' },
      role: 'owner',
      isAdmin: false,
      isMember: true,
      canRead: true,
      canWrite: true,
      canManage: true,
      canAccessDiscussion: true,
      canModerate: true,
    });
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

  it('rejects approving applications when the project member limit is reached', async () => {
    mockProfileModel.getApplicationById.mockResolvedValue({
      id: 'application-1',
      project_id: 'project-1',
      user_id: 'candidate-1',
      status: 'pending',
    });
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: { user_id: 'owner-1', role: 'owner' },
      role: 'owner',
      isAdmin: false,
      isMember: true,
      canRead: true,
      canWrite: true,
      canManage: true,
      canAccessDiscussion: true,
      canModerate: true,
    });
    mockResearchModel.getProjectMembership.mockResolvedValue(null);
    mockResearchModel.getProjectMemberCapacity.mockResolvedValue({
      maxMembers: 2,
      memberCount: 2,
      isFull: true,
    });

    const req = {
      params: { id: 'application-1' },
      body: { status: 'approved' },
      user: { sub: 'owner-1', username: 'owner' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.updateApplicationStatus, req, res);

    expect(res.error).toHaveBeenCalledWith(
      '该课题组可参与讨论的成员名额已满',
      'PROJECT_MEMBER_LIMIT_REACHED',
      400
    );
    expect(mockProfileModel.updateApplicationStatus).not.toHaveBeenCalled();
    expect(mockResearchModel.addProjectMember).not.toHaveBeenCalled();
  });

  it('allows an admin to approve applications without owner membership', async () => {
    mockProfileModel.getApplicationById.mockResolvedValue({
      id: 'application-1',
      project_id: 'project-1',
      user_id: 'candidate-1',
      status: 'pending',
    });
    mockResearchModel.getProjectAccess.mockResolvedValue({
      project: { id: 'project-1' },
      membership: null,
      role: null,
      isAdmin: true,
      isMember: false,
      canRead: true,
      canWrite: true,
      canManage: true,
      canAccessDiscussion: true,
      canModerate: true,
    });
    mockResearchModel.getProjectMembership.mockResolvedValue(null);
    mockProfileModel.updateApplicationStatus.mockResolvedValue(true);
    mockResearchModel.addProjectMember.mockResolvedValue(true);

    const req = {
      params: { id: 'application-1' },
      body: { status: 'approved' },
      user: { sub: 'admin-1', username: 'admin', role: 'admin' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.updateApplicationStatus, req, res);

    expect(mockProfileModel.updateApplicationStatus).toHaveBeenCalledWith(
      'application-1',
      'approved',
      'admin-1',
      undefined
    );
    expect(mockResearchModel.addProjectMember).toHaveBeenCalledWith('project-1', 'candidate-1', 'member');
    expect(res.success).toHaveBeenCalledWith(null, '申请已通过');
  });

  it('rejects application status updates by non-owner users', async () => {
    mockProfileModel.getApplicationById.mockResolvedValue({
      id: 'application-1',
      project_id: 'project-1',
      user_id: 'candidate-1',
      status: 'pending',
    });
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
      params: { id: 'application-1' },
      body: { status: 'approved' },
      user: { sub: 'member-1', username: 'member', role: 'user' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.updateApplicationStatus, req, res);

    expect(res.error).toHaveBeenCalledWith('无权处理该申请', 'FORBIDDEN', 403);
    expect(mockProfileModel.updateApplicationStatus).not.toHaveBeenCalled();
    expect(mockResearchModel.addProjectMember).not.toHaveBeenCalled();
  });

  it('rejects join applications when the project member limit is reached', async () => {
    mockProfileModel.getOrCreateProjectSettings.mockResolvedValue({
      visibility: 'public',
      require_approval: true,
      is_recruiting: true,
    });
    mockResearchModel.getProjectMembers.mockResolvedValue([
      { user_id: 'owner-1', role: 'owner', username: 'owner' },
      { user_id: 'member-1', role: 'member', username: 'member' },
    ]);
    mockResearchModel.getProjectMemberCapacity.mockResolvedValue({
      maxMembers: 2,
      memberCount: 2,
      isFull: true,
    });

    const req = {
      params: { id: 'project-1' },
      body: { motivation: 'I want to help.' },
      user: { sub: 'candidate-1', username: 'candidate' },
    };
    const res = createResponse();

    await invokeHandler(ResearchController.createApplication, req, res);

    expect(res.error).toHaveBeenCalledWith(
      '该课题组可参与讨论的成员名额已满',
      'PROJECT_MEMBER_LIMIT_REACHED',
      400
    );
    expect(mockProfileModel.createApplication).not.toHaveBeenCalled();
  });
});
