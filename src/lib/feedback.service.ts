import { api, ensureApiSuccess } from "./api";

export type FeedbackCategory = "experiment" | "product";

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
}

export interface FeedbackAdminItem {
  id: string;
  category: FeedbackCategory;
  subject: string;
  content: string;
  course_id: string | null;
  course_title: string | null;
  source_page: string | null;
  page_path: string | null;
  contact_name: string | null;
  contact_email: string | null;
  user_id: string | null;
  username: string | null;
  user_role: "user" | "admin" | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface FeedbackListResult {
  items: FeedbackAdminItem[];
  total: number;
}

export const feedbackApi = {
  async submit(input: CreateFeedbackInput): Promise<FeedbackSubmissionResult> {
    const response = await api.post<FeedbackSubmissionResult>("/api/feedback", input);
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || "提交反馈失败");
  },

  async list(params?: {
    category?: FeedbackCategory | "all";
    limit?: number;
  }): Promise<FeedbackListResult> {
    const search = new URLSearchParams();

    if (params?.category && params.category !== "all") {
      search.set("category", params.category);
    }

    if (typeof params?.limit === "number") {
      search.set("limit", String(params.limit));
    }

    const query = search.toString();
    const response = await api.get<FeedbackListResult>(`/api/feedback${query ? `?${query}` : ""}`);
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || "获取反馈列表失败");
  },

  async deleteFeedback(id: string): Promise<void> {
    const response = await api.delete(`/api/feedback/${encodeURIComponent(id)}`);
    ensureApiSuccess(response, "删除反馈失败");
  },
};
