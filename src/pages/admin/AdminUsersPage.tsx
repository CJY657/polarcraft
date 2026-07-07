import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  Copy,
  FlaskConical,
  GraduationCap,
  LogIn,
  MailWarning,
  RefreshCw,
  Search,
  UserPlus,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PersistentHeader } from '@/components/shared/PersistentHeader';
import { Dialog } from '@/components/ui/dialog';
import { useTheme } from '@/contexts/ThemeContext';
import {
  adminUserApi,
  type AdminUserDetail,
  type AdminUserListItem,
  type AdminUserPostHogAnalyticsResponse,
  type AdminUserPostHogRecentEvent,
  type AdminUserRoleFilter,
  type AdminUserSortField,
  type AdminUserSortOrder,
  type AdminUserStats,
  type AdminUserStatusFilter,
} from '@/lib/admin-user.service';
import { formatUserIdentity } from '@/lib/identity';
import { cn } from '@/utils/classNames';

const PAGE_SIZE = 20;

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

function formatOptionalDateTime(value: string | null | undefined): string {
  return value ? formatDateTime(value) : '暂无记录';
}

const ANALYTICS_EVENT_LABELS: Record<string, string> = {
  $pageview: '查看页面',
  $identify: '识别用户',
  $autocapture: '自动采集',
  $pageleave: '离开页面',
  auth_login_success: '登录成功',
  auth_register_success: '注册成功',
  project_application_submitted: '提交课题申请',
  experiment_opened: '进入实验',
};

const APPLICATION_STATUS_LABELS: Record<
  AdminUserDetail['research']['applications'][number]['status'],
  { label: string; tone: BadgeTone }
> = {
  pending: { label: '待审核', tone: 'amber' },
  approved: { label: '已通过', tone: 'green' },
  rejected: { label: '未通过', tone: 'red' },
  withdrawn: { label: '已撤回', tone: 'slate' },
};

function formatAnalyticsEventName(eventName: string): string {
  const mappedLabel = ANALYTICS_EVENT_LABELS[eventName];
  if (mappedLabel) {
    return mappedLabel;
  }

  const cleanedLabel = eventName
    .replace(/^\$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_./:-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanedLabel) {
    return '未知行为';
  }

  return cleanedLabel.replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

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
  }, [search, role, status, sortBy, sortOrder, page]);

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

  const recentAnalyticsEvents = useMemo(() => {
    return [...(analyticsResult?.recent_events ?? [])].sort((left, right) =>
      right.timestamp.localeCompare(left.timestamp)
    );
  }, [analyticsResult]);

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
              查看平台账号规模与基础资料，点击任意用户可查看教育经历、课题组参与和最近行为。
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
            hint="最近一周有登录记录的账号"
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
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
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
              <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>角色筛选</span>
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
                <option value="all">全部角色</option>
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
                    <th className="px-5 py-4 font-medium">角色</th>
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
                                alt={formatUserIdentity(item)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{formatUserIdentity(item)}</div>
                            <div className="text-xs text-slate-500">@{item.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">{item.email || '未填写'}</td>
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
                          aria-label={`查看 ${formatUserIdentity(item)} 的详情`}
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
        recentEvents={recentAnalyticsEvents}
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
        {value ?? '—'}
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
  recentEvents,
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
  recentEvents: AdminUserPostHogRecentEvent[];
  isLoadingAnalytics: boolean;
  analyticsError: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
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
      // Clipboard access denied — nothing actionable for the teacher here
    }
  };

  const mutedText = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const strongText = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const panelClass =
    theme === 'dark' ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50';

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
      showCloseButton={false}
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
                <img src={user.avatar_url} alt={formatUserIdentity(user)} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-7 w-7 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={cn('text-xl font-semibold', strongText)}>
                  {formatUserIdentity(user)}
                </h2>
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

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <InfoCard theme={theme} label="邮箱" value={user?.email || '未填写'} />
          <InfoCard theme={theme} label="注册时间" value={user ? formatDateTime(user.created_at) : ''} />
          <InfoCard
            theme={theme}
            label="最后登录"
            value={user?.last_login_at ? formatDateTime(user.last_login_at) : '从未登录'}
          />
        </div>

        {isLoadingDetail ? (
          <div
            className={cn(
              'mt-6 flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm',
              panelClass,
              mutedText
            )}
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
            正在加载用户资料...
          </div>
        ) : null}

        {!isLoadingDetail && detailError ? (
          <div
            className={cn(
              'mt-6 rounded-2xl border px-4 py-4 text-sm',
              theme === 'dark'
                ? 'border-red-400/20 bg-red-500/10 text-red-200'
                : 'border-red-200 bg-red-50 text-red-700'
            )}
          >
            {detailError}
          </div>
        ) : null}

        {!isLoadingDetail && detail ? (
          <>
            <DetailSection theme={theme} icon={GraduationCap} title="教育经历">
              {detail.educations.length === 0 ? (
                <EmptyHint theme={theme}>该用户还没有填写教育经历</EmptyHint>
              ) : (
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
                        {formatMonth(education.start_date)} –{' '}
                        {education.end_date ? formatMonth(education.end_date) : '至今'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>

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
          </>
        ) : null}

        <DetailSection theme={theme} icon={Activity} title="行为记录">
          {isLoadingAnalytics ? (
            <div
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm',
                panelClass,
                mutedText
              )}
            >
              <RefreshCw className="h-4 w-4 animate-spin" />
              正在加载行为数据...
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

          {!isLoadingAnalytics && !analyticsError && analytics?.status === 'not_found' ? (
            <EmptyHint theme={theme}>该用户暂无行为记录</EmptyHint>
          ) : null}

          {!isLoadingAnalytics && !analyticsError && analytics?.status === 'ok' ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoCard
                  theme={theme}
                  label="最近活跃时间"
                  value={formatOptionalDateTime(analytics.person?.last_seen_at)}
                />
                <InfoCard
                  theme={theme}
                  label="近 30 天行为数"
                  value={String(analytics.summary?.event_count_30d ?? 0)}
                />
                <InfoCard
                  theme={theme}
                  label="近 30 天页面访问数"
                  value={String(analytics.summary?.pageview_count_30d ?? 0)}
                />
              </div>

              <div className="mt-4">
                <h4
                  className={cn(
                    'text-sm font-medium',
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                  )}
                >
                  最近 10 条行为
                </h4>
                {recentEvents.length === 0 ? (
                  <div className="mt-3">
                    <EmptyHint theme={theme}>暂无最近行为</EmptyHint>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'mt-3 overflow-hidden rounded-2xl border',
                      theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                    )}
                  >
                    <ul
                      className={cn(
                        'divide-y',
                        theme === 'dark' ? 'divide-slate-800' : 'divide-slate-200'
                      )}
                    >
                      {recentEvents.map((event) => (
                        <li
                          key={`${event.timestamp}-${event.event}-${event.route ?? event.url ?? ''}`}
                          className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                        >
                          <div>
                            <div className={cn('text-base font-medium', strongText)}>
                              {formatAnalyticsEventName(event.event)}
                            </div>
                            <div className={cn('mt-1 text-sm', mutedText)}>
                              {event.route || event.url || '无路由上下文'}
                            </div>
                          </div>
                          <div className={cn('text-sm', mutedText)}>
                            {formatDateTime(event.timestamp)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DetailSection>
      </div>
    </Dialog>
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

function InfoCard({ theme, label, value }: { theme: string; label: string; value: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-4',
        theme === 'dark' ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
      )}
    >
      <div className={cn('text-sm', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
        {label}
      </div>
      <div
        className={cn(
          'mt-2 break-all text-base font-semibold',
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        )}
      >
        {value}
      </div>
    </div>
  );
}
