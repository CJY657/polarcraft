/**
 * Profile Controller
 * 个人资料控制器
 */

import { Request, Response } from "express";
import { ProfileModel } from "../models/profile.model.js";
import { ResearchModel } from "../models/research.model.js";
import { logger } from "../utils/logger.js";

/**
 * Resolve the authenticated user id, or emit the shared 401 and return null.
 * 返回已认证用户 ID，未认证时返回统一的 401 响应
 */
function getAuthenticatedUserId(req: Request, res: Response): string | null {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "未授权" },
    });
    return null;
  }
  return userId;
}

/**
 * Log and emit the shared 500 SERVER_ERROR response with a per-endpoint message.
 * 记录错误并返回统一的 500 响应（消息按接口区分）
 */
function sendServerError(res: Response, error: unknown, logLabel: string, message: string): void {
  logger.error(logLabel, error);
  res.status(500).json({
    success: false,
    error: { code: "SERVER_ERROR", message },
  });
}

/**
 * Profile Controller Class
 * 个人资料控制器类
 */
export class ProfileController {
  // ============================================================
  // User Educations / 用户教育经历
  // ============================================================

  /**
   * Get user's education records
   * 获取用户的教育经历
   * GET /api/profile/educations
   */
  static async getUserEducations(req: Request, res: Response): Promise<void> {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) {
        return;
      }

      const educations = await ProfileModel.getUserEducations(userId);
      res.json({ success: true, data: educations });
    } catch (error) {
      sendServerError(res, error, "Get educations error:", "获取教育经历失败");
    }
  }

  /**
   * Create education record
   * 创建教育经历
   * POST /api/profile/educations
   */
  static async createEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) {
        return;
      }

      const { organization, major, start_date, end_date, is_current, degree_level } = req.body;

      if (!organization || !major || !start_date) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "单位、专业和开始时间为必填项" },
        });
        return;
      }

      const educationId = await ProfileModel.createEducation(userId, {
        organization,
        major,
        start_date,
        end_date,
        is_current,
        degree_level,
      });

      const education = await ProfileModel.getEducationById(educationId, userId);
      res.status(201).json({ success: true, data: education });
    } catch (error) {
      sendServerError(res, error, "Create education error:", "创建教育经历失败");
    }
  }

  /**
   * Update education record
   * 更新教育经历
   * PUT /api/profile/educations/:id
   */
  static async updateEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = getAuthenticatedUserId(req, res);
      const { id } = req.params;

      if (!userId) {
        return;
      }

      const existing = await ProfileModel.getEducationById(id, userId);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "教育经历不存在" },
        });
        return;
      }

      await ProfileModel.updateEducation(id, userId, req.body);
      const updated = await ProfileModel.getEducationById(id, userId);
      res.json({ success: true, data: updated });
    } catch (error) {
      sendServerError(res, error, "Update education error:", "更新教育经历失败");
    }
  }

  /**
   * Delete education record
   * 删除教育经历
   * DELETE /api/profile/educations/:id
   */
  static async deleteEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = getAuthenticatedUserId(req, res);
      const { id } = req.params;

      if (!userId) {
        return;
      }

      const existing = await ProfileModel.getEducationById(id, userId);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "教育经历不存在" },
        });
        return;
      }

      await ProfileModel.deleteEducation(id, userId);
      res.json({ success: true, message: "删除成功" });
    } catch (error) {
      sendServerError(res, error, "Delete education error:", "删除教育经历失败");
    }
  }

  // ============================================================
  // User Applications / 用户申请
  // ============================================================

  /**
   * Get user's applications
   * 获取用户的申请列表
   * GET /api/profile/applications
   */
  static async getUserApplications(req: Request, res: Response): Promise<void> {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) {
        return;
      }

      const applications = await ProfileModel.getUserApplications(userId);
      res.json({ success: true, data: applications });
    } catch (error) {
      sendServerError(res, error, "Get applications error:", "获取申请列表失败");
    }
  }

  // ============================================================
  // Public Projects / 公开项目
  // ============================================================

  /**
   * Get public projects
   * 获取公开项目列表
   * GET /api/profile/public-projects
   */
  static async getPublicProjects(req: Request, res: Response): Promise<void> {
    try {
      const { recruiting, search, status, limit, offset } = req.query;
      const userId = req.user?.sub;

      const filters: {
        recruiting?: boolean;
        search?: string;
        status?: string;
        limit?: number;
        offset?: number;
      } = {};
      if (recruiting !== undefined) {
        filters.recruiting = recruiting === "true";
      }
      if (search && typeof search === "string") {
        filters.search = search;
      }
      // 目前公开探索页只按待评审过滤；白名单校验避免任意状态注入查询
      if (status === "review_pending") {
        filters.status = status;
      }
      if (typeof limit === "string") {
        const parsedLimit = Number.parseInt(limit, 10);
        if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
          filters.limit = Math.min(parsedLimit, 100);
        }
      }
      if (typeof offset === "string") {
        const parsedOffset = Number.parseInt(offset, 10);
        if (Number.isFinite(parsedOffset) && parsedOffset > 0) {
          filters.offset = parsedOffset;
        }
      }

      const projects = await ProfileModel.getPublicProjects(filters, userId);
      res.json({ success: true, data: projects });
    } catch (error) {
      sendServerError(res, error, "Get public projects error:", "获取公开项目失败");
    }
  }

  /**
   * Get a single public project
   * 获取单个公开项目详情
   * GET /api/profile/public-projects/:id
   */
  static async getPublicProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.sub;

      const project = await ProfileModel.getPublicProjectById(id, userId);

      if (!project) {
        res.status(404).json({
          success: false,
          error: { code: "PROJECT_NOT_FOUND", message: "公开课题不存在或暂未开放" },
        });
        return;
      }

      res.json({ success: true, data: project });
    } catch (error) {
      sendServerError(res, error, "Get public project error:", "获取公开项目详情失败");
    }
  }

  /**
   * Get public project evidence
   * 获取公开课题证据库
   * GET /api/profile/public-projects/:projectId/evidence
   */
  static async getPublicProjectEvidence(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.sub;

      const project = await ProfileModel.getPublicProjectById(projectId, userId);

      if (!project) {
        res.status(404).json({
          success: false,
          error: { code: "PROJECT_NOT_FOUND", message: "公开课题不存在或暂未开放" },
        });
        return;
      }

      const evidenceItems = await ResearchModel.getProjectEvidence(projectId);
      res.json({ success: true, data: evidenceItems });
    } catch (error) {
      sendServerError(res, error, "Get public project evidence error:", "获取公开课题证据失败");
    }
  }

  /**
   * Get public project peer reviews
   * 获取公开课题同伴评审
   * GET /api/profile/public-projects/:projectId/reviews
   */
  static async getPublicProjectReviews(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.sub;

      const project = await ProfileModel.getPublicProjectById(projectId, userId);

      if (!project) {
        res.status(404).json({
          success: false,
          error: { code: "PROJECT_NOT_FOUND", message: "公开课题不存在或暂未开放" },
        });
        return;
      }

      const reviews = await ResearchModel.getProjectReviews(projectId);
      res.json({ success: true, data: reviews });
    } catch (error) {
      sendServerError(res, error, "Get public project reviews error:", "获取公开课题评审失败");
    }
  }
}
