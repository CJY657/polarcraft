import { api } from './api';

export type AdminUserRoleFilter = 'all' | 'user' | 'admin';
export type AdminUserStatusFilter = 'all' | 'active' | 'inactive';
export type AdminUserSortField = 'created_at' | 'last_login_at';
export type AdminUserSortOrder = 'asc' | 'desc';

export interface AdminUserListItem {
  id: string;
  username: string;
  nickname: string | null;
  real_name: string | null;
  role: 'user' | 'admin';
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

export interface AdminUserPostHogSummary {
  window_days: 30;
  event_count_30d: number;
  pageview_count_30d: number;
}

export interface AdminUserPostHogRecentEvent {
  event: string;
  timestamp: string;
  route: string | null;
  url: string | null;
}

export interface AdminUserPostHogAnalyticsResponse {
  status: 'ok' | 'not_found' | 'disabled';
  person: AdminUserPostHogPerson | null;
  summary: AdminUserPostHogSummary | null;
  recent_events: AdminUserPostHogRecentEvent[];
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
    limit?: number;
    offset?: number;
    sortBy?: AdminUserSortField;
    sortOrder?: AdminUserSortOrder;
  } = {}): Promise<AdminUserListResult> {
    const search = new URLSearchParams();

    if (params.search?.trim()) {
      search.set('search', params.search.trim());
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
};
