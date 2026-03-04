/**
 * Notification Model
 * 通知数据模型
 */

import { query, queryOne } from "../database/connection.js";
import { generateId } from "../utils/crypto.util.js";
import { logger } from "../utils/logger.js";
import {
  UserNotification,
  CreateNotificationInput,
  NotificationType,
} from "../types/notification.types.js";

/**
 * Notification Model Class
 * 通知模型类
 */
export class NotificationModel {
  // ============================================================
  // Get Notifications / 获取通知
  // ============================================================

  /**
   * Get notifications for a user
   * 获取用户的通知列表
   */
  static async getUserNotifications(
    userId: string,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean }
  ): Promise<{ notifications: UserNotification[]; total: number }> {
    // Ensure limit and offset are valid integers (for safe SQL interpolation)
    const limit = Math.max(1, Math.floor(options?.limit ?? 20));
    const offset = Math.max(0, Math.floor(options?.offset ?? 0));

    // Build WHERE clause
    let whereClause = "WHERE user_id = ?";
    const params: any[] = [userId];

    if (options?.unreadOnly) {
      whereClause += " AND is_read = FALSE";
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM user_notifications ${whereClause}`;
    const countResult = await queryOne<{ count: number }>(countSql, params);
    const total = countResult?.count ?? 0;

    // Get notifications
    // Note: LIMIT and OFFSET are safely interpolated as integers (not using placeholders)
    // because MySQL prepared statements have issues with LIMIT/OFFSET parameters
    const sql = `
      SELECT *
      FROM user_notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const notifications = await query(sql, params);

    return { notifications, total };
  }

  /**
   * Get notification by ID
   * 根据ID获取通知
   */
  static async getNotificationById(
    notificationId: string,
    userId: string
  ): Promise<UserNotification | null> {
    const sql = `
      SELECT *
      FROM user_notifications
      WHERE id = ? AND user_id = ?
    `;
    return await queryOne(sql, [notificationId, userId]);
  }

  /**
   * Get unread count for a user
   * 获取用户未读通知数量
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count
      FROM user_notifications
      WHERE user_id = ? AND is_read = FALSE
    `;
    const result = await queryOne<{ count: number }>(sql, [userId]);
    return result?.count ?? 0;
  }

  // ============================================================
  // Create Notification / 创建通知
  // ============================================================

  /**
   * Create notification
   * 创建通知
   */
  static async createNotification(data: CreateNotificationInput): Promise<string> {
    const id = generateId();

    const sql = `
      INSERT INTO user_notifications (id, user_id, type, title, content, data, action_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      data.user_id,
      data.type,
      data.title,
      data.content || null,
      data.data ? JSON.stringify(data.data) : null,
      data.action_url || null,
    ]);

    logger.info(`Notification created: ${id} for user ${data.user_id}`);
    return id;
  }

  /**
   * Create notification for multiple users
   * 为多个用户创建通知（用于系统公告）
   */
  static async createNotificationForUsers(
    userIds: string[],
    data: Omit<CreateNotificationInput, "user_id">
  ): Promise<void> {
    const values: string[] = [];
    const params: any[] = [];

    for (const userId of userIds) {
      const id = generateId();
      values.push("(?, ?, ?, ?, ?, ?, ?)");
      params.push(
        id,
        userId,
        data.type,
        data.title,
        data.content || null,
        data.data ? JSON.stringify(data.data) : null,
        data.action_url || null
      );
    }

    const sql = `
      INSERT INTO user_notifications (id, user_id, type, title, content, data, action_url)
      VALUES ${values.join(", ")}
    `;
    await query(sql, params);

    logger.info(`Notifications created for ${userIds.length} users`);
  }

  // ============================================================
  // Update Notification / 更新通知
  // ============================================================

  /**
   * Mark notification as read
   * 标记通知为已读
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const sql = `
      UPDATE user_notifications
      SET is_read = TRUE
      WHERE id = ? AND user_id = ?
    `;
    const result: any = await query(sql, [notificationId, userId]);

    if (result.affectedRows > 0) {
      logger.info(`Notification ${notificationId} marked as read`);
      return true;
    }
    return false;
  }

  /**
   * Mark all notifications as read for a user
   * 标记用户所有通知为已读
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const sql = `
      UPDATE user_notifications
      SET is_read = TRUE
      WHERE user_id = ? AND is_read = FALSE
    `;
    const result: any = await query(sql, [userId]);

    logger.info(`${result.affectedRows} notifications marked as read for user ${userId}`);
    return result.affectedRows;
  }

  // ============================================================
  // Delete Notification / 删除通知
  // ============================================================

  /**
   * Delete notification
   * 删除通知
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const sql = `
      DELETE FROM user_notifications
      WHERE id = ? AND user_id = ?
    `;
    const result: any = await query(sql, [notificationId, userId]);

    if (result.affectedRows > 0) {
      logger.info(`Notification ${notificationId} deleted`);
      return true;
    }
    return false;
  }
}
