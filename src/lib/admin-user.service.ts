import { api } from './api';

export type AdminUserRoleFilter = 'all' | 'user' | 'admin';
export type AdminUserStatusFilter = 'all' | 'active' | 'inactive';

export interface AdminUserListItem {
  id: string;
  username: string;
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

    const query = search.toString();
    const response = await api.get<AdminUserListResult>(
      `/api/users${query ? `?${query}` : ''}`
    );
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || '获取用户列表失败');
  },
};
