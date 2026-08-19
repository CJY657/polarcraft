import { FormEvent, KeyboardEvent, PointerEvent, ReactNode, useEffect, useId, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Copy,
  Eye,
  FlaskConical,
  GraduationCap,
  LogIn,
  MailWarning,
  MousePointerClick,
  RefreshCw,
  Search,
  UserPlus,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { PersistentHeader } from '@/components/shared/PersistentHeader';
import { Dialog } from '@/components/ui/dialog';
import { useTheme } from '@/contexts/ThemeContext';
import {
  adminUserApi,
  type AdminUserDetail,
  type AdminUserListItem,
  type AdminUserPostHogAnalyticsResponse,
  type AdminUserPostHogDailyActivity,
  type AdminUserRoleFilter,
  type AdminUserSortField,
  type AdminUserSortOrder,
  type AdminUserStats,
  type AdminUserStatusFilter,
  type AdminUserTypeFilter,
} from '@/lib/admin-user.service';
import { formatUserIdentity } from '@/lib/identity';
import { buildValueAxis, formatAxisDay, formatAxisValue, pickTickIndices } from '@/lib/chart-axis';
import { formatDateTime } from '@/lib/datetime.util';
import { cn } from '@/utils/classNames';

const PAGE_SIZE = 20;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatRelativeTime(value: string): string {
  const elapsedMs = Date.now() - new Date(value).getTime();
  if (elapsedMs < 0) {
    return formatDateTime(value);
  }

  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 1) {
    return '刚刚';
  }
  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} 小时前`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} 天前`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} 个月前`;
  }

  return `${Math.floor(months / 12)} 年前`;
}

function formatMonth(value: string): string {
  const [year, month] = value.split('-');
  return `${year}年${Number.parseInt(month, 10)}月`;
}

function roleLabel(role: AdminUserListItem['role']): string {
  return role === 'admin' ? '管理员' : '普通用户';
}

function userTypeLabel(userType: AdminUserListItem['user_type'] | undefined): string {
  if (userType === 'student') return '学生';
  if (userType === 'teacher') return '教师';
  return '未分类';
}

function formatAdminUserIdentity(user: AdminUserListItem | null | undefined): string {
  return formatUserIdentity(user, '用户', { includePrivateRealName: true });
}

function formatOptionalDateTime(value: string | null | undefined): string {
  return value ? formatDateTime(value) : '暂无记录';
}

const APPLICATION_STATUS_LABELS: Record<
  AdminUserDetail['research']['applications'][number]['status'],
  { label: string; tone: BadgeTone }
> = {
  pending: { label: '待审核', tone: 'amber' },
  approved: { label: '已通过', tone: 'green' },
  rejected: { label: '未通过', tone: 'red' },
  withdrawn: { label: '已撤回', tone: 'slate' },
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<AdminUserRoleFilter>('all');
  const [status, setStatus] = useState<AdminUserStatusFilter>('all');
  const [userType, setUserType] = useState<AdminUserTypeFilter>('all');
  const [sortBy, setSortBy] = useState<AdminUserSortField>('created_at');
  const [sortOrder, setSortOrder] = useState<AdminUserSortOrder>('desc');
  const [page, setPage] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [detailResult, setDetailResult] = useState<AdminUserDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [analyticsResult, setAnalyticsResult] =
    useState<AdminUserPostHogAnalyticsResponse | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const result = await adminUserApi.getStats();
      setStats(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '获取用户统计失败');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const result = await adminUserApi.list({
        search,
        role,
        status,
        userType,
        sortBy,
        sortOrder,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '获取用户列表失败');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    setError(null);
    void loadStats();
  }, []);

  useEffect(() => {
    setError(null);
    void loadUsers();
  }, [search, role, status, userType, sortBy, sortOrder, page]);

  useEffect(() => {
    if (!selectedUser) {
      setDetailResult(null);
      setDetailError(null);
      setIsLoadingDetail(false);
      setAnalyticsResult(null);
      setAnalyticsError(null);
      setIsLoadingAnalytics(false);
      return;
    }

    let cancelled = false;

    setDetailResult(null);
    setDetailError(null);
    setIsLoadingDetail(true);
    setAnalyticsResult(null);
    setAnalyticsError(null);
    setIsLoadingAnalytics(true);

    void adminUserApi
      .getDetail(selectedUser.id)
      .then((result) => {
        if (!cancelled) {
          setDetailResult(result);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setDetailError(loadError instanceof Error ? loadError.message : '获取用户详情失败');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDetail(false);
        }
      });

    void adminUserApi
      .getPostHogAnalytics(selectedUser.id)
      .then((result) => {
        if (!cancelled) {
          setAnalyticsResult(result);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setAnalyticsError(loadError instanceof Error ? loadError.message : '获取行为数据失败');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingAnalytics(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedUser]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page + 1, totalPages);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  };

  const handleSort = (field: AdminUserSortField) => {
    setPage(0);
    if (sortBy === field) {
      setSortOrder((current) => (current === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await Promise.all([loadStats(), loadUsers()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={cn('min-h-screen', theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50')}>
      <PersistentHeader
        moduleName="用户管理"
        variant="glass"
        className={cn(
          'sticky top-0 z-40',
          theme === 'dark'
            ? 'border-b border-slate-800 bg-slate-950/80'
            : 'border-b border-slate-200 bg-white/80'
        )}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/admin/units')}
          className={cn(
            'mb-4 inline-flex items-center gap-1 text-sm transition-colors',
            theme === 'dark'
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          返回管理员面板
        </button>

        <div
          className={cn(
            'flex flex-col gap-4 rounded-3xl border px-6 py-6 sm:flex-row sm:items-end sm:justify-between',
            theme === 'dark' ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
          )}
        >
          <div>
            <p className={cn('text-sm', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
              账号总览
            </p>
            <h1
              className={cn(
                'mt-2 text-3xl font-semibold',
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              )}
            >
              用户管理
            </h1>
            <p
              className={cn(
                'mt-3 text-sm leading-7',
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              )}
            >
              查看平台账号规模与基础资料，点击任意用户可查看个人档案、近 10 天活动概览和课题组参与。
              当前版本仅提供只读查询，不会在这里修改账号权限或状态。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isLoadingStats || isLoadingUsers || isRefreshing}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-60',
                theme === 'dark'
                  ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              )}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  (isLoadingStats || isLoadingUsers || isRefreshing) && 'animate-spin'
                )}
              />
              刷新列表
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            theme={theme}
            icon={Users}
            label="累计注册账号"
            value={stats?.total_registered}
            hint={
              stats
                ? `${stats.active_users} 个可用 · ${stats.total_registered - stats.active_users} 个停用`
                : '正在汇总账号规模'
            }
          />
          <SummaryCard
            theme={theme}
            icon={UserPlus}
            label="近 7 天新注册"
            value={stats?.new_users_7d}
            hint="最近一周新加入的账号"
          />
          <SummaryCard
            theme={theme}
            icon={LogIn}
            label="近 7 天登录"
            value={stats?.recent_logins_7d}
            hint="最近一次登录发生在过去 7 个 24 小时内，每个账号只计一次"
          />
          <SummaryCard
            theme={theme}
            icon={MailWarning}
            label="待验证邮箱"
            value={stats?.unverified_emails}
            hint="可用账号中尚未完成邮箱验证"
          />
        </div>

        <div
          className={cn(
            'mt-6 rounded-3xl border p-4',
            theme === 'dark' ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
          )}
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px_160px_auto]">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <label className="sr-only" htmlFor="admin-user-search">
                搜索用户
              </label>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-user-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="按用户名或邮箱搜索"
                  className={cn(
                    'w-full rounded-2xl border px-10 py-2.5 text-sm outline-none transition-colors',
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
                      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'
                  )}
                />
              </div>
              <button
                type="submit"
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm font-medium',
                  theme === 'dark'
                    ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                    : 'bg-cyan-600 text-white hover:bg-cyan-700'
                )}
              >
                搜索
              </button>
            </form>

            <label className="grid gap-1.5 text-sm">
              <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>身份筛选</span>
              <select
                value={userType}
                onChange={(event) => {
                  setPage(0);
                  setUserType(event.target.value as AdminUserTypeFilter);
                }}
                className={cn(
                  'rounded-2xl border px-3 py-2.5 outline-none',
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-950 text-slate-100'
                    : 'border-slate-200 bg-slate-50 text-slate-900'
                )}
              >
                <option value="all">全部身份</option>
                <option value="student">学生</option>
                <option value="teacher">教师</option>
                <option value="unclassified">未分类</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>权限筛选</span>
              <select
                value={role}
                onChange={(event) => {
                  setPage(0);
                  setRole(event.target.value as AdminUserRoleFilter);
                }}
                className={cn(
                  'rounded-2xl border px-3 py-2.5 outline-none',
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-950 text-slate-100'
                    : 'border-slate-200 bg-slate-50 text-slate-900'
                )}
              >
                <option value="all">全部权限</option>
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>状态筛选</span>
              <select
                value={status}
                onChange={(event) => {
                  setPage(0);
                  setStatus(event.target.value as AdminUserStatusFilter);
                }}
                className={cn(
                  'rounded-2xl border px-3 py-2.5 outline-none',
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-950 text-slate-100'
                    : 'border-slate-200 bg-slate-50 text-slate-900'
                )}
              >
                <option value="all">全部状态</option>
                <option value="active">有效</option>
                <option value="inactive">停用</option>
              </select>
            </label>

            <div className="flex items-end">
              <div className={cn('text-sm', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                共 {total} 位用户
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div
            className={cn(
              'mt-6 rounded-2xl border px-4 py-3 text-sm',
              theme === 'dark'
                ? 'border-red-500/20 bg-red-500/10 text-red-300'
                : 'border-red-200 bg-red-50 text-red-700'
            )}
          >
            {error}
          </div>
        ) : null}

        {isLoadingUsers ? (
          <div
            className={cn(
              'mt-6 flex items-center justify-center rounded-3xl border px-6 py-16',
              theme === 'dark' ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-3 text-sm',
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              <RefreshCw className="h-4 w-4 animate-spin" />
              正在加载用户列表...
            </div>
          </div>
        ) : null}

        {!isLoadingUsers && items.length === 0 ? (
          <div
            className={cn(
              'mt-6 rounded-3xl border px-6 py-16 text-center',
              theme === 'dark'
                ? 'border-slate-800 bg-slate-900/70 text-slate-400'
                : 'border-slate-200 bg-white text-slate-500'
            )}
          >
            当前筛选条件下还没有用户记录。
          </div>
        ) : null}

        {!isLoadingUsers && items.length > 0 ? (
          <div
            className={cn(
              'mt-6 overflow-hidden rounded-3xl border',
              theme === 'dark' ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
            )}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/70 text-left">
                <thead className={theme === 'dark' ? 'bg-slate-950/70' : 'bg-slate-50'}>
                  <tr
                    className={cn(
                      'text-sm',
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    <th className="px-5 py-4 font-medium">用户</th>
                    <th className="px-5 py-4 font-medium">邮箱</th>
                    <th className="px-5 py-4 font-medium">身份</th>
                    <th className="px-5 py-4 font-medium">权限</th>
                    <th className="px-5 py-4 font-medium">状态</th>
                    <th className="px-5 py-4 font-medium">
                      <SortableHeader
                        label="注册时间"
                        field="created_at"
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-5 py-4 font-medium">
                      <SortableHeader
                        label="最后登录"
                        field="last_login_at"
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-5 py-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody
                  className={cn(
                    'divide-y text-base',
                    theme === 'dark' ? 'divide-slate-800 text-slate-200' : 'divide-slate-200 text-slate-700'
                  )}
                >
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedUser(item)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center overflow-hidden rounded-full',
                              theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
                            )}
                          >
                            {item.avatar_url ? (
                              <img
                                src={item.avatar_url}
                                alt={formatAdminUserIdentity(item)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{formatAdminUserIdentity(item)}</div>
                            <div className="text-xs text-slate-500">@{item.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">{item.email || '未填写'}</td>
                      <td className="px-5 py-4">
                        <UserTypeBadge theme={theme} userType={item.user_type} />
                      </td>
                      <td className="px-5 py-4">{roleLabel(item.role)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge
                            theme={theme}
                            active={item.is_active}
                            activeLabel="有效"
                            inactiveLabel="停用"
                          />
                          <StatusBadge
                            theme={theme}
                            active={item.email_verified}
                            activeLabel="已验证"
                            inactiveLabel="未验证"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">{formatDate(item.created_at)}</td>
                      <td className="px-5 py-4">
                        {item.last_login_at ? (
                          <span title={formatDateTime(item.last_login_at)}>
                            {formatRelativeTime(item.last_login_at)}
                          </span>
                        ) : (
                          '从未登录'
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          aria-label={`查看 ${formatAdminUserIdentity(item)} 的详情`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedUser(item);
                          }}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                            theme === 'dark'
                              ? 'bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20'
                              : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                          )}
                        >
                          <Activity className="h-3.5 w-3.5" />
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className={cn(
                'flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
                theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
              )}
            >
              <div className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                  className={paginationButtonClass(theme)}
                >
                  上一页
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  className={paginationButtonClass(theme)}
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <UserDetailDialog
        theme={theme}
        user={selectedUser}
        detail={detailResult}
        isLoadingDetail={isLoadingDetail}
        detailError={detailError}
        analytics={analyticsResult}
        isLoadingAnalytics={isLoadingAnalytics}
        analyticsError={analyticsError}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  theme,
  icon: Icon,
}: {
  label: string;
  value: number | undefined;
  hint: string;
  theme: string;
  icon: typeof Users;
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border px-5 py-5',
        theme === 'dark' ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex items-center justify-between">
        <p className={cn('text-sm', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>{label}</p>
        <Icon className={cn('h-5 w-5', theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600')} />
      </div>
      <p className={cn('mt-2 text-3xl font-semibold', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
        {value ?? '-'}
      </p>
      <p className={cn('mt-2 text-sm leading-6', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
        {hint}
      </p>
    </div>
  );
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  field: AdminUserSortField;
  sortBy: AdminUserSortField;
  sortOrder: AdminUserSortOrder;
  onSort: (field: AdminUserSortField) => void;
}) {
  const isActive = sortBy === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      aria-label={`按${label}排序`}
      className="inline-flex items-center gap-1 font-medium transition-opacity hover:opacity-70"
    >
      {label}
      {isActive ? (
        sortOrder === 'desc' ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUp className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  );
}

type BadgeTone = 'green' | 'amber' | 'red' | 'slate' | 'cyan';

function ToneBadge({ tone, theme, children }: { tone: BadgeTone; theme: string; children: string }) {
  const toneClasses: Record<BadgeTone, string> =
    theme === 'dark'
      ? {
          green: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
          amber: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
          red: 'border-red-400/20 bg-red-500/10 text-red-300',
          slate: 'border-slate-700 bg-slate-800 text-slate-300',
          cyan: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
        }
      : {
          green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
          amber: 'border-amber-200 bg-amber-50 text-amber-700',
          red: 'border-red-200 bg-red-50 text-red-700',
          slate: 'border-slate-200 bg-slate-100 text-slate-600',
          cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
        };

  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
  theme,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  theme: string;
}) {
  return (
    <ToneBadge tone={active ? 'green' : 'slate'} theme={theme}>
      {active ? activeLabel : inactiveLabel}
    </ToneBadge>
  );
}

function UserTypeBadge({
  userType,
  theme,
}: {
  userType: AdminUserListItem['user_type'] | undefined;
  theme: string;
}) {
  const tone: BadgeTone = userType === 'student' ? 'green' : userType === 'teacher' ? 'cyan' : 'slate';
  return (
    <ToneBadge tone={tone} theme={theme}>
      {userTypeLabel(userType)}
    </ToneBadge>
  );
}

function paginationButtonClass(theme: string) {
  return cn(
    'rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    theme === 'dark'
      ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
      : 'bg-slate-900 text-white hover:bg-slate-800'
  );
}

function UserDetailDialog({
  theme,
  user,
  detail,
  isLoadingDetail,
  detailError,
  analytics,
  isLoadingAnalytics,
  analyticsError,
  onClose,
}: {
  theme: string;
  user: AdminUserListItem | null;
  detail: AdminUserDetail | null;
  isLoadingDetail: boolean;
  detailError: string | null;
  analytics: AdminUserPostHogAnalyticsResponse | null;
  isLoadingAnalytics: boolean;
  analyticsError: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

  useEffect(() => {
    setCopied(false);
    setIsProfileExpanded(false);
  }, [user?.id]);

  const handleCopyId = async () => {
    if (!user) {
      return;
    }
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied, nothing actionable for the teacher here
    }
  };

  const mutedText = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const strongText = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const panelClass =
    theme === 'dark' ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50';
  const isProfileLoading = isLoadingDetail || (!detail && !detailError);
  const educationPreview = isProfileLoading
    ? '教育经历加载中'
    : detailError
      ? '教育经历加载失败'
      : `教育经历 ${detail?.educations.length ?? 0} 条`;
  const analyticsSummary = analytics?.summary;
  const analyticsDaily = analyticsSummary?.daily ?? [];
  const hasAnalyticsActivity = Boolean(
    analyticsSummary &&
      (analyticsSummary.last_activity ||
        analyticsSummary.meaningful_events ||
        analyticsSummary.pageviews ||
        analyticsSummary.learning_actions)
  );

  return (
    <Dialog
      isOpen={Boolean(user)}
      onClose={onClose}
      className={cn(
        'max-w-3xl',
        theme === 'dark'
          ? 'border-slate-700 bg-slate-900 text-slate-100'
          : 'border-slate-200 bg-white text-slate-900'
      )}
    >
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center overflow-hidden rounded-full',
                theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
              )}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={formatAdminUserIdentity(user)} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-7 w-7 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={cn('text-xl font-semibold', strongText)}>
                  {formatAdminUserIdentity(user)}
                </h2>
                {user ? (
                  <UserTypeBadge theme={theme} userType={user.user_type} />
                ) : null}
                {user ? (
                  <ToneBadge tone={user.role === 'admin' ? 'cyan' : 'slate'} theme={theme}>
                    {roleLabel(user.role)}
                  </ToneBadge>
                ) : null}
                {user ? (
                  <ToneBadge tone={user.is_active ? 'green' : 'slate'} theme={theme}>
                    {user.is_active ? '有效' : '停用'}
                  </ToneBadge>
                ) : null}
              </div>
              <div className={cn('mt-1 flex items-center gap-1.5 text-sm', mutedText)}>
                <span>ID: {user ? `${user.id.slice(0, 8)}...` : ''}</span>
                <button
                  type="button"
                  aria-label="复制用户 ID"
                  onClick={() => void handleCopyId()}
                  className={cn(
                    'rounded p-1 transition-colors',
                    theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  )}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="关闭用户详情"
            onClick={onClose}
            className={cn(
              'rounded-full p-2 transition-colors',
              theme === 'dark'
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <details
          open={isProfileExpanded}
          className={cn('mt-6 overflow-hidden rounded-2xl border', panelClass)}
        >
          <summary
            aria-controls="admin-user-profile-content"
            aria-expanded={isProfileExpanded}
            onClick={(event) => {
              event.preventDefault();
              setIsProfileExpanded((current) => !current);
            }}
            className={cn(
              'flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset [&::-webkit-details-marker]:hidden',
              theme === 'dark' ? 'focus-visible:ring-cyan-300' : 'focus-visible:ring-cyan-600'
            )}
          >
            <div className="min-w-0">
              <div className={cn('flex items-center gap-2 font-semibold', strongText)}>
                <GraduationCap
                  aria-hidden="true"
                  className={cn(
                    'h-4 w-4 shrink-0',
                    theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'
                  )}
                />
                个人档案
              </div>
              <div className={cn('mt-2 flex flex-col gap-1 text-sm sm:flex-row sm:gap-4', mutedText)}>
                <span className="truncate">{user?.email || '未填写邮箱'}</span>
                <span>{educationPreview}</span>
              </div>
            </div>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                'h-5 w-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none',
                mutedText,
                isProfileExpanded && 'rotate-180'
              )}
            />
          </summary>

          <div
            id="admin-user-profile-content"
            className={cn(
              'border-t px-4 py-4',
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            )}
          >
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className={cn('text-sm', mutedText)}>邮箱</dt>
                <dd className={cn('mt-1 break-all text-base font-medium', strongText)}>
                  {user?.email || '未填写邮箱'}
                </dd>
              </div>
              <div>
                <dt className={cn('text-sm', mutedText)}>注册时间</dt>
                <dd className={cn('mt-1 text-base font-medium', strongText)}>
                  {user ? formatDateTime(user.created_at) : '暂无记录'}
                </dd>
              </div>
              <div>
                <dt className={cn('text-sm', mutedText)}>最后登录</dt>
                <dd className={cn('mt-1 text-base font-medium', strongText)}>
                  {user?.last_login_at ? formatDateTime(user.last_login_at) : '从未登录'}
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <h4 className={cn('mb-3 text-sm font-semibold', strongText)}>教育经历</h4>
              {isProfileLoading ? (
                <div className={cn('rounded-2xl border px-4 py-4 text-sm', panelClass, mutedText)}>
                  正在加载教育经历...
                </div>
              ) : null}
              {!isProfileLoading && detailError ? (
                <div
                  className={cn(
                    'rounded-2xl border px-4 py-4 text-sm',
                    theme === 'dark'
                      ? 'border-red-400/20 bg-red-500/10 text-red-200'
                      : 'border-red-200 bg-red-50 text-red-700'
                  )}
                >
                  {detailError}
                </div>
              ) : null}
              {!isProfileLoading && !detailError && detail?.educations.length === 0 ? (
                <EmptyHint theme={theme}>该用户还没有填写教育经历</EmptyHint>
              ) : null}
              {!isProfileLoading && !detailError && detail && detail.educations.length > 0 ? (
                <ul className="space-y-2">
                  {detail.educations.map((education) => (
                    <li
                      key={education.id}
                      className={cn('rounded-2xl border px-4 py-3', panelClass)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('text-base font-medium', strongText)}>
                          {education.organization}
                        </span>
                        <span className={cn('text-sm', mutedText)}>{education.major}</span>
                        {education.degree_level ? (
                          <ToneBadge tone="cyan" theme={theme}>
                            {education.degree_level}
                          </ToneBadge>
                        ) : null}
                      </div>
                      <div className={cn('mt-1 text-sm', mutedText)}>
                        {formatMonth(education.start_date)} -{' '}
                        {education.end_date ? formatMonth(education.end_date) : '至今'}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </details>

        <DetailSection theme={theme} icon={Activity} title="近 10 天活动概览">
          {isLoadingAnalytics || (!analytics && !analyticsError) ? (
            <div
              aria-label="正在加载近 10 天活动概览"
              className="grid gap-3 sm:grid-cols-2"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  className={cn(
                    'relative h-28 overflow-hidden rounded-2xl border p-4',
                    panelClass
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-x-0 top-0 h-1 animate-pulse motion-reduce:animate-none',
                      theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
                    )}
                  />
                  <div
                    className={cn(
                      'h-4 w-20 animate-pulse rounded motion-reduce:animate-none',
                      theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                    )}
                  />
                  <div
                    className={cn(
                      'mt-5 h-7 w-28 animate-pulse rounded motion-reduce:animate-none',
                      theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                    )}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {!isLoadingAnalytics && analyticsError ? (
            <div
              className={cn(
                'rounded-2xl border px-4 py-4 text-sm',
                theme === 'dark'
                  ? 'border-red-400/20 bg-red-500/10 text-red-200'
                  : 'border-red-200 bg-red-50 text-red-700'
              )}
            >
              {analyticsError}
            </div>
          ) : null}

          {!isLoadingAnalytics && !analyticsError && analytics?.status === 'disabled' ? (
            <div
              className={cn(
                'rounded-2xl border px-4 py-4 text-sm',
                theme === 'dark'
                  ? 'border-amber-400/20 bg-amber-500/10 text-amber-100'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              )}
            >
              行为统计尚未启用
            </div>
          ) : null}

          {!isLoadingAnalytics &&
          !analyticsError &&
          (analytics?.status === 'not_found' ||
            (analytics?.status === 'ok' && !hasAnalyticsActivity)) ? (
            <EmptyHint theme={theme}>近 10 天暂无活动数据</EmptyHint>
          ) : null}

          {!isLoadingAnalytics &&
          !analyticsError &&
          analytics?.status === 'ok' &&
          analyticsSummary &&
          hasAnalyticsActivity ? (
            <>
              {analyticsDaily.length > 1 ? (
                <div className={cn('mb-3 rounded-2xl border p-4', panelClass)}>
                  <p className={cn('text-sm font-medium', mutedText)}>每日有效活动</p>
                  <p className={cn('mt-1 text-xs leading-5', mutedText)}>
                    每个趋势点表示当天纳入统计的有效活动次数。
                  </p>
                  <ActivityTrendChart daily={analyticsDaily} theme={theme} />
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2" aria-label="用户近 10 天活动指标">
              {[
                {
                  label: '最近活跃',
                  value: formatOptionalDateTime(analyticsSummary.last_activity),
                  description: '纳入统计的活动中，时间最晚的一次。',
                  icon: Clock3,
                  accent: '#ff4d8b',
                },
                {
                  label: '有效活动',
                  value: analyticsSummary.meaningful_events.toLocaleString('zh-CN'),
                  description: '已识别账号的活动，排除自动采集、离开、身份识别和属性设置等事件。',
                  icon: Activity,
                  accent: '#2f8f83',
                },
                {
                  label: '页面访问',
                  value: analyticsSummary.pageviews.toLocaleString('zh-CN'),
                  description: '纳入统计的页面访问次数。',
                  icon: Eye,
                  accent: '#9b87d9',
                },
                {
                  label: '学习行为',
                  value: analyticsSummary.learning_actions.toLocaleString('zh-CN'),
                  description: '进入实验，以及在虚拟课题组里建课题、提交申请、讨论、交证据、完成任务的合计次数。',
                  icon: MousePointerClick,
                  accent: '#d4a72c',
                },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className={cn(
                      'relative min-h-28 overflow-hidden rounded-2xl border p-4',
                      panelClass
                    )}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ backgroundColor: metric.accent }}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <p className={cn('text-sm font-medium', mutedText)}>{metric.label}</p>
                      <Icon
                        aria-hidden="true"
                        className="h-5 w-5"
                        style={{ color: metric.accent }}
                      />
                    </div>
                    <p className={cn('mt-4 break-words text-xl font-semibold tabular-nums', strongText)}>
                      {metric.value}
                    </p>
                    <p className={cn('mt-2 text-xs leading-5', mutedText)}>
                      {metric.description}
                    </p>
                  </div>
                );
              })}
              </div>
            </>
          ) : null}

          {user ? (
            <Link
              to={`/admin/activity/user/${encodeURIComponent(user.id)}`}
              className={cn(
                'mt-3 inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors',
                theme === 'dark'
                  ? 'border-slate-700 text-slate-100 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-900 hover:bg-slate-50'
              )}
            >
              <Activity className="h-4 w-4" aria-hidden="true" />
              查看完整活动分析
            </Link>
          ) : null}
        </DetailSection>

        {!isLoadingDetail && detail ? (
          <DetailSection theme={theme} icon={FlaskConical} title="课题组参与">
              {detail.research.memberships.length === 0 &&
              detail.research.applications.length === 0 ? (
                <EmptyHint theme={theme}>该用户尚未加入或申请任何课题组</EmptyHint>
              ) : (
                <div className="space-y-3">
                  {detail.research.memberships.length > 0 ? (
                    <ul className="space-y-2">
                      {detail.research.memberships.map((membership) => (
                        <li
                          key={membership.project_id}
                          className={cn(
                            'flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3',
                            panelClass
                          )}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn('text-base font-medium', strongText)}>
                              {membership.project_name || '未命名课题'}
                            </span>
                            <ToneBadge
                              tone={membership.role === 'owner' ? 'cyan' : 'slate'}
                              theme={theme}
                            >
                              {membership.role === 'owner' ? '负责人' : '成员'}
                            </ToneBadge>
                          </div>
                          {membership.joined_at ? (
                            <span className={cn('text-sm', mutedText)}>
                              {formatDate(membership.joined_at)} 加入
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {detail.research.applications.length > 0 ? (
                    <div>
                      <div className={cn('mb-2 text-sm font-medium', mutedText)}>课题申请记录</div>
                      <ul className="space-y-2">
                        {detail.research.applications.map((application) => {
                          const statusMeta = APPLICATION_STATUS_LABELS[application.status];
                          return (
                            <li
                              key={application.id}
                              className={cn(
                                'flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3',
                                panelClass
                              )}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={cn('text-base font-medium', strongText)}>
                                  {application.project_name || '未命名课题'}
                                </span>
                                <ToneBadge tone={statusMeta.tone} theme={theme}>
                                  {statusMeta.label}
                                </ToneBadge>
                              </div>
                              <span className={cn('text-sm', mutedText)}>
                                {formatDate(application.created_at)} 申请
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
          </DetailSection>
        ) : null}
      </div>
    </Dialog>
  );
}

const TREND_WIDTH = 600;
const TREND_HEIGHT = 172;
const TREND_TOP = 26;
const TREND_BOTTOM = 30;
/** 左侧留给纵轴刻度文字。 */
const TREND_LEFT = 44;
const TREND_RIGHT = 12;

function formatDayFull(date: string): string {
  const [, month, day] = date.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

function ActivityTrendChart({
  daily,
  theme,
}: {
  daily: AdminUserPostHogDailyActivity[];
  theme: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const gradientId = useId();
  const tableId = useId();

  if (daily.length < 2) {
    return null;
  }

  const lineColor = theme === 'dark' ? '#2ba18f' : '#0d9488';
  const surfaceColor = theme === 'dark' ? '#070d1f' : '#f8fafc';
  const hairlineColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const axisColor = theme === 'dark' ? '#64748b' : '#cbd5e1';
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const crosshairColor = theme === 'dark' ? '#475569' : '#cbd5e1';

  const plotHeight = TREND_HEIGHT - TREND_TOP - TREND_BOTTOM;
  const plotWidth = TREND_WIDTH - TREND_LEFT - TREND_RIGHT;
  const baseline = TREND_TOP + plotHeight;
  const maxValue = Math.max(...daily.map((day) => day.events));
  const axis = buildValueAxis(maxValue, 3);
  const peakIndex = daily.findIndex((day) => day.events === maxValue);
  const lastIndex = daily.length - 1;
  const x = (index: number) => TREND_LEFT + (index * plotWidth) / lastIndex;
  const y = (value: number) => baseline - (value / axis.max) * plotHeight;
  const points = daily.map((day, index) => `${x(index)},${y(day.events)}`).join(' ');
  const areaPath = [
    `M ${x(0)} ${baseline}`,
    ...daily.map((day, index) => `L ${x(index)} ${y(day.events)}`),
    `L ${x(lastIndex)} ${baseline}`,
    'Z',
  ].join(' ');
  const dayTicks = pickTickIndices(daily.length, 5);
  const leftPercent = (index: number) =>
    Math.min(90, Math.max(12, (x(index) / TREND_WIDTH) * 100));
  const active = activeIndex === null ? null : daily[activeIndex];

  const indexFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // 指针位置换算成数据下标时要扣掉纵轴刻度占的左边距。
    const plotLeft = rect.left + (TREND_LEFT / TREND_WIDTH) * rect.width;
    const plotSpan = (plotWidth / TREND_WIDTH) * rect.width;
    const ratio = plotSpan === 0 ? 0 : (event.clientX - plotLeft) / plotSpan;
    return Math.min(lastIndex, Math.max(0, Math.round(ratio * lastIndex)));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const step = event.key === 'ArrowLeft' ? -1 : 1;
      setActiveIndex((current) =>
        Math.min(lastIndex, Math.max(0, (current ?? lastIndex) + step))
      );
    } else if (event.key === 'Escape') {
      setActiveIndex(null);
    }
  };

  return (
    <div>
      <div
        role="img"
        aria-label={`近 ${daily.length} 天每日有效活动趋势，按左右方向键查看单日数值`}
        aria-describedby={tableId}
        tabIndex={0}
        onPointerMove={(event) => setActiveIndex(indexFromPointer(event))}
        onPointerLeave={() => setActiveIndex(null)}
        onKeyDown={handleKeyDown}
        onBlur={() => setActiveIndex(null)}
        className={cn(
          'relative mt-2 rounded-xl outline-none focus-visible:ring-2',
          theme === 'dark' ? 'focus-visible:ring-cyan-300' : 'focus-visible:ring-cyan-600'
        )}
      >
        <svg
          viewBox={`0 0 ${TREND_WIDTH} ${TREND_HEIGHT}`}
          className="h-auto w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* 纵轴刻度：次数 */}
          {axis.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={TREND_LEFT}
                x2={TREND_WIDTH - TREND_RIGHT}
                y1={y(tick)}
                y2={y(tick)}
                stroke={tick === 0 ? axisColor : hairlineColor}
                strokeWidth="1"
                strokeDasharray={tick === 0 ? undefined : '4 4'}
              />
              <text
                x={TREND_LEFT - 8}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fill={tickColor}
                fontSize="12"
              >
                {formatAxisValue(tick)}
              </text>
            </g>
          ))}
          <line
            x1={TREND_LEFT}
            x2={TREND_LEFT}
            y1={TREND_TOP}
            y2={baseline}
            stroke={axisColor}
            strokeWidth="1"
          />
          {/* 横轴刻度：日期 */}
          {dayTicks.map((index) => (
            <g key={daily[index].date}>
              <line
                x1={x(index)}
                x2={x(index)}
                y1={baseline}
                y2={baseline + 4}
                stroke={axisColor}
                strokeWidth="1"
              />
              <text
                x={x(index)}
                y={baseline + 18}
                textAnchor={index === 0 ? 'start' : index === lastIndex ? 'end' : 'middle'}
                fill={tickColor}
                fontSize="12"
              >
                {formatAxisDay(daily[index].date)}
              </text>
            </g>
          ))}
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <polyline
            points={points}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {daily.map((day, index) => (
            <circle key={day.date} cx={x(index)} cy={y(day.events)} r="2.5" fill={lineColor} />
          ))}
          {activeIndex !== null ? (
            <line
              x1={x(activeIndex)}
              x2={x(activeIndex)}
              y1={TREND_TOP - 6}
              y2={baseline}
              stroke={crosshairColor}
              strokeWidth="1"
            />
          ) : null}
          <circle cx={x(lastIndex)} cy={y(daily[lastIndex].events)} r="6" fill={surfaceColor} />
          <circle cx={x(lastIndex)} cy={y(daily[lastIndex].events)} r="4" fill={lineColor} />
          {activeIndex !== null ? (
            <>
              <circle
                cx={x(activeIndex)}
                cy={y(daily[activeIndex].events)}
                r="6"
                fill={surfaceColor}
              />
              <circle
                cx={x(activeIndex)}
                cy={y(daily[activeIndex].events)}
                r="4"
                fill={lineColor}
              />
            </>
          ) : null}
        </svg>

        {maxValue > 0 && activeIndex === null ? (
          <span
            className={cn(
              'absolute -translate-x-1/2 -translate-y-full text-xs font-medium tabular-nums',
              theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
            )}
            style={{
              left: `${leftPercent(peakIndex)}%`,
              top: `${(y(maxValue) / TREND_HEIGHT) * 100}%`,
            }}
          >
            {maxValue.toLocaleString('zh-CN')}
          </span>
        ) : null}

        {active ? (
          <div
            className={cn(
              'pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border px-2.5 py-1.5 text-center shadow-sm',
              theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
            )}
            style={{ left: `${leftPercent(activeIndex ?? 0)}%` }}
          >
            <div
              className={cn(
                'text-sm font-semibold tabular-nums',
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              )}
            >
              {active.events.toLocaleString('zh-CN')}
            </div>
            <div className={cn('text-xs', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
              {formatDayFull(active.date)}
            </div>
          </div>
        ) : null}
      </div>

      <p
        className={cn(
          'mt-1 text-xs',
          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
        )}
      >
        纵轴：当日有效活动次数（次）· 横轴：日期（月/日）
      </p>

      <table id={tableId} className="sr-only">
        <caption>近 {daily.length} 天每日有效活动数据</caption>
        <thead>
          <tr>
            <th>日期</th>
            <th>有效活动</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.events}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailSection({
  theme,
  icon: Icon,
  title,
  children,
}: {
  theme: string;
  icon: typeof Users;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6">
      <h3
        className={cn(
          'mb-3 flex items-center gap-2 text-base font-semibold',
          theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
        )}
      >
        <Icon className={cn('h-4 w-4', theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600')} />
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyHint({ theme, children }: { theme: string; children: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-4 text-sm',
        theme === 'dark'
          ? 'border-slate-800 bg-slate-950/60 text-slate-400'
          : 'border-slate-200 bg-slate-50 text-slate-500'
      )}
    >
      {children}
    </div>
  );
}
