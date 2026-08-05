/**
 * Profile Model
 * 个人资料数据模型
 */

import { getCollection } from '../database/connection.js';
import {
  escapeRegExp,
  normalizeDocument,
  normalizeDocuments,
  pickDefined,
} from '../database/mongo.util.js';
import { generateId } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';
import {
  buildActiveMembershipFilter,
  compareMembersByRoleThenJoinedAt,
  normalizeProjectRole,
} from './research-membership.util.js';
import { getProjectCoverImageMap } from './research-cover.util.js';
import { decorateResearchProject } from './research-project.util.js';
import { getUserIdentityMap, type UserIdentity } from './user-identity.util.js';
import {
  UserEducation,
  CreateEducationInput,
  UpdateEducationInput,
  ProjectSettings,
  CreateProjectSettingsInput,
  UpdateProjectSettingsInput,
  ProjectCreatorProfile,
  CreateCreatorProfileInput,
  ProjectApplication,
  CreateApplicationInput,
  ApplicationStatus,
} from '../types/profile.types.js';

const educationsCollection = () => getCollection('user_educations');
const projectSettingsCollection = () => getCollection('research_project_settings');
const creatorProfilesCollection = () => getCollection('research_project_creator_profiles');
const applicationsCollection = () => getCollection('research_project_applications');
const usersCollection = () => getCollection('users');
const projectMembersCollection = () => getCollection('research_project_members');
const researchProjectsCollection = () => getCollection('research_projects');

const clean = (value?: string | null): string => (typeof value === 'string' ? value.trim() : '');

async function resolveUserDisplayName(userId: string, fallback?: string): Promise<string> {
  const user = normalizeDocument<Pick<UserIdentity, 'username' | 'real_name' | 'show_real_name_publicly'>>(
    await usersCollection().findOne(
      { id: userId },
      { projection: { _id: 0, username: 1, real_name: 1, show_real_name_publicly: 1 } }
    )
  );
  const publicName = clean(user?.username);
  const realName = user?.show_real_name_publicly === true ? clean(user?.real_name) : '';

  return publicName && realName && publicName !== realName
    ? `${publicName}（${realName}）`
    : publicName || clean(fallback) || '用户';
}

async function getProjectNameMap(projectIds: string[]): Promise<Map<string, string | undefined>> {
  if (projectIds.length === 0) {
    return new Map();
  }

  const projects = normalizeDocuments<{ id: string; name_zh: string | null }>(
    await researchProjectsCollection()
      .find({ id: { $in: [...new Set(projectIds)] } })
      .project({ _id: 0, id: 1, name_zh: 1 })
      .toArray()
  );

  return new Map(projects.map((project) => [project.id, project.name_zh || undefined]));
}

async function enrichApplications(applications: ProjectApplication[]): Promise<ProjectApplication[]> {
  if (applications.length === 0) {
    return [];
  }

  const [userMap, projectNameMap] = await Promise.all([
    getUserIdentityMap(applications.map((application) => application.user_id)),
    getProjectNameMap(applications.map((application) => application.project_id)),
  ]);

  return applications.map((application) => {
    const user = userMap.get(application.user_id);
    return {
      ...application,
      username: user?.username,
      nickname: user?.nickname ?? null,
      real_name: user?.real_name ?? null,
      show_real_name_publicly: user?.show_real_name_publicly ?? false,
      avatar_url: user?.avatar_url,
      project_name: projectNameMap.get(application.project_id),
    };
  });
}

async function enrichPublicProjects(
  projects: any[],
  settings: ProjectSettings[],
  userId?: string
): Promise<any[]> {
  if (projects.length === 0) {
    return [];
  }

  const visibleProjectIds = projects.map((project) => project.id);
  const [members, pendingApplications, coverMap] = await Promise.all([
    normalizeDocuments<any>(
      await projectMembersCollection().find(buildActiveMembershipFilter({ project_id: { $in: visibleProjectIds } })).toArray()
    ),
    userId
      ? normalizeDocuments<{ project_id: string }>(
          await applicationsCollection()
            .find({ project_id: { $in: visibleProjectIds }, user_id: userId, status: 'pending' })
            .project({ _id: 0, project_id: 1 })
            .toArray()
        )
      : Promise.resolve([] as { project_id: string }[]),
    getProjectCoverImageMap(visibleProjectIds),
  ]);
  const userMap = await getUserIdentityMap(members.map((member) => member.user_id));

  const settingsMap = new Map(settings.map((item) => [item.project_id, item]));
  const membersByProject = new Map<string, any[]>();
  const pendingProjectIds = new Set(pendingApplications.map((application) => application.project_id));

  for (const member of members) {
    const list = membersByProject.get(member.project_id) || [];
    list.push(member);
    membersByProject.set(member.project_id, list);
  }

  return projects.map((project) => {
    const setting = settingsMap.get(project.id);
    const storedProjectMembers = membersByProject.get(project.id) || [];
    const legacyOwnerIds = storedProjectMembers
      .filter((member) => member.role === 'owner')
      .map((member) => member.user_id);
    const ownerUserId = typeof project.owner_user_id === 'string' && project.owner_user_id
      ? project.owner_user_id
      : legacyOwnerIds.length === 1 ? legacyOwnerIds[0] : null;
    const projectMembers = storedProjectMembers
      .map((member) => ({
        ...member,
        role: ownerUserId === member.user_id ? 'owner' : 'member',
      }))
      .sort(compareMembersByRoleThenJoinedAt);
    const owner = ownerUserId
      ? projectMembers.find((member) => member.user_id === ownerUserId)
      : undefined;
    const ownerUser = owner ? userMap.get(owner.user_id) : undefined;
    const {
      owner_user_id: _ownerUserId,
      pending_leadership_transfer: _pendingLeadershipTransfer,
      ...publicProject
    } = project;

    return decorateResearchProject({
      ...publicProject,
      cover_image: coverMap.get(project.id) ?? null,
      visibility: setting?.visibility,
      require_approval: setting?.require_approval,
      recruitment_requirements: setting?.recruitment_requirements,
      is_recruiting: setting?.is_recruiting,
      max_members: setting?.max_members,
      member_count: projectMembers.length,
      is_member: userId ? projectMembers.some((member) => member.user_id === userId) : false,
      has_pending_application: userId ? pendingProjectIds.has(project.id) : false,
      owner_username: ownerUser?.username || null,
      owner_nickname: ownerUser?.nickname ?? null,
      owner_real_name: ownerUser?.real_name ?? null,
      owner_show_real_name_publicly: ownerUser?.show_real_name_publicly ?? false,
      owner_avatar_url: ownerUser?.avatar_url || null,
      members: projectMembers.map((member) => ({
        username: userMap.get(member.user_id)?.username || '',
        nickname: userMap.get(member.user_id)?.nickname ?? null,
        real_name: userMap.get(member.user_id)?.real_name ?? null,
        show_real_name_publicly: userMap.get(member.user_id)?.show_real_name_publicly ?? false,
        avatar_url: userMap.get(member.user_id)?.avatar_url || null,
        role: normalizeProjectRole(member.role) ?? 'member',
        member_role_label: member.member_role_label ?? null,
      })),
    });
  });
}

export class ProfileModel {
  /**
   * Get all educations for a user
   * 获取用户的所有教育经历
   */
  static async getUserEducations(userId: string): Promise<UserEducation[]> {
    const educations = normalizeDocuments<UserEducation>(
      await educationsCollection().find({ user_id: userId }).toArray()
    );

    return educations.sort(
      (a, b) =>
        b.start_date.localeCompare(a.start_date) ||
        (b.end_date ?? '').localeCompare(a.end_date ?? '')
    );
  }

  /**
   * Get education by ID
   * 根据ID获取教育经历
   */
  static async getEducationById(educationId: string, userId: string): Promise<UserEducation | null> {
    return normalizeDocument<UserEducation>(
      await educationsCollection().findOne({ id: educationId, user_id: userId })
    );
  }

  /**
   * Create education record
   * 创建教育经历
   */
  static async createEducation(userId: string, data: CreateEducationInput): Promise<string> {
    const now = new Date();
    const education: UserEducation = {
      id: generateId(),
      user_id: userId,
      organization: data.organization,
      major: data.major,
      start_date: `${data.start_date}-01`,
      end_date: data.end_date ? `${data.end_date}-01` : null,
      is_current: data.is_current ?? !data.end_date,
      degree_level: data.degree_level || null,
      created_at: now,
      updated_at: now,
    };

    await educationsCollection().insertOne(education as unknown as Record<string, unknown>);

    logger.info(`Education created: ${education.id} for user ${userId}`);
    return education.id;
  }

  /**
   * Update education record
   * 更新教育经历
   */
  static async updateEducation(
    educationId: string,
    userId: string,
    data: UpdateEducationInput
  ): Promise<boolean> {
    const updateDoc = pickDefined({
      organization: data.organization,
      major: data.major,
      start_date: data.start_date ? `${data.start_date}-01` : undefined,
      end_date: data.end_date !== undefined ? (data.end_date ? `${data.end_date}-01` : null) : undefined,
      is_current: data.is_current,
      degree_level: data.degree_level !== undefined ? data.degree_level || null : undefined,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const result = await educationsCollection().updateOne(
      { id: educationId, user_id: userId },
      { $set: { ...updateDoc, updated_at: new Date() } }
    );

    logger.info(`Education updated: ${educationId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete education record
   * 删除教育经历
   */
  static async deleteEducation(educationId: string, userId: string): Promise<boolean> {
    const result = await educationsCollection().deleteOne({ id: educationId, user_id: userId });
    logger.info(`Education deleted: ${educationId}`);
    return result.deletedCount > 0;
  }

  /**
   * Get project settings
   * 获取项目设置
   */
  static async getProjectSettings(projectId: string): Promise<ProjectSettings | null> {
    return normalizeDocument<ProjectSettings>(
      await projectSettingsCollection().findOne({ project_id: projectId })
    );
  }

  /**
   * Create project settings
   * 创建项目设置
   */
  static async createProjectSettings(
    projectId: string,
    data: CreateProjectSettingsInput
  ): Promise<string> {
    const now = new Date();
    const settings: ProjectSettings = {
      id: generateId(),
      project_id: projectId,
      visibility: data.visibility || 'private',
      require_approval: data.require_approval !== undefined ? data.require_approval : true,
      recruitment_requirements: data.recruitment_requirements || null,
      max_members: data.max_members || null,
      recruitment_deadline: data.recruitment_deadline || null,
      is_recruiting: data.is_recruiting !== undefined ? data.is_recruiting : true,
      contact_email: data.contact_email || null,
      discussion_channel: data.discussion_channel || null,
      created_at: now,
      updated_at: now,
    } as ProjectSettings;

    await projectSettingsCollection().insertOne(settings as unknown as Record<string, unknown>);

    logger.info(`Project settings created for project: ${projectId}`);
    return settings.id;
  }

  /**
   * Update project settings
   * 更新项目设置
   */
  static async updateProjectSettings(
    projectId: string,
    data: UpdateProjectSettingsInput
  ): Promise<boolean> {
    const updateDoc = pickDefined({
      visibility: data.visibility,
      require_approval: data.require_approval,
      recruitment_requirements: data.recruitment_requirements,
      max_members: data.max_members,
      recruitment_deadline: data.recruitment_deadline,
      is_recruiting: data.is_recruiting,
      contact_email: data.contact_email,
      discussion_channel: data.discussion_channel,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const result = await projectSettingsCollection().updateOne(
      { project_id: projectId },
      { $set: { ...updateDoc, updated_at: new Date() } }
    );

    logger.info(`Project settings updated: ${projectId}`);
    return result.matchedCount > 0;
  }

  /**
   * Get or create project settings
   * 获取或创建项目设置
   */
  static async getOrCreateProjectSettings(projectId: string): Promise<ProjectSettings> {
    let settings = await this.getProjectSettings(projectId);
    if (!settings) {
      await this.createProjectSettings(projectId, {});
      settings = await this.getProjectSettings(projectId);
    }
    return settings!;
  }

  /**
   * Get creator profile for a project
   * 获取项目的创建者资料
   */
  static async getCreatorProfile(projectId: string, userId: string): Promise<ProjectCreatorProfile | null> {
    return normalizeDocument<ProjectCreatorProfile>(
      await creatorProfilesCollection().findOne({ project_id: projectId, user_id: userId })
    );
  }

  /**
   * Get all creator profiles for a project
   * 获取项目的所有创建者资料
   */
  static async getProjectCreatorProfiles(projectId: string): Promise<ProjectCreatorProfile[]> {
    const profiles = normalizeDocuments<ProjectCreatorProfile>(
      await creatorProfilesCollection()
        .find({ project_id: projectId })
        .sort({ created_at: 1 })
        .toArray()
    );

    const userMap = await getUserIdentityMap(profiles.map((profile) => profile.user_id));

    return profiles.map((profile) => ({
      ...profile,
      username: userMap.get(profile.user_id)?.username,
      nickname: userMap.get(profile.user_id)?.nickname ?? null,
      real_name: userMap.get(profile.user_id)?.real_name ?? null,
      show_real_name_publicly: userMap.get(profile.user_id)?.show_real_name_publicly ?? false,
    }));
  }

  /**
   * Create creator profile
   * 创建创建者资料
   */
  static async createCreatorProfile(
    projectId: string,
    userId: string,
    data: CreateCreatorProfileInput
  ): Promise<string> {
    const now = new Date();
    const displayName = await resolveUserDisplayName(userId, data.display_name);
    const profile: ProjectCreatorProfile = {
      id: generateId(),
      project_id: projectId,
      user_id: userId,
      display_name: displayName,
      organization: data.organization,
      education_id: data.education_id || null,
      major: data.major || null,
      grade: data.grade || null,
      created_at: now,
      updated_at: now,
    };

    await creatorProfilesCollection().insertOne(profile as unknown as Record<string, unknown>);

    logger.info(`Creator profile created: ${profile.id} for project ${projectId}`);
    return profile.id;
  }

  /**
   * Get application by ID
   * 根据ID获取申请
   */
  static async getApplicationById(applicationId: string): Promise<ProjectApplication | null> {
    const application = normalizeDocument<ProjectApplication>(
      await applicationsCollection().findOne({ id: applicationId })
    );

    if (!application) {
      return null;
    }

    const [enriched] = await enrichApplications([application]);
    return enriched || null;
  }

  /**
   * Get applications for a project
   * 获取项目的申请列表
   */
  static async getProjectApplications(projectId: string): Promise<ProjectApplication[]> {
    const applications = normalizeDocuments<ProjectApplication>(
      await applicationsCollection()
        .find({ project_id: projectId })
        .sort({ created_at: -1 })
        .toArray()
    );

    return enrichApplications(applications);
  }

  /**
   * Get user's applications
   * 获取用户的申请列表
   */
  static async getUserApplications(userId: string): Promise<ProjectApplication[]> {
    const applications = normalizeDocuments<ProjectApplication>(
      await applicationsCollection()
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .toArray()
    );

    return enrichApplications(applications);
  }

  /**
   * Get user's active project memberships with project names
   * 获取用户的有效课题组成员关系（含课题名称）
   */
  static async getUserMemberships(
    userId: string
  ): Promise<Array<{
    project_id: string;
    project_name: string | null;
    role: 'owner' | 'member';
    joined_at: Date | string | null;
  }>> {
    const memberships = normalizeDocuments<{
      project_id: string;
      role?: string | null;
      joined_at?: Date | string | null;
    }>(
      await projectMembersCollection()
        .find(buildActiveMembershipFilter({ user_id: userId }))
        .project({ _id: 0, project_id: 1, role: 1, joined_at: 1 })
        .toArray()
    );

    if (memberships.length === 0) {
      return [];
    }

    const projectIds = [...new Set(memberships.map((membership) => membership.project_id))];
    const [projects, legacyOwners] = await Promise.all([
      normalizeDocuments<{ id: string; name_zh?: string | null; owner_user_id?: string | null }>(
        await researchProjectsCollection()
          .find({ id: { $in: projectIds } })
          .project({ _id: 0, id: 1, name_zh: 1, owner_user_id: 1 })
          .toArray()
      ),
      normalizeDocuments<{ project_id: string; user_id: string }>(
        await projectMembersCollection()
          .find(buildActiveMembershipFilter({ project_id: { $in: projectIds }, role: 'owner' }))
          .project({ _id: 0, project_id: 1, user_id: 1 })
          .toArray()
      ),
    ]);
    const projectMap = new Map(projects.map((project) => [project.id, project]));
    const legacyOwnerIdsByProject = new Map<string, string[]>();
    for (const owner of legacyOwners) {
      const ownerIds = legacyOwnerIdsByProject.get(owner.project_id) ?? [];
      ownerIds.push(owner.user_id);
      legacyOwnerIdsByProject.set(owner.project_id, ownerIds);
    }

    return memberships.map((membership) => ({
      project_id: membership.project_id,
      project_name: projectMap.get(membership.project_id)?.name_zh ?? null,
      role: (
        projectMap.get(membership.project_id)?.owner_user_id
        || (legacyOwnerIdsByProject.get(membership.project_id)?.length === 1
          ? legacyOwnerIdsByProject.get(membership.project_id)?.[0]
          : null)
      ) === userId ? 'owner' : 'member',
      joined_at: membership.joined_at ?? null,
    }));
  }

  /**
   * Get pending application for user and project
   * 获取用户对项目的待处理申请
   */
  static async getPendingApplication(
    projectId: string,
    userId: string
  ): Promise<ProjectApplication | null> {
    return normalizeDocument<ProjectApplication>(
      await applicationsCollection().findOne({
        project_id: projectId,
        user_id: userId,
        status: 'pending',
      })
    );
  }

  /**
   * Create application
   * 创建申请
   */
  static async createApplication(
    projectId: string,
    userId: string,
    data: CreateApplicationInput
  ): Promise<string> {
    const pendingApplication = await this.getPendingApplication(projectId, userId);
    if (pendingApplication) {
      throw new Error('已经存在待处理的申请');
    }

    const now = new Date();
    const displayName = await resolveUserDisplayName(userId, data.display_name);
    const existingApplication = normalizeDocument<ProjectApplication>(
      await applicationsCollection().findOne({ project_id: projectId, user_id: userId })
    );
    const application: ProjectApplication = {
      id: existingApplication?.id || generateId(),
      project_id: projectId,
      user_id: userId,
      display_name: displayName,
      organization: data.organization,
      education_id: data.education_id || null,
      major: data.major || null,
      grade: data.grade || null,
      desired_role: data.desired_role.trim(),
      proposed_contribution: data.proposed_contribution.trim(),
      weekly_time_commitment: data.weekly_time_commitment.trim(),
      research_experience: data.research_experience || null,
      expertise: data.expertise || null,
      motivation: data.motivation || null,
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      created_at: now,
      updated_at: now,
    };

    if (existingApplication) {
      await applicationsCollection().updateOne(
        { id: existingApplication.id },
        {
          $set: {
            display_name: application.display_name,
            organization: application.organization,
            education_id: application.education_id,
            major: application.major,
            grade: application.grade,
            desired_role: application.desired_role,
            proposed_contribution: application.proposed_contribution,
            weekly_time_commitment: application.weekly_time_commitment,
            research_experience: application.research_experience,
            expertise: application.expertise,
            motivation: application.motivation,
            status: 'pending',
            reviewed_by: null,
            reviewed_at: null,
            review_notes: null,
            created_at: now,
            updated_at: now,
          },
        }
      );
    } else {
      await applicationsCollection().insertOne(application as unknown as Record<string, unknown>);
    }

    logger.info(`Application created: ${application.id} for project ${projectId}`);
    return application.id;
  }

  /**
   * Update application status
   * 更新申请状态
   */
  static async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    reviewerId: string,
    reviewNotes?: string
  ): Promise<boolean> {
    const result = await applicationsCollection().updateOne(
      { id: applicationId, status: 'pending' },
      {
        $set: {
          status,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          review_notes: reviewNotes || null,
          updated_at: new Date(),
        },
      }
    );

    logger.info(`Application ${applicationId} status updated to ${status}`);
    return result.matchedCount > 0;
  }

  /**
   * Withdraw application
   * 撤回申请
   */
  static async withdrawApplication(applicationId: string, userId: string): Promise<boolean> {
    const result = await applicationsCollection().updateOne(
      { id: applicationId, user_id: userId, status: 'pending' },
      {
        $set: {
          status: 'withdrawn',
          updated_at: new Date(),
        },
      }
    );

    logger.info(`Application ${applicationId} withdrawn by user ${userId}`);
    return result.matchedCount > 0;
  }

  /**
   * Get public projects
   * 获取公开项目列表
   */
  static async getPublicProjects(
    filters: {
      recruiting?: boolean;
      search?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
    userId?: string
  ): Promise<any[]> {
    const settingsFilter: Record<string, unknown> = { visibility: 'public' };
    if (filters.recruiting !== undefined) {
      settingsFilter.is_recruiting = filters.recruiting;
    }

    const settings = normalizeDocuments<ProjectSettings>(
      await projectSettingsCollection().find(settingsFilter).toArray()
    );
    if (settings.length === 0) {
      return [];
    }

    const projectIds = settings.map((item) => item.project_id);
    const projectFilter: Record<string, unknown> = { id: { $in: projectIds } };

    if (filters.status) {
      projectFilter.status = filters.status;
    }

    if (filters.search) {
      const regex = new RegExp(escapeRegExp(filters.search), 'i');
      projectFilter.$or = [
        { name_zh: regex },
        { name_en: regex },
        { description_zh: regex },
      ];
    }

    let projectsQuery = researchProjectsCollection().find(projectFilter).sort({ updated_at: -1 });
    if (filters.offset !== undefined && filters.offset > 0) {
      projectsQuery = projectsQuery.skip(Math.floor(filters.offset));
    }
    if (filters.limit !== undefined && filters.limit > 0) {
      projectsQuery = projectsQuery.limit(Math.floor(filters.limit));
    }

    const projects = normalizeDocuments<any>(await projectsQuery.toArray());
    if (projects.length === 0) {
      return [];
    }

    return enrichPublicProjects(projects, settings, userId);
  }

  /**
   * Get a single public project by ID
   * 获取单个公开项目详情
   */
  static async getPublicProjectById(projectId: string, userId?: string): Promise<any | null> {
    const setting = normalizeDocument<ProjectSettings>(
      await projectSettingsCollection().findOne({ project_id: projectId, visibility: 'public' })
    );
    if (!setting) {
      return null;
    }

    const project = normalizeDocument<any>(
      await researchProjectsCollection().findOne({ id: projectId })
    );
    if (!project) {
      return null;
    }

    const [enrichedProject] = await enrichPublicProjects([project], [setting], userId);
    return enrichedProject ?? null;
  }
}
