/**
 * Profile Model
 * 个人资料数据模型
 */

import { query, queryOne } from "../database/connection.js";
import { generateId } from "../utils/crypto.util.js";
import { logger } from "../utils/logger.js";
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
} from "../types/profile.types.js";

/**
 * Profile Model Class
 * 个人资料模型类
 */
export class ProfileModel {
  // ============================================================
  // User Educations / 用户教育经历
  // ============================================================

  /**
   * Get all educations for a user
   * 获取用户的所有教育经历
   */
  static async getUserEducations(userId: string): Promise<UserEducation[]> {
    const sql = `
      SELECT *
      FROM user_educations
      WHERE user_id = ?
      ORDER BY start_date DESC, end_date DESC
    `;
    return await query(sql, [userId]);
  }

  /**
   * Get education by ID
   * 根据ID获取教育经历
   */
  static async getEducationById(educationId: string, userId: string): Promise<UserEducation | null> {
    const sql = `
      SELECT *
      FROM user_educations
      WHERE id = ? AND user_id = ?
    `;
    return await queryOne(sql, [educationId, userId]);
  }

  /**
   * Create education record
   * 创建教育经历
   */
  static async createEducation(userId: string, data: CreateEducationInput): Promise<string> {
    const id = generateId();

    // Convert YYYY-MM to YYYY-MM-01 for DATE field
    const startDate = `${data.start_date}-01`;
    const endDate = data.end_date ? `${data.end_date}-01` : null;
    const isCurrent = data.is_current ?? !data.end_date;

    const sql = `
      INSERT INTO user_educations (id, user_id, organization, major, start_date, end_date, is_current, degree_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      userId,
      data.organization,
      data.major,
      startDate,
      endDate,
      isCurrent,
      data.degree_level || null,
    ]);

    logger.info(`Education created: ${id} for user ${userId}`);
    return id;
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
    const fields: string[] = [];
    const params: any[] = [];

    if (data.organization !== undefined) {
      fields.push("organization = ?");
      params.push(data.organization);
    }

    if (data.major !== undefined) {
      fields.push("major = ?");
      params.push(data.major);
    }

    if (data.start_date !== undefined) {
      fields.push("start_date = ?");
      params.push(`${data.start_date}-01`);
    }

    if (data.end_date !== undefined) {
      fields.push("end_date = ?");
      params.push(data.end_date ? `${data.end_date}-01` : null);
    }

    if (data.is_current !== undefined) {
      fields.push("is_current = ?");
      params.push(data.is_current);
    }

    if (data.degree_level !== undefined) {
      fields.push("degree_level = ?");
      params.push(data.degree_level || null);
    }

    if (fields.length === 0) return false;

    params.push(educationId, userId);
    const sql = `UPDATE user_educations SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`;
    await query(sql, params);

    logger.info(`Education updated: ${educationId}`);
    return true;
  }

  /**
   * Delete education record
   * 删除教育经历
   */
  static async deleteEducation(educationId: string, userId: string): Promise<boolean> {
    const sql = "DELETE FROM user_educations WHERE id = ? AND user_id = ?";
    await query(sql, [educationId, userId]);
    logger.info(`Education deleted: ${educationId}`);
    return true;
  }

  // ============================================================
  // Project Settings / 项目设置
  // ============================================================

  /**
   * Get project settings
   * 获取项目设置
   */
  static async getProjectSettings(projectId: string): Promise<ProjectSettings | null> {
    const sql = `
      SELECT *
      FROM research_project_settings
      WHERE project_id = ?
    `;
    return await queryOne(sql, [projectId]);
  }

  /**
   * Create project settings
   * 创建项目设置
   */
  static async createProjectSettings(
    projectId: string,
    data: CreateProjectSettingsInput
  ): Promise<string> {
    const id = generateId();
    const sql = `
      INSERT INTO research_project_settings (
        id, project_id, visibility, require_approval, recruitment_requirements,
        max_members, recruitment_deadline, is_recruiting, contact_email, discussion_channel
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      projectId,
      data.visibility || "private",
      data.require_approval !== undefined ? data.require_approval : true,
      data.recruitment_requirements || null,
      data.max_members || null,
      data.recruitment_deadline || null,
      data.is_recruiting !== undefined ? data.is_recruiting : true,
      data.contact_email || null,
      data.discussion_channel || null,
    ]);

    logger.info(`Project settings created for project: ${projectId}`);
    return id;
  }

  /**
   * Update project settings
   * 更新项目设置
   */
  static async updateProjectSettings(
    projectId: string,
    data: UpdateProjectSettingsInput
  ): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    const updatable: (keyof UpdateProjectSettingsInput)[] = [
      "visibility",
      "require_approval",
      "recruitment_requirements",
      "max_members",
      "recruitment_deadline",
      "is_recruiting",
      "contact_email",
      "discussion_channel",
    ];

    for (const field of updatable) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (fields.length === 0) return false;

    params.push(projectId);
    const sql = `UPDATE research_project_settings SET ${fields.join(", ")} WHERE project_id = ?`;
    await query(sql, params);

    logger.info(`Project settings updated: ${projectId}`);
    return true;
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

  // ============================================================
  // Project Creator Profile / 项目创建者资料
  // ============================================================

  /**
   * Get creator profile for a project
   * 获取项目的创建者资料
   */
  static async getCreatorProfile(projectId: string, userId: string): Promise<ProjectCreatorProfile | null> {
    const sql = `
      SELECT *
      FROM research_project_creator_profiles
      WHERE project_id = ? AND user_id = ?
    `;
    return await queryOne(sql, [projectId, userId]);
  }

  /**
   * Get all creator profiles for a project
   * 获取项目的所有创建者资料
   */
  static async getProjectCreatorProfiles(projectId: string): Promise<ProjectCreatorProfile[]> {
    const sql = `
      SELECT cp.*, u.username
      FROM research_project_creator_profiles cp
      LEFT JOIN users u ON cp.user_id = u.id
      WHERE cp.project_id = ?
      ORDER BY cp.created_at
    `;
    return await query(sql, [projectId]);
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
    const id = generateId();
    const sql = `
      INSERT INTO research_project_creator_profiles (
        id, project_id, user_id, display_name, organization, education_id, major, grade
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      projectId,
      userId,
      data.display_name,
      data.organization,
      data.education_id || null,
      data.major || null,
      data.grade || null,
    ]);

    logger.info(`Creator profile created: ${id} for project ${projectId}`);
    return id;
  }

  // ============================================================
  // Project Applications / 项目申请
  // ============================================================

  /**
   * Get application by ID
   * 根据ID获取申请
   */
  static async getApplicationById(applicationId: string): Promise<ProjectApplication | null> {
    const sql = `
      SELECT a.*, u.username, u.avatar_url, p.name_zh as project_name
      FROM research_project_applications a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN research_projects p ON a.project_id = p.id
      WHERE a.id = ?
    `;
    return await queryOne(sql, [applicationId]);
  }

  /**
   * Get applications for a project
   * 获取项目的申请列表
   */
  static async getProjectApplications(projectId: string): Promise<ProjectApplication[]> {
    const sql = `
      SELECT a.*, u.username, u.avatar_url
      FROM research_project_applications a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.project_id = ?
      ORDER BY a.created_at DESC
    `;
    return await query(sql, [projectId]);
  }

  /**
   * Get user's applications
   * 获取用户的申请列表
   */
  static async getUserApplications(userId: string): Promise<ProjectApplication[]> {
    const sql = `
      SELECT a.*, p.name_zh as project_name
      FROM research_project_applications a
      LEFT JOIN research_projects p ON a.project_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `;
    return await query(sql, [userId]);
  }

  /**
   * Get pending application for user and project
   * 获取用户对项目的待处理申请
   */
  static async getPendingApplication(
    projectId: string,
    userId: string
  ): Promise<ProjectApplication | null> {
    const sql = `
      SELECT *
      FROM research_project_applications
      WHERE project_id = ? AND user_id = ? AND status = 'pending'
    `;
    return await queryOne(sql, [projectId, userId]);
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
    // Check if there's an existing application
    const existing = await this.getPendingApplication(projectId, userId);
    if (existing) {
      throw new Error("已经存在待处理的申请");
    }

    const id = generateId();
    const sql = `
      INSERT INTO research_project_applications (
        id, project_id, user_id, display_name, organization, education_id,
        major, grade, research_experience, expertise, motivation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      projectId,
      userId,
      data.display_name,
      data.organization,
      data.education_id || null,
      data.major || null,
      data.grade || null,
      data.research_experience || null,
      data.expertise || null,
      data.motivation || null,
    ]);

    logger.info(`Application created: ${id} for project ${projectId}`);
    return id;
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
    const sql = `
      UPDATE research_project_applications
      SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
      WHERE id = ?
    `;
    await query(sql, [status, reviewerId, reviewNotes || null, applicationId]);

    logger.info(`Application ${applicationId} status updated to ${status}`);
    return true;
  }

  /**
   * Withdraw application
   * 撤回申请
   */
  static async withdrawApplication(applicationId: string, userId: string): Promise<boolean> {
    const sql = `
      UPDATE research_project_applications
      SET status = 'withdrawn'
      WHERE id = ? AND user_id = ? AND status = 'pending'
    `;
    await query(sql, [applicationId, userId]);

    logger.info(`Application ${applicationId} withdrawn by user ${userId}`);
    return true;
  }

  // ============================================================
  // Public Projects / 公开项目
  // ============================================================

  /**
   * Get public projects
   * 获取公开项目列表
   */
  static async getPublicProjects(
    filters: { recruiting?: boolean; search?: string } = {},
    userId?: string
  ): Promise<any[]> {
    let sql = `
      SELECT
        p.*,
        ps.visibility,
        ps.require_approval,
        ps.recruitment_requirements,
        ps.is_recruiting,
        ps.max_members,
        COUNT(DISTINCT pm.user_id) as member_count,
        ${userId ? `EXISTS(
          SELECT 1 FROM research_project_members pm_check
          WHERE pm_check.project_id = p.id AND pm_check.user_id = ?
        )` : 'FALSE'} as is_member,
        MAX(owner.username) as owner_username,
        MAX(owner.avatar_url) as owner_avatar_url,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'username', m_user.username,
              'avatar_url', m_user.avatar_url,
              'role', m_pm.role
            )
          )
          FROM research_project_members m_pm
          JOIN users m_user ON m_pm.user_id = m_user.id
          WHERE m_pm.project_id = p.id
        ) as members
      FROM research_projects p
      INNER JOIN research_project_settings ps ON p.id = ps.project_id
      LEFT JOIN research_project_members pm ON p.id = pm.project_id
      LEFT JOIN research_project_members owner_pm ON p.id = owner_pm.project_id AND owner_pm.role = 'owner'
      LEFT JOIN users owner ON owner_pm.user_id = owner.id
      WHERE ps.visibility = 'public' AND p.status IN ('draft', 'active')
    `;
    const params: any[] = [];

    // Add userId param first if exists (for the is_member subquery)
    if (userId) {
      params.push(userId);
    }

    if (filters.recruiting !== undefined) {
      sql += " AND ps.is_recruiting = ?";
      params.push(filters.recruiting);
    }

    if (filters.search) {
      sql += " AND (p.name_zh LIKE ? OR p.name_en LIKE ? OR p.description_zh LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += " GROUP BY p.id ORDER BY p.updated_at DESC";

    return await query(sql, params);
  }
}
