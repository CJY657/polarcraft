/**
 * Notification Controller
 * 通知控制器
 */

import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model.js";
import { logger } from "../utils/logger.js";

/**
 * Notification Controller Class
 * 通知控制器类
 */
export class NotificationController {
  // ============================================================
  // Get Notifications / 获取通知
  // ============================================================

  /**
   * Get user's notifications
   * 获取用户的通知列表
   * GET /api/notifications
   */
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "未授权" },
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unread === "true";

      const { notifications, total } = await NotificationModel.getUserNotifications(userId, {
        limit,
        offset,
        unreadOnly,
      });

      const unreadCount = await NotificationModel.getUnreadCount(userId);

      res.json({
        success: true,
        data: {
          notifications,
          total,
          unread_count: unreadCount,
        },
      });
    } catch (error) {
      logger.error("Get notifications error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "获取通知失败" },
      });
    }
  }

  /**
   * Get unread count
   * 获取未读数量
   * GET /api/notifications/unread-count
   */
  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "未授权" },
        });
        return;
      }

      const count = await NotificationModel.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      logger.error("Get unread count error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "获取未读数量失败" },
      });
    }
  }

  // ============================================================
  // Update Notifications / 更新通知
  // ============================================================

  /**
   * Mark notification as read
   * 标记通知为已读
   * PUT /api/notifications/:id/read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
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

      const success = await NotificationModel.markAsRead(id, userId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "通知不存在" },
        });
        return;
      }

      res.json({ success: true, message: "已标记为已读" });
    } catch (error) {
      logger.error("Mark as read error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "标记已读失败" },
      });
    }
  }

  /**
   * Mark all notifications as read
   * 标记所有通知为已读
   * PUT /api/notifications/read-all
   */
  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "未授权" },
        });
        return;
      }

      const count = await NotificationModel.markAllAsRead(userId);

      res.json({
        success: true,
        message: `已将 ${count} 条通知标记为已读`,
      });
    } catch (error) {
      logger.error("Mark all as read error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "标记已读失败" },
      });
    }
  }

  // ============================================================
  // Delete Notification / 删除通知
  // ============================================================

  /**
   * Delete notification
   * 删除通知
   * DELETE /api/notifications/:id
   */
  static async deleteNotification(req: Request, res: Response): Promise<void> {
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

      const success = await NotificationModel.deleteNotification(id, userId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "通知不存在" },
        });
        return;
      }

      res.json({ success: true, message: "删除成功" });
    } catch (error) {
      logger.error("Delete notification error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "删除通知失败" },
      });
    }
  }
}
