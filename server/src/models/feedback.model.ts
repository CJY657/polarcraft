import { v4 as uuidv4 } from 'uuid';
import { getCollection } from '../database/connection.js';
import { normalizeDocument } from '../database/mongo.util.js';
import type { FeedbackEmailStatus, FeedbackSubmission } from '../types/feedback.types.js';

const feedbackCollection = () => getCollection('feedback_submissions');

export class FeedbackModel {
  static async create(
    input: Omit<FeedbackSubmission, 'id' | 'created_at'>
  ): Promise<FeedbackSubmission> {
    const feedback: FeedbackSubmission = {
      id: uuidv4(),
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
}
