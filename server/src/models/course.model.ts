/**
 * Course Model
 * 课程数据模型
 */

import { getCollection } from '../database/connection.js';
import { normalizeDocument, normalizeDocuments, normalizeImageUrls, pickDefined } from '../database/mongo.util.js';
import { generateId } from '../utils/crypto.util.js';
import { logger } from '../utils/logger.js';
import type {
  CourseRow,
  MainSlideRow,
  MediaRow,
  HyperlinkRow,
  CourseDiscussionCommentRow,
  CreateCourseInput,
  UpdateCourseInput,
  CreateMainSlideInput,
  CreateMediaInput,
  UpdateMediaInput,
  CreateHyperlinkInput,
  UpdateHyperlinkInput,
  KnowledgeTag,
} from '../types/course.types.js';

const coursesCollection = () => getCollection('courses');
const courseMainSlidesCollection = () => getCollection('course_main_slides');
const courseMediaCollection = () => getCollection('course_media');
const courseHyperlinksCollection = () => getCollection('course_hyperlinks');
const courseDiscussionCommentsCollection = () => getCollection('course_discussion_comments');
const usersCollection = () => getCollection('users');

const DEFAULT_KNOWLEDGE_TAG: KnowledgeTag = 'foundation';

type UserIdentity = {
  username: string;
  nickname: string | null;
  real_name: string | null;
  avatar_url: string | null;
};

async function getUserMap(userIds: string[]): Promise<Map<string, UserIdentity>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const users = normalizeDocuments<UserIdentity & { id: string }>(
    await usersCollection()
      .find({ id: { $in: [...new Set(userIds)] } })
      .project({ _id: 0, id: 1, username: 1, nickname: 1, real_name: 1, avatar_url: 1 })
      .toArray()
  );

  return new Map(
    users.map((user) => [
      user.id,
      {
        username: user.username,
        nickname: user.nickname ?? null,
        real_name: user.real_name ?? null,
        avatar_url: user.avatar_url,
      },
    ])
  );
}

type CourseDiscussionCommentDocument = {
  id: string;
  course_id: string;
  user_id: string;
  parent_comment_id?: string | null;
  content?: string | null;
  image_urls?: unknown;
  resource_id?: string | null;
  is_deleted?: boolean;
  created_at: Date;
  updated_at: Date;
};

export class CourseModel {
  /**
   * Delete courses and all related course resources
   * 删除课程及其所有关联资源
   */
  static async deleteCoursesByIds(courseIds: string[]): Promise<number> {
    if (courseIds.length === 0) {
      return 0;
    }

    await courseMainSlidesCollection().deleteMany({ course_id: { $in: courseIds } });
    await courseMediaCollection().deleteMany({ course_id: { $in: courseIds } });
    await courseHyperlinksCollection().deleteMany({ course_id: { $in: courseIds } });
    await courseDiscussionCommentsCollection().deleteMany({ course_id: { $in: courseIds } });

    const result = await coursesCollection().deleteMany({ id: { $in: courseIds } });

    logger.info(`Courses deleted in batch: ${result.deletedCount}`);
    return result.deletedCount;
  }

  /**
   * Get all courses
   * 获取所有课程
   */
  static async getAllCourses(): Promise<CourseRow[]> {
    return normalizeDocuments<CourseRow>(
      await coursesCollection().find({}).sort({ created_at: -1 }).toArray()
    );
  }

  /**
   * Get course by ID
   * 获取课程详情
   */
  static async getCourseById(courseId: string): Promise<CourseRow | null> {
    return normalizeDocument<CourseRow>(await coursesCollection().findOne({ id: courseId }));
  }

  /**
   * Create course
   * 创建课程
   */
  static async createCourse(data: CreateCourseInput): Promise<string> {
    const now = new Date();
    const course: CourseRow = {
      id: generateId(),
      unit_id: data.unitId,
      title_zh: data.title_zh,
      title_en: data.title_en || null,
      description_zh: data.description_zh || null,
      description_en: data.description_en || null,
      cover_image: data.coverImage ?? null,
      color: data.color || '#C9A227',
      knowledge_tag: data.knowledgeTag || DEFAULT_KNOWLEDGE_TAG,
      sort_order: 0,
      created_at: now,
      updated_at: now,
    };

    await coursesCollection().insertOne(course as unknown as Record<string, unknown>);

    logger.info(`Course created: ${course.id}`);
    return course.id;
  }

  /**
   * Update course
   * 更新课程
   */
  static async updateCourse(courseId: string, data: UpdateCourseInput): Promise<boolean> {
    const updateDoc = pickDefined({
      unit_id: data.unitId,
      title_zh: data.title_zh,
      title_en: data.title_en,
      description_zh: data.description_zh,
      description_en: data.description_en,
      cover_image: data.coverImage,
      color: data.color,
      knowledge_tag: data.knowledgeTag,
      sort_order: data.sortOrder,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const result = await coursesCollection().updateOne(
      { id: courseId },
      { $set: { ...updateDoc, updated_at: new Date() } }
    );

    logger.info(`Course updated: ${courseId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete course
   * 删除课程
   */
  static async deleteCourse(courseId: string): Promise<boolean> {
    const deletedCount = await this.deleteCoursesByIds([courseId]);
    logger.info(`Course deleted: ${courseId}`);
    return deletedCount > 0;
  }

  /**
   * Get main slide by course ID
   * 获取课程的主课件
   */
  static async getMainSlide(courseId: string): Promise<MainSlideRow | null> {
    return normalizeDocument<MainSlideRow>(
      await courseMainSlidesCollection().findOne({ course_id: courseId })
    );
  }

  /**
   * Upsert main slide
   * 创建或更新主课件
   */
  static async upsertMainSlide(courseId: string, data: CreateMainSlideInput): Promise<string> {
    const existing = await this.getMainSlide(courseId);
    const now = new Date();

    if (existing) {
      await courseMainSlidesCollection().updateOne(
        { course_id: courseId },
        {
          $set: {
            url: data.url,
            title_zh: data.title_zh || null,
            title_en: data.title_en || null,
            knowledge_tag: data.knowledgeTag || DEFAULT_KNOWLEDGE_TAG,
            updated_at: now,
          },
        }
      );

      logger.info(`Main slide updated for course: ${courseId}`);
      return existing.id;
    }

    const slide: MainSlideRow = {
      id: generateId(),
      course_id: courseId,
      url: data.url,
      title_zh: data.title_zh || null,
      title_en: data.title_en || null,
      knowledge_tag: data.knowledgeTag || DEFAULT_KNOWLEDGE_TAG,
      created_at: now,
      updated_at: now,
    };

    await courseMainSlidesCollection().insertOne(slide as unknown as Record<string, unknown>);

    logger.info(`Main slide created for course: ${courseId}`);
    return slide.id;
  }

  /**
   * Delete main slide
   * 删除主课件
   */
  static async deleteMainSlide(courseId: string): Promise<boolean> {
    const result = await courseMainSlidesCollection().deleteOne({ course_id: courseId });
    logger.info(`Main slide deleted for course: ${courseId}`);
    return result.deletedCount > 0;
  }

  /**
   * Get course discussion comments
   * 获取实验讨论评论
   */
  static async getDiscussionComments(courseId: string): Promise<Array<CourseDiscussionCommentRow & {
    username: string;
    nickname: string | null;
    real_name: string | null;
    avatar_url: string | null;
    resource_title_zh: string | null;
    resource_title_en: string | null;
  }>> {
    const comments = normalizeDocuments<CourseDiscussionCommentDocument>(
      await courseDiscussionCommentsCollection()
        .find({ course_id: courseId })
        .sort({ created_at: 1 })
        .toArray()
    );
    const userMap = await getUserMap(comments.map((comment) => comment.user_id));

    // Get resource titles for comments that reference a resource
    const resourceIds = [
      ...new Set(
        comments
          .map((comment) => comment.resource_id)
          .filter((resourceId): resourceId is string => typeof resourceId === 'string' && resourceId.length > 0)
      ),
    ];
    const resourceMap = new Map<string, { title_zh: string; title_en: string | null }>();
    if (resourceIds.length > 0) {
      const resources = normalizeDocuments<MediaRow>(
        await courseMediaCollection()
          .find({ id: { $in: resourceIds } })
          .project({ _id: 0, id: 1, title_zh: 1, title_en: 1 })
          .toArray()
      );
      for (const resource of resources) {
        resourceMap.set(resource.id, { title_zh: resource.title_zh, title_en: resource.title_en });
      }
    }

    return comments.map((comment) => ({
      id: comment.id,
      course_id: comment.course_id,
      user_id: comment.user_id,
      parent_comment_id: comment.parent_comment_id ?? null,
      content: comment.content ?? '',
      image_urls: normalizeImageUrls(comment.image_urls),
      resource_id: comment.resource_id ?? null,
      is_deleted: comment.is_deleted ?? false,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      username: userMap.get(comment.user_id)?.username || '',
      nickname: userMap.get(comment.user_id)?.nickname ?? null,
      real_name: userMap.get(comment.user_id)?.real_name ?? null,
      avatar_url: userMap.get(comment.user_id)?.avatar_url || null,
      resource_title_zh: comment.resource_id ? resourceMap.get(comment.resource_id)?.title_zh ?? null : null,
      resource_title_en: comment.resource_id ? resourceMap.get(comment.resource_id)?.title_en ?? null : null,
    }));
  }

  /**
   * Get course discussion comment by ID
   * 获取实验讨论评论详情
   */
  static async getDiscussionCommentById(commentId: string): Promise<(CourseDiscussionCommentRow & {
    resource_title_zh: string | null;
    resource_title_en: string | null;
  }) | null> {
    const comment = normalizeDocument<CourseDiscussionCommentDocument>(
      await courseDiscussionCommentsCollection().findOne({ id: commentId })
    );
    if (!comment) {
      return null;
    }

    let resourceTitleZh: string | null = null;
    let resourceTitleEn: string | null = null;
    if (comment.resource_id) {
      const resource = normalizeDocument<MediaRow>(
        await courseMediaCollection().findOne({ id: comment.resource_id })
      );
      if (resource) {
        resourceTitleZh = resource.title_zh;
        resourceTitleEn = resource.title_en;
      }
    }

    return {
      id: comment.id,
      course_id: comment.course_id,
      user_id: comment.user_id,
      parent_comment_id: comment.parent_comment_id ?? null,
      content: comment.content ?? '',
      image_urls: normalizeImageUrls(comment.image_urls),
      resource_id: comment.resource_id ?? null,
      is_deleted: comment.is_deleted ?? false,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      resource_title_zh: resourceTitleZh,
      resource_title_en: resourceTitleEn,
    };
  }

  /**
   * Add course discussion comment
   * 添加实验讨论评论
   */
  static async addDiscussionComment(
    courseId: string,
    userId: string,
    content: string,
    imageUrls: string[] = [],
    parentCommentId: string | null = null,
    resourceId: string | null = null
  ): Promise<string> {
    const now = new Date();
    const commentId = generateId();

    await courseDiscussionCommentsCollection().insertOne({
      id: commentId,
      course_id: courseId,
      user_id: userId,
      parent_comment_id: parentCommentId,
      content,
      image_urls: normalizeImageUrls(imageUrls),
      resource_id: resourceId,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    });

    logger.info(`Course discussion comment created: ${commentId} in course ${courseId}`);
    return commentId;
  }

  /**
   * Prune deleted ancestor comments that have no children
   * 清理已删除的无子评论的祖先评论
   */
  private static async pruneDeletedDiscussionAncestor(commentId: string | null): Promise<void> {
    if (!commentId) {
      return;
    }

    const comment = await this.getDiscussionCommentById(commentId);
    if (!comment?.is_deleted) {
      return;
    }

    const childCount = await courseDiscussionCommentsCollection().countDocuments({ parent_comment_id: commentId });
    if (childCount > 0) {
      return;
    }

    await courseDiscussionCommentsCollection().deleteOne({ id: commentId });
    await this.pruneDeletedDiscussionAncestor(comment.parent_comment_id ?? null);
  }

  /**
   * Delete course discussion comment
   * 删除实验讨论评论（支持软删除）
   */
  static async deleteDiscussionComment(commentId: string): Promise<boolean> {
    const comment = await this.getDiscussionCommentById(commentId);
    if (!comment) {
      return false;
    }

    const childCount = await courseDiscussionCommentsCollection().countDocuments({ parent_comment_id: commentId });

    if (childCount > 0) {
      // Soft delete: mark as deleted but keep the comment for thread continuity
      const result = await courseDiscussionCommentsCollection().updateOne(
        { id: commentId },
        { $set: { is_deleted: true, content: '', image_urls: [], updated_at: new Date() } }
      );
      logger.info(`Course discussion comment soft deleted: ${commentId}`);
      return result.modifiedCount > 0;
    }

    // Hard delete: remove the comment entirely
    const result = await courseDiscussionCommentsCollection().deleteOne({ id: commentId });
    if (result.deletedCount === 0) {
      return false;
    }

    // Prune any deleted ancestors that now have no children
    await this.pruneDeletedDiscussionAncestor(comment.parent_comment_id ?? null);
    logger.info(`Course discussion comment deleted: ${commentId}`);
    return true;
  }

  /**
   * Get all media for a course
   * 获取课程的所有媒体资源
   */
  static async getMediaByCourse(courseId: string): Promise<MediaRow[]> {
    return normalizeDocuments<MediaRow>(
      await courseMediaCollection()
        .find({ course_id: courseId })
        .sort({ sort_order: 1, created_at: 1 })
        .toArray()
    );
  }

  /**
   * Get media by ID
   * 获取单个媒体资源
   */
  static async getMediaById(mediaId: string): Promise<MediaRow | null> {
    return normalizeDocument<MediaRow>(await courseMediaCollection().findOne({ id: mediaId }));
  }

  /**
   * Get media by IDs
   * 批量获取媒体资源
   */
  static async getMediaByIds(mediaIds: string[]): Promise<MediaRow[]> {
    if (mediaIds.length === 0) {
      return [];
    }

    return normalizeDocuments<MediaRow>(
      await courseMediaCollection()
        .find({ id: { $in: [...new Set(mediaIds)] } })
        .toArray()
    );
  }

  /**
   * Create media
   * 创建媒体资源
   */
  static async createMedia(courseId: string, data: CreateMediaInput): Promise<string> {
    const maxOrderRow = normalizeDocument<Pick<MediaRow, 'sort_order'>>(
      await courseMediaCollection().findOne({ course_id: courseId }, { sort: { sort_order: -1 } })
    );
    const sortOrder = (maxOrderRow?.sort_order ?? -1) + 1;
    const now = new Date();

    const media: MediaRow = {
      id: generateId(),
      course_id: courseId,
      type: data.type,
      url: data.url,
      preview_pdf_url: data.previewPdfUrl || null,
      title_zh: data.title_zh,
      title_en: data.title_en || null,
      knowledge_tag: data.knowledgeTag || DEFAULT_KNOWLEDGE_TAG,
      duration: data.duration || null,
      sort_order: sortOrder,
      created_at: now,
      updated_at: now,
    };

    await courseMediaCollection().insertOne(media as unknown as Record<string, unknown>);

    logger.info(`Media created: ${media.id}`);
    return media.id;
  }

  /**
   * Update media
   * 更新媒体资源
   */
  static async updateMedia(mediaId: string, data: UpdateMediaInput): Promise<boolean> {
    const updateDoc = pickDefined({
      type: data.type,
      url: data.url,
      preview_pdf_url: data.previewPdfUrl === '' ? null : data.previewPdfUrl,
      title_zh: data.title_zh,
      title_en: data.title_en,
      knowledge_tag: data.knowledgeTag,
      duration: data.duration,
      sort_order: data.sort_order,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const result = await courseMediaCollection().updateOne(
      { id: mediaId },
      { $set: { ...updateDoc, updated_at: new Date() } }
    );

    logger.info(`Media updated: ${mediaId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete media
   * 删除媒体资源
   */
  static async deleteMedia(mediaId: string): Promise<boolean> {
    const result = await courseMediaCollection().deleteOne({ id: mediaId });
    if (result.deletedCount === 0) {
      return false;
    }

    await courseHyperlinksCollection().deleteMany({
      $or: [{ target_media_id: mediaId }, { source_media_id: mediaId }],
    });

    logger.info(`Media deleted: ${mediaId}`);
    return true;
  }

  /**
   * Delete media in batch
   * 批量删除媒体资源
   */
  static async deleteMediaBatch(mediaIds: string[]): Promise<number> {
    const normalizedIds = [...new Set(mediaIds)];
    if (normalizedIds.length === 0) {
      return 0;
    }

    const result = await courseMediaCollection().deleteMany({ id: { $in: normalizedIds } });
    if (result.deletedCount === 0) {
      return 0;
    }

    await courseHyperlinksCollection().deleteMany({
      $or: [
        { target_media_id: { $in: normalizedIds } },
        { source_media_id: { $in: normalizedIds } },
      ],
    });

    logger.info(`Media deleted in batch: ${result.deletedCount}`);
    return result.deletedCount;
  }

  /**
   * Reorder media
   * 重新排序媒体资源
   */
  static async reorderMedia(courseId: string, mediaIds: string[]): Promise<boolean> {
    const now = new Date();
    await Promise.all(
      mediaIds.map((mediaId, index) =>
        courseMediaCollection().updateOne(
          { id: mediaId, course_id: courseId },
          { $set: { sort_order: index, updated_at: now } }
        )
      )
    );

    logger.info(`Media reordered for course: ${courseId}`);
    return true;
  }

  /**
   * Get all hyperlinks for a course
   * 获取课程的所有超链接
   */
  static async getHyperlinksByCourse(courseId: string): Promise<HyperlinkRow[]> {
    return normalizeDocuments<HyperlinkRow>(
      await courseHyperlinksCollection()
        .find({ course_id: courseId })
        .sort({ source_media_id: 1, page: 1, created_at: 1 })
        .toArray()
    );
  }

  /**
   * Get hyperlinks by page
   * 获取特定页面的超链接
   */
  static async getHyperlinksByPage(courseId: string, page: number): Promise<HyperlinkRow[]> {
    return normalizeDocuments<HyperlinkRow>(
      await courseHyperlinksCollection()
        .find({ course_id: courseId, page })
        .sort({ created_at: 1 })
        .toArray()
    );
  }

  /**
   * Get hyperlink by ID
   * 获取单个超链接
   */
  static async getHyperlinkById(hyperlinkId: string): Promise<HyperlinkRow | null> {
    return normalizeDocument<HyperlinkRow>(
      await courseHyperlinksCollection().findOne({ id: hyperlinkId })
    );
  }

  /**
   * Create hyperlink
   * 创建超链接
   */
  static async createHyperlink(courseId: string, data: CreateHyperlinkInput): Promise<string> {
    const now = new Date();
    const hyperlink: HyperlinkRow = {
      id: generateId(),
      course_id: courseId,
      source_media_id: data.sourceMediaId,
      page: data.page,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      target_media_id: data.targetMediaId,
      created_at: now,
      updated_at: now,
    };

    await courseHyperlinksCollection().insertOne(hyperlink as unknown as Record<string, unknown>);

    logger.info(`Hyperlink created: ${hyperlink.id}`);
    return hyperlink.id;
  }

  /**
   * Update hyperlink
   * 更新超链接
   */
  static async updateHyperlink(hyperlinkId: string, data: UpdateHyperlinkInput): Promise<boolean> {
    const updateDoc = pickDefined({
      source_media_id: data.sourceMediaId,
      page: data.page,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      target_media_id: data.targetMediaId,
    });

    if (Object.keys(updateDoc).length === 0) {
      return false;
    }

    const result = await courseHyperlinksCollection().updateOne(
      { id: hyperlinkId },
      { $set: { ...updateDoc, updated_at: new Date() } }
    );

    logger.info(`Hyperlink updated: ${hyperlinkId}`);
    return result.matchedCount > 0;
  }

  /**
   * Delete hyperlink
   * 删除超链接
   */
  static async deleteHyperlink(hyperlinkId: string): Promise<boolean> {
    const result = await courseHyperlinksCollection().deleteOne({ id: hyperlinkId });
    logger.info(`Hyperlink deleted: ${hyperlinkId}`);
    return result.deletedCount > 0;
  }
}
