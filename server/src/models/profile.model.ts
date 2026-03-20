/**
 * Profile Model
 * 个人资料数据模型
 */

import { getCollection } from '../database/connection.js';
import {
  compareRole,
  escapeRegExp,
  normalizeDocument,
  normalizeDocuments,
  pickDefined,
} from '../database/mongo.util.js';
import { generateId } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';
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

async function getUserMap(userIds: string[]): Promise<Map<string, { username: string; avatar_url: string | null }>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const users = normalizeDocuments<{ id: string; username: string; avatar_url: string | null }>(
    await usersCollection()
      .find({ id: { $in: [...new Set(userIds)] } })
      .project({ _id: 0, id: 1, username: 1, avatar_url: 1 })
      .toArray()
  );

  return new Map(users.map((user) => [user.id, { username: user.username, avatar_url: user.avatar_url }]));
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
    getUserMap(applications.map((application) => application.user_id)),
    getProjectNameMap(applications.map((application) => application.project_id)),
  ]);

  return applications.map((application) => {
    const user = userMap.get(application.user_id);
    return {
      ...application,
      username: user?.username,
      avatar_url: user?.avatar_url,
      project_name: projectNameMap.get(application.project_id),
    };
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

    const userMap = await getUserMap(profiles.map((profile) => profile.user_id));

    return profiles.map((profile) => ({
      ...profile,
      username: userMap.get(profile.user_id)?.username,
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
    const profile: ProjectCreatorProfile = {
      id: generateId(),
      project_id: projectId,
      user_id: userId,
      display_name: data.display_name,
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
    const existing = await applicationsCollection().findOne({ project_id: projectId, user_id: userId });
    if (existing) {
      throw new Error('已经存在待处理的申请');
    }

    const now = new Date();
    const application: ProjectApplication = {
      id: generateId(),
      project_id: projectId,
      user_id: userId,
      display_name: data.display_name,
      organization: data.organization,
      education_id: data.education_id || null,
      major: data.major || null,
      grade: data.grade || null,
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

    await applicationsCollection().insertOne(application as unknown as Record<string, unknown>);

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
      { id: applicationId },
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
    filters: { recruiting?: boolean; search?: string } = {},
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
    const projectFilter: Record<string, unknown> = {
      id: { $in: projectIds },
      status: { $in: ['draft', 'active'] },
    };

    if (filters.search) {
      const regex = new RegExp(escapeRegExp(filters.search), 'i');
      projectFilter.$or = [
        { name_zh: regex },
        { name_en: regex },
        { description_zh: regex },
      ];
    }

    const projects = normalizeDocuments<any>(
      await researchProjectsCollection().find(projectFilter).sort({ updated_at: -1 }).toArray()
    );
    if (projects.length === 0) {
      return [];
    }

    const visibleProjectIds = projects.map((project) => project.id);
    const members = normalizeDocuments<any>(
      await projectMembersCollection().find({ project_id: { $in: visibleProjectIds } }).toArray()
    );
    const userMap = await getUserMap(members.map((member) => member.user_id));

    const settingsMap = new Map(settings.map((item) => [item.project_id, item]));
    const membersByProject = new Map<string, any[]>();

    for (const member of members) {
      const list = membersByProject.get(member.project_id) || [];
      list.push(member);
      membersByProject.set(member.project_id, list);
    }

    return projects.map((project) => {
      const setting = settingsMap.get(project.id);
      const projectMembers = (membersByProject.get(project.id) || []).sort((a, b) => {
        const roleCompare = compareRole(a.role, b.role);
        if (roleCompare !== 0) {
          return roleCompare;
        }
        return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
      });
      const owner = projectMembers.find((member) => member.role === 'owner');
      const ownerUser = owner ? userMap.get(owner.user_id) : undefined;

      return {
        ...project,
        visibility: setting?.visibility,
        require_approval: setting?.require_approval,
        recruitment_requirements: setting?.recruitment_requirements,
        is_recruiting: setting?.is_recruiting,
        max_members: setting?.max_members,
        member_count: projectMembers.length,
        is_member: userId ? projectMembers.some((member) => member.user_id === userId) : false,
        owner_username: ownerUser?.username || null,
        owner_avatar_url: ownerUser?.avatar_url || null,
        members: projectMembers.map((member) => ({
          username: userMap.get(member.user_id)?.username || '',
          avatar_url: userMap.get(member.user_id)?.avatar_url || null,
          role: member.role,
        })),
      };
    });
  }

  /**
   * Get a single public project by ID
   * 获取单个公开项目详情
   */
  static async getPublicProjectById(projectId: string, userId?: string): Promise<any | null> {
    const projects = await this.getPublicProjects({}, userId);
    return projects.find((project) => project.id === projectId) || null;
  }
}
