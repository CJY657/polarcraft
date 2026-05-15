import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, RefreshCw, Search, ShieldCheck, UserRound, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PersistentHeader } from '@/components/shared/PersistentHeader';
import { useTheme } from '@/contexts/ThemeContext';
import {
  adminUserApi,
  type AdminUserListItem,
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page + 1, totalPages);

  const summaryHint = useMemo(() => {
    if (!stats) {
      return '正在汇总账号规模';
    }

    return `${stats.active_users} 个账号当前可正常使用`;
  }, [stats]);

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
              Admin User Directory
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
            label="累计注册数"
            value={stats?.total_registered}
            hint={summaryHint}
          />
          <SummaryCard
            theme={theme}
            icon={ShieldCheck}
            label="当前有效用户"
            value={stats?.active_users}
            hint="按 is_active=true 统计"
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
