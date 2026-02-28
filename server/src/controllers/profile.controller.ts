/**
 * Profile Controller
 * 个人资料控制器
 */

import { Request, Response } from "express";
import { ProfileModel } from "../models/profile.model.js";
import { logger } from "../utils/logger.js";

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
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "未授权" },
        });
        return;
      }

      const educations = await ProfileModel.getUserEducations(userId);
      res.json({ success: true, data: educations });
    } catch (error) {
      logger.error("Get educations error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "获取教育经历失败" },
      });
    }
  }

  /**
   * Create education record
   * 创建教育经历
   * POST /api/profile/educations
   */
  static async createEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "未授权" },
        });
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
      logger.error("Create education error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "创建教育经历失败" },
      });
    }
  }

  /**
   * Update education record
   * 更新教育经历
   * PUT /api/profile/educations/:id
   */
  static async updateEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "未授权" },
        });
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
      logger.error("Update education error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "更新教育经历失败" },
      });
    }
  }

  /**
   * Delete education record
   * 删除教育经历
   * DELETE /api/profile/educations/:id
   */
  static async deleteEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "未授权" },
        });
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
      logger.error("Delete education error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "删除教育经历失败" },
      });
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
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "未授权" },
        });
        return;
      }

      const applications = await ProfileModel.getUserApplications(userId);
      res.json({ success: true, data: applications });
    } catch (error) {
      logger.error("Get applications error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "获取申请列表失败" },
      });
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
      const { recruiting, search } = req.query;

      const filters: { recruiting?: boolean; search?: string } = {};
      if (recruiting !== undefined) {
        filters.recruiting = recruiting === "true";
      }
      if (search && typeof search === "string") {
        filters.search = search;
      }

      const projects = await ProfileModel.getPublicProjects(filters);
      res.json({ success: true, data: projects });
    } catch (error) {
      logger.error("Get public projects error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "获取公开项目失败" },
      });
    }
  }
}
