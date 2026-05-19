import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ChevronLeft,
  RefreshCw,
  Search,
  ShieldCheck,
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
  type AdminUserListItem,
  type AdminUserPostHogAnalyticsResponse,
  type AdminUserPostHogRecentEvent,
  type AdminUserRoleFilter,
  type AdminUserStats,
  type AdminUserStatusFilter,
} from '@/lib/admin-user.service';
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
  const [page, setPage] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalyticsUser, setSelectedAnalyticsUser] = useState<AdminUserListItem | null>(
    null
  );
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
  }, [search, role, status, page]);

  useEffect(() => {
    if (!selectedAnalyticsUser) {
      setAnalyticsResult(null);
      setAnalyticsError(null);
      setIsLoadingAnalytics(false);
      return;
    }

    let cancelled = false;

    setAnalyticsResult(null);
    setAnalyticsError(null);
    setIsLoadingAnalytics(true);

    void adminUserApi
      .getPostHogAnalytics(selectedAnalyticsUser.id)
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
  }, [selectedAnalyticsUser]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page + 1, totalPages);

  const summaryHint = useMemo(() => {
    if (!stats) {
      return '正在汇总账号规模';
    }

    return `${stats.active_users} 个账号当前可正常使用`;
  }, [stats]);

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
              查看平台账号规模与基础资料。当前版本仅提供只读查询，不会在这里修改账号权限或状态。
            </p>
          </div>

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

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SummaryCard
            theme={theme}
            icon={Users}
            label="累计注册账号数"
            value={stats?.total_registered}
            hint={summaryHint}
          />
          <SummaryCard
            theme={theme}
            icon={ShieldCheck}
            label="当前可用账号"
            value={stats?.active_users}
            hint="仅统计当前可正常使用的账号"
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
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
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
              <table className="min-w-full divide-y divide-slate-800/70 text-left text-sm">
                <thead className={theme === 'dark' ? 'bg-slate-950/70' : 'bg-slate-50'}>
                  <tr className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                    <th className="px-5 py-4 font-medium">用户</th>
                    <th className="px-5 py-4 font-medium">邮箱</th>
                    <th className="px-5 py-4 font-medium">角色</th>
                    <th className="px-5 py-4 font-medium">邮箱验证</th>
                    <th className="px-5 py-4 font-medium">账号状态</th>
                    <th className="px-5 py-4 font-medium">注册时间</th>
                    <th className="px-5 py-4 font-medium">最后登录</th>
                    <th className="px-5 py-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody
                  className={cn(
                    'divide-y',
                    theme === 'dark' ? 'divide-slate-800 text-slate-200' : 'divide-slate-200 text-slate-700'
                  )}
                >
                  {items.map((item) => (
                    <tr key={item.id}>
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
                                alt={item.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{item.username}</div>
                            <div className={cn('text-xs', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>
                              ID: {item.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">{item.email || '未填写'}</td>
                      <td className="px-5 py-4">{roleLabel(item.role)}</td>
                      <td className="px-5 py-4">
                        <StatusBadge theme={theme} active={item.email_verified} activeLabel="已验证" inactiveLabel="未验证" />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge theme={theme} active={item.is_active} activeLabel="有效" inactiveLabel="停用" />
                      </td>
                      <td className="px-5 py-4">{formatDateTime(item.created_at)}</td>
                      <td className="px-5 py-4">
                        {item.last_login_at ? formatDateTime(item.last_login_at) : '从未登录'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          aria-label={`查看 ${item.username} 的行为`}
                          onClick={() => setSelectedAnalyticsUser(item)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            theme === 'dark'
                              ? 'bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20'
                              : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                          )}
                        >
                          <Activity className="h-3.5 w-3.5" />
                          查看行为
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

      <UserAnalyticsDialog
        user={selectedAnalyticsUser}
        result={analyticsResult}
        recentEvents={recentAnalyticsEvents}
        isLoading={isLoadingAnalytics}
        error={analyticsError}
        onClose={() => setSelectedAnalyticsUser(null)}
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
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
        active
          ? theme === 'dark'
            ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : theme === 'dark'
            ? 'border-slate-700 bg-slate-800 text-slate-300'
            : 'border-slate-200 bg-slate-100 text-slate-600'
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
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

function UserAnalyticsDialog({
  user,
  result,
  recentEvents,
  isLoading,
  error,
  onClose,
}: {
  user: AdminUserListItem | null;
  result: AdminUserPostHogAnalyticsResponse | null;
  recentEvents: AdminUserPostHogRecentEvent[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      isOpen={Boolean(user)}
      onClose={onClose}
      className="max-w-3xl border-slate-700 bg-slate-900 text-slate-100"
      showCloseButton={false}
    >
      <div className="max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">行为记录</p>
            <h2 className="mt-1 text-xl font-semibold">
              {user ? `${user.username} 的行为记录` : '行为记录'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="关闭行为详情"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm text-slate-300">
            <RefreshCw className="h-4 w-4 animate-spin" />
            正在加载行为数据...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && result?.status === 'disabled' ? (
          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
            行为统计尚未启用
          </div>
        ) : null}

        {!isLoading && !error && result?.status === 'not_found' ? (
          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-4 text-sm text-slate-300">
            该用户暂无行为记录
          </div>
        ) : null}

        {!isLoading && !error && result?.status === 'ok' ? (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <AnalyticsSummaryCard
                label="最近活跃时间"
                value={formatOptionalDateTime(result.person?.last_seen_at)}
              />
              <AnalyticsSummaryCard
                label="近 30 天行为数"
                value={String(result.summary?.event_count_30d ?? 0)}
              />
              <AnalyticsSummaryCard
                label="近 30 天页面访问数"
                value={String(result.summary?.pageview_count_30d ?? 0)}
              />
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-200">最近 10 条行为</h3>
              {recentEvents.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm text-slate-400">
                  暂无最近行为
                </div>
              ) : (
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800">
                  <ul className="divide-y divide-slate-800">
                    {recentEvents.map((event) => (
                      <li
                        key={`${event.timestamp}-${event.event}-${event.route ?? event.url ?? ''}`}
                        className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                      >
                        <div>
                          <div className="font-medium text-slate-100">
                            {formatAnalyticsEventName(event.event)}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {event.route || event.url || '无路由上下文'}
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">
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
      </div>
    </Dialog>
  );
}

function AnalyticsSummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
