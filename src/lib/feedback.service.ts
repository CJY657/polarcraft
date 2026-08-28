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
  imageFile?: File;
  isPublic?: boolean;
}

/** Whitelisted fields the login-gated wall returns — see FeedbackModel.listPublic. */
export interface PublicFeedbackItem {
  id: string;
  category: FeedbackCategory;
  subject: string;
  content: string;
  course_title: string | null;
  username: string | null;
  created_at: string;
}

export interface PublicFeedbackListResult {
  items: PublicFeedbackItem[];
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
  image_url: string | null;
  user_id: string | null;
  username: string | null;
  user_role: "user" | "admin" | null;
  ip_address: string | null;
  user_agent: string | null;
  is_public?: boolean;
  created_at: string;
}

export interface FeedbackListResult {
  items: FeedbackAdminItem[];
  total: number;
}

export const feedbackApi = {
  async submit(input: CreateFeedbackInput): Promise<FeedbackSubmissionResult> {
    const { imageFile, isPublic, ...rest } = input;
    // 上传路径只保留字符串字段（见下方 filter），布尔值会被静默丢弃——
    // 那会让「带图片 + 取消勾选」的提交无声地变成公开。统一转成字符串再发，
    // 服务端两种形态都接受。
    const fields = {
      ...rest,
      ...(isPublic === undefined ? {} : { isPublic: String(isPublic) }),
    };
    const response = imageFile
      ? await api.upload<FeedbackSubmissionResult>(
          "/api/feedback",
          imageFile,
          Object.fromEntries(
            Object.entries(fields).filter((entry): entry is [string, string] =>
              typeof entry[1] === "string"
            )
          ),
        )
      : await api.post<FeedbackSubmissionResult>("/api/feedback", fields);
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

  async listPublic(): Promise<PublicFeedbackListResult> {
    const response = await api.get<PublicFeedbackListResult>("/api/feedback/public");
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || "获取公开反馈失败");
  },

  async setVisibility(id: string, isPublic: boolean): Promise<void> {
    const response = await api.patch(
      `/api/feedback/${encodeURIComponent(id)}/visibility`,
      { is_public: isPublic },
    );
    ensureApiSuccess(response, isPublic ? "公开反馈失败" : "隐藏反馈失败");
  },

  async deleteFeedback(id: string): Promise<void> {
    const response = await api.delete(`/api/feedback/${encodeURIComponent(id)}`);
    ensureApiSuccess(response, "删除反馈失败");
  },
};
