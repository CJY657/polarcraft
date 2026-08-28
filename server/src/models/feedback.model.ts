import { getCollection } from '../database/connection.js';
import { generateId } from '../utils/crypto.util.js';
import { normalizeDocument } from '../database/mongo.util.js';
import type {
  FeedbackCategory,
  FeedbackSubmission,
  PublicFeedbackItem,
} from '../types/feedback.types.js';

const feedbackCollection = () => getCollection('feedback_submissions');

/**
 * Field whitelist for the public wall. This is the privacy boundary of the
 * feature: it is a MongoDB projection rather than a downstream delete-keys
 * step so that any field added to the collection later is excluded by
 * default instead of leaking until someone remembers to strip it.
 * 公开墙的字段白名单，也是本功能的隐私边界。用投影而非事后删字段，
 * 以后新增字段默认不外泄。
 */
const PUBLIC_FEEDBACK_PROJECTION = {
  _id: 0,
  id: 1,
  category: 1,
  subject: 1,
  content: 1,
  course_title: 1,
  username: 1,
  created_at: 1,
} as const;

export class FeedbackModel {
  static async create(
    input: Omit<FeedbackSubmission, 'id' | 'created_at'>
  ): Promise<FeedbackSubmission> {
    const feedback: FeedbackSubmission = {
      id: generateId(),
      created_at: new Date(),
      ...input,
    };

    await feedbackCollection().insertOne(feedback as unknown as Record<string, unknown>);
    return feedback;
  }

  static async getById(id: string): Promise<FeedbackSubmission | null> {
    return normalizeDocument<FeedbackSubmission>(
      await feedbackCollection().findOne({ id }),
    );
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await feedbackCollection().deleteOne({ id });
    return result.deletedCount > 0;
  }

  static async list(options: {
    category?: FeedbackCategory;
    limit: number;
  }): Promise<FeedbackSubmission[]> {
    const query = options.category ? { category: options.category } : {};
    const documents = await feedbackCollection()
      .find(query)
      .sort({ created_at: -1 })
      .limit(options.limit)
      .toArray();

    return documents
      .map((document) => normalizeDocument<FeedbackSubmission>(document))
      .filter((document): document is FeedbackSubmission => document !== null);
  }

  static async count(category?: FeedbackCategory): Promise<number> {
    const query = category ? { category } : {};
    return feedbackCollection().countDocuments(query);
  }

  /**
   * Newest public submissions for the login-gated wall. Deliberately not
   * built on top of list(): that one returns whole documents, and this path
   * must never see them.
   * 公开墙用的查询。刻意不复用 list()——那个返回整条文档。
   */
  static async listPublic(limit: number): Promise<PublicFeedbackItem[]> {
    const documents = await feedbackCollection()
      .find({ is_public: true })
      .project(PUBLIC_FEEDBACK_PROJECTION)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    return documents as unknown as PublicFeedbackItem[];
  }

  static async setVisibility(id: string, isPublic: boolean): Promise<boolean> {
    const result = await feedbackCollection().updateOne(
      { id },
      { $set: { is_public: isPublic } },
    );

    return result.matchedCount > 0;
  }
}
