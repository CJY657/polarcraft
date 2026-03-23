import { api } from "./api";

export type FeedbackCategory = "experiment" | "product";
export type FeedbackEmailStatus = "sent" | "not_configured" | "failed";

export interface CreateFeedbackInput {
  category: FeedbackCategory;
  subject: string;
  content: string;
  courseId?: string;
  courseTitle?: string;
  sourcePage?: string;
  pagePath?: string;
  contactName?: string;
  contactEmail?: string;
}

export interface FeedbackSubmissionResult {
  id: string;
  emailStatus: FeedbackEmailStatus;
}

export const feedbackApi = {
  async submit(input: CreateFeedbackInput): Promise<FeedbackSubmissionResult> {
    const response = await api.post<FeedbackSubmissionResult>("/api/feedback", input);
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || "提交反馈失败");
  },
};
