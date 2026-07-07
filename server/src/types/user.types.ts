/**
 * User API Type Definitions
 * 用户 API 类型定义
 */

import { UserRole } from './auth.types.js';

// =====================================================
// User Update Types / 用户更新类型
// =====================================================

/** Update profile input / 更新个人信息输入 */
export interface UpdateProfileInput {
  username?: string;
  real_name?: string;
  email?: string;
  avatar_url?: string;
}

/** User profile response / 用户信息响应 */
export interface UserProfileResponse {
  id: string;
  username: string;
  nickname: string | null;
  real_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  email: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

// =====================================================
// Admin User Management Types / 管理员用户管理类型
// =====================================================

/** Admin list status filter / 管理员用户列表状态筛选 */
export type AdminUserStatusFilter = 'active' | 'inactive';

/** Admin list sortable fields / 管理员用户列表可排序字段 */
export type AdminUserSortField = 'created_at' | 'last_login_at';

/** Admin list sort order / 管理员用户列表排序方向 */
export type AdminUserSortOrder = 'asc' | 'desc';

/** Safe admin-facing user list item / 管理员可见的安全用户列表项 */
export interface AdminUserListItem {
  id: string;
  username: string;
  nickname: string | null;
  real_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  email: string | null;
  email_verified: boolean;
  is_active: boolean;
  created_at: Date;
  last_login_at: Date | null;
}

/** Admin user list options / 管理员用户列表查询参数 */
export interface ListAdminUsersOptions {
  search?: string;
  role?: UserRole;
  status?: AdminUserStatusFilter;
  limit?: number;
  offset?: number;
  sortBy?: AdminUserSortField;
  sortOrder?: AdminUserSortOrder;
}

/** Admin user list response / 管理员用户列表响应 */
export interface AdminUserListResponse {
  items: AdminUserListItem[];
  total: number;
}

/** Admin user statistics response / 管理员用户统计响应 */
export interface AdminUserStatsResponse {
  total_registered: number;
  active_users: number;
  new_users_7d: number;
  recent_logins_7d: number;
  unverified_emails: number;
}

/** Admin-visible education record / 管理员可见的教育经历 */
export interface AdminUserEducationItem {
  id: string;
  organization: string;
  major: string;
  degree_level: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
}

/** Admin-visible research project membership / 管理员可见的课题组成员关系 */
export interface AdminUserResearchMembershipItem {
  project_id: string;
  project_name: string | null;
  role: 'owner' | 'member';
  joined_at: Date | string | null;
}

/** Admin-visible research project application / 管理员可见的课题申请 */
export interface AdminUserResearchApplicationItem {
  id: string;
  project_id: string;
  project_name: string | null;
  display_name: string;
  organization: string;
  major: string | null;
  grade: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  created_at: Date | string;
  reviewed_at: Date | string | null;
}

/** Admin user detail response / 管理员用户详情响应 */
export interface AdminUserDetailResponse {
  user: AdminUserListItem;
  educations: AdminUserEducationItem[];
  research: {
    memberships: AdminUserResearchMembershipItem[];
    applications: AdminUserResearchApplicationItem[];
  };
}

/** Admin PostHog person summary / 管理员可见的 PostHog 用户摘要 */
export interface AdminUserPostHogPerson {
  id: string;
  uuid: string | null;
  created_at: string | null;
  last_seen_at: string | null;
}

/** Admin PostHog 30-day summary / 管理员可见的 PostHog 30 天摘要 */
export interface AdminUserPostHogSummary {
  window_days: 30;
  event_count_30d: number;
  pageview_count_30d: number;
}

/** Admin PostHog recent event / 管理员可见的 PostHog 最近事件 */
export interface AdminUserPostHogRecentEvent {
  event: string;
  timestamp: string;
  route: string | null;
  url: string | null;
}

/** Admin user PostHog analytics response / 管理员用户 PostHog 行为响应 */
export interface AdminUserPostHogAnalyticsResponse {
  status: 'ok' | 'not_found' | 'disabled';
  person: AdminUserPostHogPerson | null;
  summary: AdminUserPostHogSummary | null;
  recent_events: AdminUserPostHogRecentEvent[];
}

// =====================================================
// Session Management Types / 会话管理类型
// =====================================================

/** Session list response / 会话列表响应 */
export interface SessionsResponse {
  sessions: Array<{
    id: string;
    device_info: string | null;
    ip_address: string | null;
    created_at: string;
    expires_at: string;
    is_current: boolean;
  }>;
  total: number;
}
