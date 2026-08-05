import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockResearchModel, mockProfileModel } = vi.hoisted(() => ({
  mockResearchModel: {
    getProjectById: vi.fn(),
    getActiveProjectMembership: vi.fn(),
    getLegacyProjectOwnerState: vi.fn(),
    setLegacyProjectVisibility: vi.fn(),
  },
  mockProfileModel: {
    createProjectSettings: vi.fn(),
    updateProjectSettings: vi.fn(),
    getOrCreateProjectSettings: vi.fn(),
  },
}));

vi.mock('../models/research.model.js', () => ({
  ResearchModel: mockResearchModel,
}));

vi.mock('../models/profile.model.js', () => ({
  ProfileModel: mockProfileModel,
}));

import { ProjectAccessService } from './project-access.service.js';

describe('ProjectAccessService.getProjectAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResearchModel.getProjectById.mockResolvedValue({
      id: 'project-1',
      name_zh: '私有课题',
      visibility: 'private',
      owner_user_id: 'owner-1',
    });
    mockResearchModel.getActiveProjectMembership.mockResolvedValue(null);
    mockResearchModel.getLegacyProjectOwnerState.mockResolvedValue({
      ownerUserId: 'owner-1',
      valid: true,
      source: 'legacy',
    });
  });

  it('denies everything when the project does not exist', async () => {
    mockResearchModel.getProjectById.mockResolvedValue(null);

    const access = await ProjectAccessService.getProjectAccess('missing', 'user-1', 'user');

    expect(access.project).toBeNull();
    expect(access.canRead).toBe(false);
    expect(access.canWrite).toBe(false);
    expect(access.canManage).toBe(false);
    expect(access.canAccessDiscussion).toBe(false);
    expect(access.canModerate).toBe(false);
  });

  it('grants admin full project capabilities without creating membership state', async () => {
    const access = await ProjectAccessService.getProjectAccess('project-1', 'admin-1', 'admin');

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
    mockResearchModel.getProjectById.mockResolvedValue({
      id: 'project-1',
      name_zh: '公开课题',
      visibility: 'public',
    });

    const access = await ProjectAccessService.getProjectAccess('project-1', 'candidate-1', 'user');

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

  it('gives owners management and moderation rights on a private project', async () => {
    mockResearchModel.getActiveProjectMembership.mockResolvedValue({
      user_id: 'owner-1',
      role: 'owner',
    });

    const access = await ProjectAccessService.getProjectAccess('project-1', 'owner-1', 'user');

    expect(access).toEqual(
      expect.objectContaining({
        role: 'owner',
        isMember: true,
        canRead: true,
        canWrite: true,
        canManage: true,
        canAccessDiscussion: true,
        canModerate: true,
      })
    );
  });

  it('lets plain members write and discuss but not manage', async () => {
    mockResearchModel.getActiveProjectMembership.mockResolvedValue({
      user_id: 'member-1',
      role: 'member',
    });

    const access = await ProjectAccessService.getProjectAccess('project-1', 'member-1', 'user');

    expect(access).toEqual(
      expect.objectContaining({
        role: 'member',
        isMember: true,
        canRead: true,
        canWrite: true,
        canManage: false,
        canAccessDiscussion: true,
        canModerate: false,
      })
    );
  });

  it('does not let a stale membership owner role retain management access', async () => {
    mockResearchModel.getProjectById.mockResolvedValue({
      id: 'project-1',
      visibility: 'private',
      owner_user_id: 'member-1',
    });
    mockResearchModel.getActiveProjectMembership.mockResolvedValue({
      user_id: 'owner-1',
      role: 'owner',
    });

    const access = await ProjectAccessService.getProjectAccess('project-1', 'owner-1', 'user');

    expect(access).toEqual(expect.objectContaining({
      ownerUserId: 'member-1',
      role: 'member',
      canManage: false,
      canModerate: false,
    }));
  });

  it('grants management to the authoritative owner even before membership roles synchronize', async () => {
    mockResearchModel.getProjectById.mockResolvedValue({
      id: 'project-1',
      visibility: 'private',
      owner_user_id: 'member-1',
    });
    mockResearchModel.getActiveProjectMembership.mockResolvedValue({
      user_id: 'member-1',
      role: 'member',
    });

    const access = await ProjectAccessService.getProjectAccess('project-1', 'member-1', 'user');

    expect(access).toEqual(expect.objectContaining({
      role: 'owner',
      canManage: true,
      canModerate: true,
    }));
  });

  it('marks malformed legacy ownership invalid without granting management', async () => {
    mockResearchModel.getProjectById.mockResolvedValue({
      id: 'project-1',
      visibility: 'private',
    });
    mockResearchModel.getLegacyProjectOwnerState.mockResolvedValue({
      ownerUserId: null,
      valid: false,
      source: 'invalid',
    });
    mockResearchModel.getActiveProjectMembership.mockResolvedValue({
      user_id: 'owner-1',
      role: 'owner',
    });

    const access = await ProjectAccessService.getProjectAccess('project-1', 'owner-1', 'user');

    expect(access).toEqual(expect.objectContaining({
      ownerUserId: null,
      ownerStateValid: false,
      role: 'member',
      canManage: false,
    }));
  });

  it('skips the membership lookup for anonymous callers', async () => {
    await ProjectAccessService.getProjectAccess('project-1');

    expect(mockResearchModel.getActiveProjectMembership).not.toHaveBeenCalled();
  });
});

describe('ProjectAccessService.hasPermission', () => {
  const access = {
    project: { id: 'project-1' },
    membership: null,
    role: null,
    ownerUserId: 'owner-1',
    ownerStateValid: true,
    isAdmin: false,
    isMember: false,
    canRead: true,
    canWrite: false,
    canManage: false,
    canAccessDiscussion: false,
    canModerate: false,
  };

  it('maps each access level onto its capability flag', () => {
    expect(ProjectAccessService.hasPermission(access, 'read')).toBe(true);
    expect(ProjectAccessService.hasPermission(access, 'write')).toBe(false);
    expect(ProjectAccessService.hasPermission(access, 'manage')).toBe(false);
    expect(ProjectAccessService.hasPermission(access, 'discussion')).toBe(false);
  });
});

describe('ProjectAccessService visibility writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileModel.getOrCreateProjectSettings.mockResolvedValue({ visibility: 'private' });
  });

  it('syncs the legacy is_public flag when visibility is set', async () => {
    await ProjectAccessService.setProjectVisibility('project-1', 'public');

    expect(mockProfileModel.updateProjectSettings).toHaveBeenCalledWith('project-1', { visibility: 'public' });
    expect(mockResearchModel.setLegacyProjectVisibility).toHaveBeenCalledWith('project-1', true);
  });

  it('treats invite_only as not public in the legacy flag', async () => {
    await ProjectAccessService.setProjectVisibility('project-1', 'invite_only');

    expect(mockResearchModel.setLegacyProjectVisibility).toHaveBeenCalledWith('project-1', false);
  });

  it('re-syncs the legacy flag from the resulting visibility of a settings patch', async () => {
    await ProjectAccessService.applyProjectSettings('project-1', { visibility: 'public' });

    expect(mockProfileModel.updateProjectSettings).toHaveBeenCalledWith('project-1', { visibility: 'public' });
    expect(mockResearchModel.setLegacyProjectVisibility).toHaveBeenCalledWith('project-1', true);
  });

  it('keeps the stored visibility when a settings patch omits it', async () => {
    mockProfileModel.getOrCreateProjectSettings.mockResolvedValue({ visibility: 'public' });

    await ProjectAccessService.applyProjectSettings('project-1', { is_recruiting: false });

    expect(mockProfileModel.updateProjectSettings).toHaveBeenCalledWith('project-1', { is_recruiting: false });
    expect(mockResearchModel.setLegacyProjectVisibility).toHaveBeenCalledWith('project-1', true);
  });
});
