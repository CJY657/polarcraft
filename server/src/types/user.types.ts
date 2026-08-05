/**
 * User API Type Definitions
 * 用户 API 类型定义
 */

import { UserRole, UserType } from './auth.types.js';

// =====================================================
// User Update Types / 用户更新类型
// =====================================================

/** Update profile input / 更新个人信息输入 */
export interface UpdateProfileInput {
  username?: string;
  real_name?: string;
  show_real_name_publicly?: boolean;
  email?: string;
  avatar_url?: string;
  user_type?: UserType;
}

/** User profile response / 用户信息响应 */
export interface UserProfileResponse {
  id: string;
  username: string;
  nickname: string | null;
  real_name: string | null;
  show_real_name_publicly: boolean;
  role: UserRole;
  user_type: UserType | null;
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

/** Admin list identity filter / 管理员用户列表身份筛选 */
export type AdminUserTypeFilter = UserType | 'unclassified';

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
  show_real_name_publicly: boolean;
  role: UserRole;
  user_type: UserType | null;
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
  userType?: AdminUserTypeFilter;
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

/** Admin PostHog 10-day summary / 管理员可见的 PostHog 10 天摘要 */
/** One day of meaningful events inside the summary window / 概览窗口内单日有效活动 */
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
  daily: AdminUserPostHogDailyActivity[];
}

/** Admin user PostHog analytics response / 管理员用户 PostHog 行为响应 */
export interface AdminUserPostHogAnalyticsResponse {
  status: 'ok' | 'not_found' | 'disabled';
  person: AdminUserPostHogPerson | null;
  summary: AdminUserPostHogSummary | null;
}

/** Administrator activity date range / 管理员活动看板时间范围 */
export interface AdminUserActivityDateRange {
  start: string;
  end: string;
  days: number;
}

/** Administrator activity identity segment / 管理员活动看板身份分组 */
export type AdminUserActivitySegment = UserType | 'all';

/** Per-module user interest / 各模块用户兴趣统计 */
export interface AdminUserActivityModuleBreakdown {
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

/** Administrator user activity dashboard / 管理员用户行为看板 */
export interface AdminUserActivityDashboardResponse {
  status: 'ok' | 'disabled';
  segment: AdminUserActivitySegment;
  range: AdminUserActivityDateRange;
  generated_at: string;
  summary: {
    active_users: number;
    meaningful_events: number;
    pageviews: number;
    learning_actions: number;
  } | null;
  /** Same totals over the preceding equal-length window / 上一周期同长度窗口的同类汇总 */
  previous_summary: {
    range: AdminUserActivityDateRange;
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
  module_breakdown: AdminUserActivityModuleBreakdown[];
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

/** Totals for a single learner over one window / 单个学生在某窗口内的汇总 */
export interface AdminUserActivityDetailSummary {
  meaningful_events: number;
  pageviews: number;
  learning_actions: number;
  active_days: number;
  average_meaningful_events_per_active_day: number;
  learning_action_rate: number;
}

/** Single-learner activity detail / 管理员查看的单个学生活动详情 */
export interface AdminUserActivityDetailResponse {
  status: 'ok' | 'disabled';
  username: string;
  display_name: string;
  user_type: UserType | null;
  range: AdminUserActivityDateRange;
  previous_range: AdminUserActivityDateRange;
  generated_at: string;
  last_activity: string | null;
  summary: AdminUserActivityDetailSummary | null;
  previous_summary: AdminUserActivityDetailSummary | null;
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
    active_days: number;
  }>;
  /** weekday: 1 = Monday … 7 = Sunday, hour: 0-23, both in Asia/Shanghai. */
  hourly: Array<{
    weekday: number;
    hour: number;
    count: number;
  }>;
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
