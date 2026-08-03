import { api } from './api';
import type { UserType } from './auth.service';

export type AdminUserRoleFilter = 'all' | 'user' | 'admin';
export type AdminUserStatusFilter = 'all' | 'active' | 'inactive';
export type AdminUserTypeFilter = 'all' | UserType | 'unclassified';
export type AdminUserSortField = 'created_at' | 'last_login_at';
export type AdminUserSortOrder = 'asc' | 'desc';

export interface AdminUserListItem {
  id: string;
  username: string;
  nickname: string | null;
  real_name: string | null;
  show_real_name_publicly: boolean;
  role: 'user' | 'admin';
  user_type: UserType | null;
  avatar_url: string | null;
  email: string | null;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminUserListResult {
  items: AdminUserListItem[];
  total: number;
}

export interface AdminUserStats {
  total_registered: number;
  active_users: number;
  new_users_7d: number;
  recent_logins_7d: number;
  unverified_emails: number;
}

export interface AdminUserEducationItem {
  id: string;
  organization: string;
  major: string;
  degree_level: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
}

export interface AdminUserResearchMembershipItem {
  project_id: string;
  project_name: string | null;
  role: 'owner' | 'member';
  joined_at: string | null;
}

export interface AdminUserResearchApplicationItem {
  id: string;
  project_id: string;
  project_name: string | null;
  display_name: string;
  organization: string;
  major: string | null;
  grade: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  created_at: string;
  reviewed_at: string | null;
}

export interface AdminUserDetail {
  user: AdminUserListItem;
  educations: AdminUserEducationItem[];
  research: {
    memberships: AdminUserResearchMembershipItem[];
    applications: AdminUserResearchApplicationItem[];
  };
}

export interface AdminUserPostHogPerson {
  id: string;
  uuid: string | null;
  created_at: string | null;
  last_seen_at: string | null;
}

export interface AdminUserPostHogDailyActivity {
  date: string;
  events: number;
}

export interface AdminUserPostHogSummary {
  window_days: 10;
  last_activity: string | null;
  meaningful_events: number;
  pageviews: number;
  learning_actions: number;
  /** Dense day-by-day series for the summary window (absent on older payloads). */
  daily?: AdminUserPostHogDailyActivity[];
}

export interface AdminUserPostHogAnalyticsResponse {
  status: 'ok' | 'not_found' | 'disabled';
  person: AdminUserPostHogPerson | null;
  summary: AdminUserPostHogSummary | null;
}

export type AdminActivityLimit = 10 | 50 | 100 | 'all';
export type AdminActivityUserType = UserType | 'all';

export interface AdminActivityQuery {
  start: string;
  end: string;
  userType: AdminActivityUserType;
  limit: AdminActivityLimit;
}

export interface AdminActivityModuleBreakdown {
  module: string;
  label: string;
  pageviews: number;
  unique_users: number;
  users: Array<{
    user_id: string;
    username: string;
    pageviews: number;
  }>;
}

export interface AdminActivityResponse {
  status: 'ok' | 'disabled';
  segment: AdminActivityUserType;
  range: {
    start: string;
    end: string;
    days: number;
  };
  generated_at: string;
  summary: {
    active_users: number;
    meaningful_events: number;
    pageviews: number;
    learning_actions: number;
  } | null;
  /** Same totals over the preceding equal-length window (absent on older payloads). */
  previous_summary?: {
    range: {
      start: string;
      end: string;
      days: number;
    };
    active_users: number;
    meaningful_events: number;
    pageviews: number;
    learning_actions: number;
  } | null;
  daily: Array<{
    date: string;
    active_users: number;
    pageviews: number;
    learning_actions: number;
  }>;
  top_pages: Array<{
    path: string;
    pageviews: number;
    unique_users: number;
  }>;
  activity_breakdown: Array<{
    event: string;
    count: number;
    unique_users: number;
  }>;
  module_breakdown: AdminActivityModuleBreakdown[];
  top_users: Array<{
    user_id: string;
    username: string;
    display_name: string;
    user_type: UserType | null;
    events: number;
    pageviews: number;
    learning_actions: number;
    last_activity: string | null;
  }>;
}

export interface AdminUserActivitySummary {
  meaningful_events: number;
  pageviews: number;
  learning_actions: number;
}

export interface AdminUserActivityResponse {
  status: 'ok' | 'disabled';
  user_type: UserType | null;
  range: {
    start: string;
    end: string;
    days: number;
  };
  previous_range: {
    start: string;
    end: string;
    days: number;
  };
  generated_at: string;
  last_activity: string | null;
  summary: AdminUserActivitySummary | null;
  previous_summary: AdminUserActivitySummary | null;
  daily: Array<{
    date: string;
    events: number;
    pageviews: number;
    learning_actions: number;
  }>;
  top_pages: Array<{
    path: string;
    pageviews: number;
  }>;
  module_breakdown: Array<{
    module: string;
    label: string;
    pageviews: number;
  }>;
  /** weekday: 1 = 周一 … 7 = 周日, hour: 0-23，均为中国时区。 */
  hourly: Array<{
    weekday: number;
    hour: number;
    count: number;
  }>;
}

export const adminUserApi = {
  async getStats(): Promise<AdminUserStats> {
    const response = await api.get<AdminUserStats>('/api/users/stats');
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || '获取用户统计失败');
  },

  async list(params: {
    search?: string;
    role?: AdminUserRoleFilter;
    status?: AdminUserStatusFilter;
    userType?: AdminUserTypeFilter;
    limit?: number;
    offset?: number;
    sortBy?: AdminUserSortField;
    sortOrder?: AdminUserSortOrder;
  } = {}): Promise<AdminUserListResult> {
    const search = new URLSearchParams();

    if (params.search?.trim()) {
      search.set('search', params.search.trim());
    }

    if (params.userType && params.userType !== 'all') {
      search.set('user_type', params.userType);
    }

    if (params.role && params.role !== 'all') {
      search.set('role', params.role);
    }

    if (params.status && params.status !== 'all') {
      search.set('status', params.status);
    }

    if (typeof params.limit === 'number') {
      search.set('limit', String(params.limit));
    }

    if (typeof params.offset === 'number') {
      search.set('offset', String(params.offset));
    }

    if (params.sortBy) {
      search.set('sort_by', params.sortBy);
    }

    if (params.sortOrder) {
      search.set('sort_order', params.sortOrder);
    }

    const query = search.toString();
    const response = await api.get<AdminUserListResult>(
      `/api/users${query ? `?${query}` : ''}`
    );
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || '获取用户列表失败');
  },

  async getDetail(userId: string): Promise<AdminUserDetail> {
    const response = await api.get<AdminUserDetail>(`/api/users/${userId}/details`);
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || '获取用户详情失败');
  },

  async getPostHogAnalytics(
    userId: string
  ): Promise<AdminUserPostHogAnalyticsResponse> {
    const response = await api.get<AdminUserPostHogAnalyticsResponse>(
      `/api/users/${userId}/posthog-analytics`
    );
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || '获取行为数据失败');
  },

  async getActivity(query: AdminActivityQuery): Promise<AdminActivityResponse> {
    const search = new URLSearchParams({
      start: query.start,
      end: query.end,
      user_type: query.userType,
      limit: String(query.limit),
    });
    const response = await api.get<AdminActivityResponse>(
      `/api/users/activity?${search.toString()}`
    );
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || '获取用户活动失败');
  },

  async getActivityDetail(
    userId: string,
    range: { start: string; end: string }
  ): Promise<AdminUserActivityResponse> {
    const search = new URLSearchParams({ start: range.start, end: range.end });
    const response = await api.get<AdminUserActivityResponse>(
      `/api/users/${userId}/activity?${search.toString()}`
    );
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || '获取用户活动详情失败');
  },
};
