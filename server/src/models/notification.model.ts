/**
 * Notification Model
 * 通知数据模型
 */

import { getCollection } from '../database/connection.js';
import { normalizeDocument, normalizeDocuments } from '../database/mongo.util.js';
import { generateId } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';
import {
  UserNotification,
  CreateNotificationInput,
} from '../types/notification.types.js';

const notificationsCollection = () => getCollection('user_notifications');

export class NotificationModel {
  /**
   * Get notifications for a user
   * 获取用户的通知列表
   */
  static async getUserNotifications(
    userId: string,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean }
  ): Promise<{ notifications: UserNotification[]; total: number }> {
    const limit = Math.max(1, Math.floor(options?.limit ?? 20));
    const offset = Math.max(0, Math.floor(options?.offset ?? 0));
    const filter: Record<string, unknown> = { user_id: userId };

    if (options?.unreadOnly) {
      filter.is_read = false;
    }

    const [notifications, total] = await Promise.all([
      notificationsCollection()
        .find(filter)
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      notificationsCollection().countDocuments(filter),
    ]);

    return {
      notifications: normalizeDocuments<UserNotification>(notifications),
      total,
    };
  }

  /**
   * Get notification by ID
   * 根据ID获取通知
   */
  static async getNotificationById(
    notificationId: string,
    userId: string
  ): Promise<UserNotification | null> {
    return normalizeDocument<UserNotification>(
      await notificationsCollection().findOne({ id: notificationId, user_id: userId })
    );
  }

  /**
   * Get unread count for a user
   * 获取用户未读通知数量
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return notificationsCollection().countDocuments({ user_id: userId, is_read: false });
  }

  /**
   * Create notification
   * 创建通知
   */
  static async createNotification(data: CreateNotificationInput): Promise<string> {
    const notification: UserNotification = {
      id: generateId(),
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      content: data.content || null,
      data: data.data || null,
      is_read: false,
      action_url: data.action_url || null,
      created_at: new Date(),
    };

    await notificationsCollection().insertOne(notification as unknown as Record<string, unknown>);

    logger.info(`Notification created: ${notification.id} for user ${data.user_id}`);
    return notification.id;
  }

  /**
   * Create notification for multiple users
   * 为多个用户创建通知（用于系统公告）
   */
  static async createNotificationForUsers(
    userIds: string[],
    data: Omit<CreateNotificationInput, 'user_id'>
  ): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    const now = new Date();
    const notifications = userIds.map((userId) => ({
      id: generateId(),
      user_id: userId,
      type: data.type,
      title: data.title,
      content: data.content || null,
      data: data.data || null,
      is_read: false,
      action_url: data.action_url || null,
      created_at: now,
    }));

    await notificationsCollection().insertMany(
      notifications as unknown as Array<Record<string, unknown>>
    );

    logger.info(`Notifications created for ${userIds.length} users`);
  }

  /**
   * Mark notification as read
   * 标记通知为已读
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await notificationsCollection().updateOne(
      { id: notificationId, user_id: userId },
      { $set: { is_read: true } }
    );

    if (result.modifiedCount > 0) {
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
    const result = await notificationsCollection().updateMany(
      { user_id: userId, is_read: false },
      { $set: { is_read: true } }
    );

    logger.info(`${result.modifiedCount} notifications marked as read for user ${userId}`);
    return result.modifiedCount;
  }

  /**
   * Delete notification
   * 删除通知
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await notificationsCollection().deleteOne({ id: notificationId, user_id: userId });

    if (result.deletedCount > 0) {
      logger.info(`Notification ${notificationId} deleted`);
      return true;
    }

    return false;
  }
}
