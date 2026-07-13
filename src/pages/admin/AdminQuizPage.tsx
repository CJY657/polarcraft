/**
 * AdminQuizPage — 测验成绩看板
 *
 * Per-student aggregated quiz scores with overall stats. Follows the
 * hand-rolled table/stat-card conventions of AdminActivityPage.
 * 每位学生一行的测验成绩聚合表与整体统计，沿用 AdminActivityPage 的手写表格/统计卡片风格。
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Percent,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

import { PersistentHeader } from '@/components/shared/PersistentHeader';
import { useTheme } from '@/contexts/ThemeContext';
import {
  adminQuizApi,
  type AdminQuizListResult,
  type AdminQuizStats,
} from '@/lib/quiz.service';
import { tierLabelZh, tierStyle } from '@/feature/quiz/quizTiers';
import { cn } from '@/utils/classNames';

const PAGE_SIZE = 20;

type SortBy = 'best_percent' | 'latest_at' | 'attempts';

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminQuizPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [stats, setStats] = useState<AdminQuizStats | null>(null);
  const [list, setList] = useState<AdminQuizListResult | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('best_percent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void Promise.all([
      adminQuizApi.stats(),
      adminQuizApi.list({ page, pageSize: PAGE_SIZE, sortBy, sortOrder, search: search || undefined }),
    ])
      .then(([statsData, listData]) => {
        if (!cancelled) {
          setStats(statsData);
          setList(listData);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '测验成绩暂时无法加载');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, sortBy, sortOrder, search, retryKey]);

  const tiers = stats?.tiers ?? list?.tiers ?? [];
  const totalPages = list ? Math.max(Math.ceil(list.total / PAGE_SIZE), 1) : 1;
  const maxTierCount = useMemo(
    () => Math.max(...(stats?.tier_distribution.map((entry) => entry.count) ?? [0]), 1),
    [stats],
  );

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder((order) => (order === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const sortIndicator = (field: SortBy) =>
    sortBy === field ? (sortOrder === 'desc' ? ' ↓' : ' ↑') : '';

  const cardClass = cn(
    'rounded-2xl border p-5',
    isDark ? 'border-slate-800 bg-slate-900' : 'border-[#e5e5e5] bg-white',
  );
  const mutedText = isDark ? 'text-slate-400' : 'text-stone-500';
  const strongText = isDark ? 'text-slate-50' : 'text-[#0a0a0a]';

  const statCards = stats
    ? [
        { icon: ClipboardCheck, label: '完成测验次数', value: String(stats.total_attempts) },
        { icon: Users, label: '参与学生', value: String(stats.participants) },
        { icon: Percent, label: '平均得分', value: `${stats.average_percent}` },
        {
          icon: Award,
          label: `及格率（≥${stats.pass_percent}分）`,
          value: `${Math.round(stats.pass_rate * 100)}%`,
        },
      ]
    : [];

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-[#fffaf0]')}>
      <PersistentHeader
        moduleName="测验成绩"
        variant="glass"
        className={cn(
          'sticky top-0 z-40',
          isDark
            ? 'border-b border-slate-800 bg-slate-950/80'
            : 'border-b border-[#e5e5e5] bg-[#fffaf0]/90',
        )}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className={cn('text-3xl font-semibold tracking-tight sm:text-4xl', strongText)}>
              测验成绩
            </h1>
            <p className={cn('mt-2 text-sm leading-relaxed', mutedText)}>
              偏振知识测验的学生成绩总览：每位学生的最好成绩、最近成绩与挑战次数。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            className={cn(
              'inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2 text-sm font-medium transition',
              isDark
                ? 'border-slate-700 text-slate-200 hover:bg-slate-900'
                : 'border-stone-300 text-stone-700 hover:bg-stone-50',
            )}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} aria-hidden />
            刷新
          </button>
        </header>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {/* Stat cards / 统计卡片 */}
        {stats && (
          <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="整体统计">
            {statCards.map(({ icon: Icon, label, value }) => (
              <div key={label} className={cardClass}>
                <Icon className={cn('h-5 w-5', mutedText)} aria-hidden />
                <p className={cn('mt-3 text-2xl font-semibold tabular-nums', strongText)}>{value}</p>
                <p className={cn('mt-1 text-sm', mutedText)}>{label}</p>
              </div>
            ))}
          </section>
        )}

        {/* Tier distribution / 等级分布 */}
        {stats && stats.tier_distribution.length > 0 && (
          <section className={cn('mt-6', cardClass)} aria-label="等级分布">
            <h2 className={cn('text-sm font-semibold', mutedText)}>等级分布（按完成次数）</h2>
            <div className="mt-4 space-y-3">
              {[...tiers]
                .sort((a, b) => b.minPercent - a.minPercent)
                .map((tier) => {
                  const count =
                    stats.tier_distribution.find((entry) => entry.tier === tier.id)?.count ?? 0;
                  return (
                    <div key={tier.id} className="flex items-center gap-3">
                      <span className={cn('w-24 shrink-0 text-sm', strongText)}>
                        {tier.label.zh}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200/60">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(count / maxTierCount) * 100}%`,
                            backgroundColor: tierStyle(tier.id).accent,
                          }}
                        />
                      </div>
                      <span className={cn('w-10 shrink-0 text-right text-sm tabular-nums', mutedText)}>
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Learner table / 学生成绩表 */}
        <section className={cn('mt-6', cardClass)} aria-label="学生成绩">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className={cn('text-sm font-semibold', mutedText)}>
              学生成绩{list ? `（共 ${list.total} 人）` : ''}
            </h2>
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput.trim());
                setPage(1);
              }}
            >
              <Search
                className={cn('pointer-events-none absolute left-3 top-2.5 h-4 w-4', mutedText)}
                aria-hidden
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="搜索用户名/昵称"
                className={cn(
                  'w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none sm:w-64',
                  isDark
                    ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500'
                    : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                )}
                aria-label="搜索用户名或昵称"
              />
            </form>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className={cn('border-b', isDark ? 'border-slate-800' : 'border-stone-200')}>
                  <th className={cn('py-2.5 pr-4 font-medium', mutedText)}>学生</th>
                  <th className={cn('py-2.5 pr-4 font-medium', mutedText)}>
                    <button type="button" onClick={() => toggleSort('best_percent')}>
                      最好成绩{sortIndicator('best_percent')}
                    </button>
                  </th>
                  <th className={cn('py-2.5 pr-4 font-medium', mutedText)}>最好等级</th>
                  <th className={cn('py-2.5 pr-4 font-medium', mutedText)}>最近成绩</th>
                  <th className={cn('py-2.5 pr-4 font-medium', mutedText)}>
                    <button type="button" onClick={() => toggleSort('attempts')}>
                      次数{sortIndicator('attempts')}
                    </button>
                  </th>
                  <th className={cn('py-2.5 font-medium', mutedText)}>
                    <button type="button" onClick={() => toggleSort('latest_at')}>
                      最近完成时间{sortIndicator('latest_at')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(list?.items ?? []).map((row) => (
                  <tr
                    key={row.user_id}
                    className={cn('border-b last:border-0', isDark ? 'border-slate-800/60' : 'border-stone-100')}
                  >
                    <td className={cn('py-3 pr-4', strongText)}>
                      <span className="font-medium">{row.nickname || row.username || '未知用户'}</span>
                      {row.nickname && row.username && (
                        <span className={cn('ml-2 text-xs', mutedText)}>@{row.username}</span>
                      )}
                    </td>
                    <td className={cn('py-3 pr-4 font-semibold tabular-nums', strongText)}>
                      {row.best_percent}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-medium',
                          tierStyle(row.best_tier).badge,
                        )}
                      >
                        {tierLabelZh(row.best_tier, tiers)}
                      </span>
                    </td>
                    <td className={cn('py-3 pr-4 tabular-nums', mutedText)}>
                      {row.latest_percent}
                      <span className="ml-1.5 text-xs">{tierLabelZh(row.latest_tier, tiers)}</span>
                    </td>
                    <td className={cn('py-3 pr-4 tabular-nums', mutedText)}>{row.attempts}</td>
                    <td className={cn('py-3 tabular-nums', mutedText)}>
                      {formatDateTime(row.latest_at)}
                    </td>
                  </tr>
                ))}
                {!isLoading && (list?.items.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={6} className={cn('py-10 text-center', mutedText)}>
                      {search ? '没有匹配的学生' : '还没有学生完成测验'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination / 分页 */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(value - 1, 1))}
                disabled={page <= 1}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40',
                  isDark
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-900'
                    : 'border-stone-300 text-stone-700 hover:bg-stone-50',
                )}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                上一页
              </button>
              <span className={cn('text-sm tabular-nums', mutedText)}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
                disabled={page >= totalPages}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40',
                  isDark
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-900'
                    : 'border-stone-300 text-stone-700 hover:bg-stone-50',
                )}
              >
                下一页
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
