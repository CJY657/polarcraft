/**
 * Project Access & Visibility Service
 * 课题访问与可见性策略
 *
 * Single authority for research-project access policy (who can read / write /
 * manage / join discussions) and for project visibility writes, including the
 * legacy `research_projects.is_public` compatibility sync. HTTP controllers
 * and upload-route authorizers stay thin adapters over this module: they map
 * decisions to responses but never derive permissions or dual-write
 * visibility themselves.
 */

import { ResearchModel, type ResearchProjectRole } from '../models/research.model.js';
import { ProfileModel } from '../models/profile.model.js';
import type {
  CreateProjectSettingsInput,
  ProjectVisibility,
  UpdateProjectSettingsInput,
} from '../types/profile.types.js';

export type ProjectAccessLevel = 'read' | 'write' | 'manage' | 'discussion';

export interface ResearchProjectAccess {
  project: any | null;
  membership: any | null;
  role: ResearchProjectRole | null;
  isAdmin: boolean;
  isMember: boolean;
  canRead: boolean;
  canWrite: boolean;
  canManage: boolean;
  canAccessDiscussion: boolean;
  canModerate: boolean;
}

export class ProjectAccessService {
  /**
   * Resolve the authoritative access decision for a user on a project.
   * 计算用户对课题的访问权限（唯一策略入口）。
   */
  static async getProjectAccess(
    projectId: string,
    userId?: string,
    userRole: 'user' | 'admin' = 'user'
  ): Promise<ResearchProjectAccess> {
    const project = await ResearchModel.getProjectById(projectId);
    if (!project) {
      return {
        project: null,
        membership: null,
        role: null,
        isAdmin: false,
        isMember: false,
        canRead: false,
        canWrite: false,
        canManage: false,
        canAccessDiscussion: false,
        canModerate: false,
      };
    }

    const membership = userId
      ? await ResearchModel.getActiveProjectMembership(projectId, userId)
      : null;
    const role = membership?.role ?? null;
    const isMember = Boolean(membership);
    const isAdmin = userRole === 'admin';

    return {
      project,
      membership,
      role,
      isAdmin,
      isMember,
      canRead: isAdmin || isMember || project.visibility === 'public',
      canWrite: isAdmin || isMember,
      canManage: isAdmin || role === 'owner',
      canAccessDiscussion: isAdmin || isMember,
      canModerate: isAdmin || role === 'owner',
    };
  }

  /**
   * Map a required access level onto an access decision.
   * 判断访问结果是否满足所需权限级别。
   */
  static hasPermission(access: ResearchProjectAccess, level: ProjectAccessLevel): boolean {
    return {
      read: access.canRead,
      write: access.canWrite,
      manage: access.canManage,
      discussion: access.canAccessDiscussion,
    }[level];
  }

  /**
   * Create the initial settings document for a freshly created project.
   * 为新建课题创建初始设置（可见性等）。
   */
  static async initializeProjectSettings(
    projectId: string,
    settings: CreateProjectSettingsInput
  ): Promise<void> {
    await ProfileModel.createProjectSettings(projectId, settings);
  }

  /**
   * Set project visibility, keeping the legacy `is_public` flag in sync.
   * 更新课题可见性，并同步遗留的 is_public 字段（兼容写入仅在此模块内发生）。
   */
  static async setProjectVisibility(projectId: string, visibility: ProjectVisibility): Promise<void> {
    await ProfileModel.updateProjectSettings(projectId, { visibility });
    await ResearchModel.setLegacyProjectVisibility(projectId, visibility === 'public');
  }

  /**
   * Apply a settings patch; if visibility is (or stays) involved, re-sync the
   * legacy `is_public` flag to whatever visibility results from the patch.
   * 应用课题设置更新，并按最终可见性同步遗留 is_public 字段。
   */
  static async applyProjectSettings(
    projectId: string,
    patch: UpdateProjectSettingsInput
  ): Promise<void> {
    const currentSettings = await ProfileModel.getOrCreateProjectSettings(projectId);
    const nextVisibility = patch.visibility ?? currentSettings.visibility;
    await ProfileModel.updateProjectSettings(projectId, patch);
    await ResearchModel.setLegacyProjectVisibility(projectId, nextVisibility === 'public');
  }
}
