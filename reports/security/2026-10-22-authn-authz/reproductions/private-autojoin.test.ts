const { mockResearchProjectsCollection } = vi.hoisted(() => ({ mockResearchProjectsCollection: { find: vi.fn(), findOne: vi.fn(), updateOne: vi.fn() } }));
vi.mock('/home/cjy/polarcraft/server/src/database/connection.js', () => ({ getCollection: (name: string) => { if (name !== 'research_projects') throw new Error('Unexpected collection access: ' + name); return mockResearchProjectsCollection; } }));

const {
  mockResearchModel,
  mockNotificationModel,
  mockProfileModel,
  mockManagedUploadCleanupService,
  mockResearchAgentService,
  mockResearchMeetingModel,
} = vi.hoisted(() => ({
  mockResearchModel: {
    getUserProjects: vi.fn(),
    getActiveProjectMembership: vi.fn(),
    setLegacyProjectVisibility: vi.fn(),
    getProjectById: vi.fn(),
    getProjectMembers: vi.fn(),
    getFormerProjectMembers: vi.fn(),
    getProjectMembership: vi.fn(),
    getProjectMemberCapacity: vi.fn(),
    getProjectAgentMessages: vi.fn(),
    clearProjectAgentMessages: vi.fn(),
    getRecentProjectAgentMessages: vi.fn(),
    getRecentProjectDiscussionDigest: vi.fn(),
    getActiveProjectMemberUserIds: vi.fn(),
    addProjectAgentMessage: vi.fn(),
    getProjectEvidence: vi.fn(),
    getProjectEvidenceById: vi.fn(),
    getProjectEvidenceAttachmentUrls: vi.fn(),
    createProjectEvidence: vi.fn(),
    updateProjectEvidence: vi.fn(),
    deleteProjectEvidence: vi.fn(),
    reorderProjectEvidence: vi.fn(),
    getProjectDiscussionCommentById: vi.fn(),
    addProjectDiscussionComment: vi.fn(),
    logActivity: vi.fn(),
    addProjectMember: vi.fn(),
    removeProjectMember: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    getDiscussedProjectQuestionIndexes: vi.fn(),
    touchProjectActivity: vi.fn(),
    deleteProjectDiscussionComment: vi.fn(),
    deleteProject: vi.fn(),
    ensureCurrentProjectCycle: vi.fn(),
    getProjectReviews: vi.fn(),
    getProjectReviewById: vi.fn(),
    upsertProjectReview: vi.fn(),
    deleteProjectReview: vi.fn(),
    countProjectReviews: vi.fn(),
    getProjectTasks: vi.fn(),
    getProjectTaskById: vi.fn(),
    createProjectTask: vi.fn(),
    updateProjectTask: vi.fn(),
    deleteProjectTask: vi.fn(),
    updateProjectDiscussionComment: vi.fn(),
    replacePendingLeadershipTransfer: vi.fn(),
    clearPendingLeadershipTransfer: vi.fn(),
    clearExpiredLeadershipTransfer: vi.fn(),
    acceptLeadershipTransfer: vi.fn(),
    getLeadershipTransferIdentityView: vi.fn(),
  },
  mockNotificationModel: {
    createNotification: vi.fn(),
    createNotificationForUsers: vi.fn(),
    deleteNotification: vi.fn(),
  },
  mockProfileModel: {
    getOrCreateProjectSettings: vi.fn(),
    getProjectApplications: vi.fn(),
    getPendingApplication: vi.fn(),
    createApplication: vi.fn(),
    getApplicationById: vi.fn(),
    updateApplicationStatus: vi.fn(),
    getProjectSettings: vi.fn(),
    updateProjectSettings: vi.fn(),
  },
  mockManagedUploadCleanupService: {
    cleanupUrls: vi.fn(),
  },
  mockResearchAgentService: {
    isEnabled: vi.fn(),
    createChatCompletion: vi.fn(),
  },
  mockResearchMeetingModel: {
    getProjectMeetingRawFileUrls: vi.fn(),
  },

}));

vi.mock('/home/cjy/polarcraft/server/src/models/research.model.js', () => ({
  ResearchModel: mockResearchModel,
}));

vi.mock('/home/cjy/polarcraft/server/src/models/research-meeting.model.js', () => ({
  ResearchMeetingModel: mockResearchMeetingModel,
}));

vi.mock('/home/cjy/polarcraft/server/src/models/notification.model.js', () => ({
  NotificationModel: mockNotificationModel,
}));

vi.mock('/home/cjy/polarcraft/server/src/models/profile.model.js', () => ({
  ProfileModel: mockProfileModel,
}));

vi.mock('/home/cjy/polarcraft/server/src/services/managed-upload-cleanup.service.js', () => ({
  ManagedUploadCleanupService: mockManagedUploadCleanupService,
}));


vi.mock('/home/cjy/polarcraft/server/src/services/research-agent.service.js', () => ({
  RESEARCH_AGENT_SYSTEM_PROMPT: 'advisor system prompt',
  ResearchAgentDisabledError: class ResearchAgentDisabledError extends Error {
    statusCode = 503;
    code = 'AI_ADVISOR_DISABLED';
  },
  ResearchAgentUpstreamError: class ResearchAgentUpstreamError extends Error {
    statusCode = 502;
    code = 'AI_PROVIDER_ERROR';
  },
  ResearchAgentService: mockResearchAgentService,
}));

import { ProjectAccessService } from '/home/cjy/polarcraft/server/src/services/project-access.service.ts';
import { ResearchController } from '/home/cjy/polarcraft/server/src/controllers/research.controller.ts';

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


describe('offline authz proof - private project self admission', () => {
  it('owner switches open public project to private; outsider gains membership by direct application', async () => {
    let settings: any = { visibility: 'public', require_approval: false, is_recruiting: true };
    const memberships = new Map<string, any>([['owner', { user_id: 'owner', active: true }]]);
    mockProfileModel.getOrCreateProjectSettings.mockImplementation(async () => ({ ...settings }));
    mockProfileModel.getProjectSettings.mockImplementation(async () => ({ ...settings }));
    mockProfileModel.updateProjectSettings.mockImplementation(async (_id: string, patch: any) => { settings = { ...settings, ...patch }; return true; });
    mockResearchModel.getProjectById.mockImplementation(async () => ({ id: 'known-project', owner_user_id: 'owner', visibility: settings.visibility }));
    mockResearchModel.getActiveProjectMembership.mockImplementation(async (_id: string, userId: string) => memberships.get(userId) ?? null);
    mockResearchModel.getProjectMembers.mockImplementation(async () => [...memberships.values()]);
    mockResearchModel.getProjectMemberCapacity.mockResolvedValue({ isFull: false });
    mockResearchModel.addProjectMember.mockImplementation(async (_id: string, userId: string, role: string) => { memberships.set(userId, { user_id: userId, role, active: true }); });
    mockProfileModel.createApplication.mockResolvedValue('application-new');
    mockProfileModel.getApplicationById.mockResolvedValue({ id: 'application-new', user_id: 'outsider', desired_role: 'tester' });
    mockProfileModel.updateApplicationStatus.mockResolvedValue(true);
    const ownerResponse = createResponse();
    await invokeHandler(ResearchController.updateProjectSettings, { params: { id: 'known-project' }, user: { sub: 'owner', role: 'user', username: 'owner' }, body: { visibility: 'private' } }, ownerResponse);
    expect(ownerResponse.error).not.toHaveBeenCalled();
    expect(settings).toEqual({ visibility: 'private', require_approval: false, is_recruiting: true });
    const before = await ProjectAccessService.getProjectAccess('known-project', 'outsider', 'user');
    expect(before.canRead).toBe(false);
    expect(before.canWrite).toBe(false);
    const outsiderResponse = createResponse();
    await invokeHandler(ResearchController.createApplication, { params: { id: 'known-project' }, user: { sub: 'outsider', role: 'user', username: 'outsider' }, body: { desired_role: 'tester', proposed_contribution: 'test', weekly_time_commitment: '1h' } }, outsiderResponse);
    expect(outsiderResponse.error).not.toHaveBeenCalled();
    expect(mockResearchModel.addProjectMember).toHaveBeenCalledWith('known-project', 'outsider', 'member', 'tester');
    const after = await ProjectAccessService.getProjectAccess('known-project', 'outsider', 'user');
    expect(after.canRead).toBe(true);
    expect(after.canWrite).toBe(true);
    expect(after.canAccessDiscussion).toBe(true);
    expect(after.canManage).toBe(false);
    console.log(JSON.stringify({ proof: 'private project direct application', settings, before: { read: before.canRead, write: before.canWrite }, after: { read: after.canRead, write: after.canWrite, discussion: after.canAccessDiscussion, manage: after.canManage } }));
  });
});

describe('offline authz proof - derive inaccessible project UUID', () => {
  it('own description update resolves guessed issue number across projects and returns private target UUID', async () => {
    vi.clearAllMocks();
    const { ResearchModel: realResearchModel } = await vi.importActual<any>('/home/cjy/polarcraft/server/src/models/research.model.ts');
    const ownProject: any = { id: 'own-project', owner_user_id: 'attacker', visibility: 'private', status: 'draft', description_zh: '' };
    mockResearchProjectsCollection.find.mockImplementation((filter: any) => {
      expect(filter).toEqual({ issue_number: { $in: [42] } });
      return { project: () => ({ toArray: async () => [{ id: 'private-target-uuid' }] }) };
    });
    mockResearchProjectsCollection.findOne.mockImplementation(async (filter: any) => filter.id === ownProject.id ? { ...ownProject } : null);
    mockResearchProjectsCollection.updateOne.mockImplementation(async (filter: any, update: any) => {
      expect(filter).toEqual({ id: ownProject.id });
      Object.assign(ownProject, update.$set);
      return { matchedCount: 1 };
    });
    mockResearchModel.getProjectById.mockImplementation(async (id: string) => id === ownProject.id ? { ...ownProject } : null);
    mockResearchModel.getActiveProjectMembership.mockImplementation(async (_id: string, userId: string) => userId === 'attacker' ? { user_id: 'attacker', active: true } : null);
    mockResearchModel.updateProject.mockImplementation((...args: any[]) => realResearchModel.updateProject(...args));
    mockProfileModel.getOrCreateProjectSettings.mockResolvedValue({ visibility: 'private', require_approval: true, is_recruiting: true });
    const response = createResponse();
    await invokeHandler(ResearchController.updateProject, { params: { id: ownProject.id }, user: { sub: 'attacker', role: 'user', username: 'attacker' }, body: { description_zh: '#42' } }, response);
    expect(response.error).not.toHaveBeenCalled();
    expect(response.success).toHaveBeenCalledWith(expect.objectContaining({ referenced_project_ids: ['private-target-uuid'] }), '项目更新成功');
    console.log(JSON.stringify({ proof: 'private UUID discovery', input: '#42', response: response.success.mock.calls[0][0] }));
  });
});
