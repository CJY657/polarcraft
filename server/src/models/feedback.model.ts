import { getCollection } from '../database/connection.js';
import { generateId } from '../utils/crypto.util.js';
import { normalizeDocument } from '../database/mongo.util.js';
import type {
  FeedbackCategory,
  FeedbackEmailStatus,
  FeedbackSubmission,
} from '../types/feedback.types.js';

const feedbackCollection = () => getCollection('feedback_submissions');

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

  static async updateEmailDelivery(
    id: string,
    status: FeedbackEmailStatus,
    recipientEmail: string | null,
    sentAt: Date | null,
  ): Promise<void> {
    await feedbackCollection().updateOne(
      { id },
      {
        $set: {
          email_status: status,
          recipient_email: recipientEmail,
          email_sent_at: sentAt,
        },
      },
    );
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
}
