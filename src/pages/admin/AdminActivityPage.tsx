import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  ChevronDown,
  ChevronRight,
  Eye,
  LayoutGrid,
  MousePointerClick,
  RefreshCw,
  Users,
} from 'lucide-react';

import { PersistentHeader } from '@/components/shared/PersistentHeader';
import { useTheme } from '@/contexts/ThemeContext';
import {
  adminUserApi,
  type AdminActivityLimit,
  type AdminActivityResponse,
  type AdminActivityUserType,
} from '@/lib/admin-user.service';
import type { UserType } from '@/lib/auth.service';
import { formatActivityDelta, formatEventName, formatPagePath } from '@/lib/activity-labels';
import { buildValueAxis, formatAxisValue, pickTickIndices } from '@/lib/chart-axis';
import AdminLearnerActivityDrawer from '@/pages/admin/AdminLearnerActivityDrawer';
import { cn } from '@/utils/classNames';
import { formatShortDateTime } from '@/lib/datetime.util';

const RANGES: Array<{ days: number; label: string }> = [
  { days: 7, label: '近 7 天' },
  { days: 30, label: '近 30 天' },
];

const LIMIT_OPTIONS: AdminActivityLimit[] = [10, 50, 100, 'all'];

const USER_TYPE_OPTIONS: Array<{ value: AdminActivityUserType; label: string }> = [
  { value: 'student', label: '学生' },
  { value: 'teacher', label: '教师' },
  { value: 'all', label: '全部' },
];

const USER_TYPE_COPY: Record<AdminActivityUserType, { noun: string }> = {
  student: { noun: '学生' },
  teacher: { noun: '教师' },
  all: { noun: '用户' },
};

const CHART_COLORS = ['#ff4d8b', '#1a3a3a', '#b8a4ed', '#ffb084', '#e8b94a'];

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function presetRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return { start: toDateInput(start), end: toDateInput(end) };
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

export default function AdminActivityPage() {
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [range, setRange] = useState(() => presetRange(7));
  const [userType, setUserType] = useState<AdminActivityUserType>('student');
  const [limit, setLimit] = useState<AdminActivityLimit>(10);
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState<AdminActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDark = theme === 'dark';
  const rangeInvalid = range.start > range.end;
  const copy = USER_TYPE_COPY[userType];
  // Bookmarkable: /admin/activity?user=<id> opens the user drawer directly.
  const selectedUserId = searchParams.get('user');

  const openUser = (userId: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('user', userId);
        return next;
      },
      { replace: false }
    );
  };

  const closeUser = () => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('user');
        return next;
      },
      { replace: true }
    );
  };

  const selectedUser = useMemo<{
    name: string;
    userType: UserType | null | undefined;
  }>(() => {
    if (!selectedUserId) return { name: '', userType: undefined };
    const ranked = result?.top_users.find((user) => user.user_id === selectedUserId);
    if (ranked) return { name: ranked.display_name, userType: ranked.user_type };
    for (const entry of result?.module_breakdown ?? []) {
      const user = entry.users.find((item) => item.user_id === selectedUserId);
      if (user) {
        return {
          name: user.username,
          userType: undefined,
        };
      }
    }
    return {
      name: copy.noun,
      userType: undefined,
    };
  }, [copy.noun, selectedUserId, result]);

  const selectUserType = (nextUserType: AdminActivityUserType) => {
    if (nextUserType === userType) return;
    if (selectedUserId) closeUser();
    setUserType(nextUserType);
  };

  useEffect(() => {
    if (rangeInvalid) {
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void adminUserApi
      .getActivity({ start: range.start, end: range.end, userType, limit })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '用户活动暂时无法加载');
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
  }, [range.start, range.end, userType, limit, retryKey, rangeInvalid]);

  const isEmpty =
    result?.status === 'ok' &&
    (!result.summary || result.summary.meaningful_events === 0);

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-[#fffaf0]')}>
      <PersistentHeader
        moduleName="用户活动"
        variant="glass"
        className={cn(
          'sticky top-0 z-40',
          isDark
            ? 'border-b border-slate-800 bg-slate-950/80'
            : 'border-b border-[#e5e5e5] bg-[#fffaf0]/90'
        )}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1
              className={cn(
                'text-3xl font-semibold tracking-tight sm:text-4xl',
                isDark ? 'text-slate-50' : 'text-[#0a0a0a]'
              )}
            >
              用户活动
            </h1>
            <p
              className={cn(
                'mt-3 text-sm leading-7 sm:text-base',
                isDark ? 'text-slate-300' : 'text-[#3a3a3a]'
              )}
            >
              查看已登录{copy.noun}的页面访问和学习行为，快速了解近期参与情况。
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div
              className={cn(
                'inline-flex w-full gap-1 rounded-2xl border p-1 lg:w-auto',
                isDark ? 'border-slate-700 bg-slate-900' : 'border-[#e5e5e5] bg-white'
              )}
              role="group"
              aria-label="活动账号类型"
            >
              {USER_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={userType === option.value}
                  onClick={() => selectUserType(option.value)}
                  className={cn(
                    'h-11 flex-1 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-colors active:scale-[0.98] lg:flex-none',
                    userType === option.value
                      ? isDark
                        ? 'bg-emerald-300 text-slate-950'
                        : 'bg-[#0a0a0a] text-white'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-800'
                        : 'text-[#6a6a6a] hover:bg-[#faf5e8]'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div
              className={cn(
                'inline-flex w-full gap-1 rounded-2xl border p-1 lg:w-auto',
                isDark ? 'border-slate-700 bg-slate-900' : 'border-[#e5e5e5] bg-white'
              )}
              aria-label="统计时间范围"
            >
              {RANGES.map((preset) => {
                const presetDates = presetRange(preset.days);
                const selected =
                  range.start === presetDates.start && range.end === presetDates.end;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setRange(presetDates)}
                    className={cn(
                      'h-11 flex-1 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-colors active:scale-[0.98] lg:flex-none',
                      selected
                        ? isDark
                          ? 'bg-emerald-300 text-slate-950'
                          : 'bg-[#0a0a0a] text-white'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-[#6a6a6a] hover:bg-[#faf5e8]'
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div
              className={cn(
                'flex flex-wrap items-center gap-2 text-sm',
                isDark ? 'text-slate-300' : 'text-[#3a3a3a]'
              )}
            >
              <label className="inline-flex items-center gap-2">
                <span>自定义</span>
                <input
                  type="date"
                  value={range.start}
                  max={toDateInput(new Date())}
                  onChange={(event) =>
                    setRange((current) => ({ ...current, start: event.target.value }))
                  }
                  aria-label="开始日期"
                  className={cn(
                    'h-11 rounded-xl border px-3',
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-100'
                      : 'border-[#e5e5e5] bg-white text-[#0a0a0a]'
                  )}
                />
              </label>
              <span aria-hidden="true">至</span>
              <input
                type="date"
                value={range.end}
                max={toDateInput(new Date())}
                onChange={(event) =>
                  setRange((current) => ({ ...current, end: event.target.value }))
                }
                aria-label="结束日期"
                className={cn(
                  'h-11 rounded-xl border px-3',
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-100'
                    : 'border-[#e5e5e5] bg-white text-[#0a0a0a]'
                )}
              />
              {rangeInvalid && (
                <span role="alert" className="text-sm font-medium text-[#d23f63]">
                  开始日期不能晚于结束日期
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="mt-7">
          {isLoading ? (
            <ActivitySkeleton isDark={isDark} noun={copy.noun} />
          ) : error ? (
            <StatePanel
              isDark={isDark}
              icon={<AlertTriangle className="h-6 w-6" />}
              title={`加载${copy.noun}活动失败`}
              description={error}
              action={
                <button
                  type="button"
                  onClick={() => setRetryKey((current) => current + 1)}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold active:scale-[0.98]',
                    isDark
                      ? 'bg-emerald-300 text-slate-950'
                      : 'bg-[#0a0a0a] text-white'
                  )}
                >
                  <RefreshCw className="h-4 w-4" />
                  重试
                </button>
              }
            />
          ) : result?.status === 'disabled' ? (
            <StatePanel
              isDark={isDark}
              icon={<BarChart3 className="h-6 w-6" />}
              title="行为统计暂未启用"
              description="当前环境尚未启用行为统计，完成服务器配置后即可查看。"
            />
          ) : isEmpty ? (
            <StatePanel
              isDark={isDark}
              icon={<BookOpenCheck className="h-6 w-6" />}
              title="暂无活动数据"
              description={`${range.start} 至 ${range.end} 还没有已登录${copy.noun}的活动。`}
            />
          ) : result?.summary ? (
            <Dashboard
              result={result}
              isDark={isDark}
              userType={result.segment}
              limit={limit}
              onLimitChange={setLimit}
              onUserSelect={openUser}
            />
          ) : null}
        </div>
      </main>

      {selectedUserId ? (
        <AdminLearnerActivityDrawer
          userId={selectedUserId}
          userName={selectedUser.name}
          userType={selectedUser.userType}
          range={range}
          isDark={isDark}
          onClose={closeUser}
        />
      ) : null}
    </div>
  );
}

function Dashboard({
  result,
  isDark,
  userType,
  limit,
  onLimitChange,
  onUserSelect,
}: {
  result: AdminActivityResponse;
  isDark: boolean;
  userType: AdminActivityUserType;
  limit: AdminActivityLimit;
  onLimitChange: (limit: AdminActivityLimit) => void;
  onUserSelect: (userId: string) => void;
}) {
  const summary = result.summary!;
  const previous = result.previous_summary;
  const copy = USER_TYPE_COPY[userType];
  const metrics = [
    {
      label: `活跃${copy.noun}`,
      value: summary.active_users,
      previous: previous?.active_users,
      description: `所选起止日期均计入；至少有 1 次有效活动的已识别${copy.noun}人数，按账号去重。`,
      icon: Users,
      color: '#ff4d8b',
    },
    {
      label: '有效活动',
      value: summary.meaningful_events,
      previous: previous?.meaningful_events,
      description: `所选起止日期均计入；排除自动采集、离开、身份识别和属性设置后，${copy.noun}的活动总次数。`,
      icon: Activity,
      color: '#1a3a3a',
    },
    {
      label: '页面访问',
      value: summary.pageviews,
      previous: previous?.pageviews,
      description: `所选起止日期均计入；已识别${copy.noun}纳入统计的页面访问次数。`,
      icon: Eye,
      color: '#b8a4ed',
    },
    {
      label: '学习行为',
      value: summary.learning_actions,
      previous: previous?.learning_actions,
      description: `所选起止日期均计入；已识别${copy.noun}进入实验，以及在虚拟课题组里建课题、提交申请、讨论、交证据、完成任务的合计次数。`,
      icon: MousePointerClick,
      color: '#e8b94a',
    },
  ];

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="活动概览">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const delta = formatActivityDelta(metric.value, metric.previous);
          return (
            <div
              key={metric.label}
              className={cn(
                'relative overflow-hidden rounded-2xl border p-5',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-[#e5e5e5] bg-white'
              )}
            >
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: metric.color }} />
              <div className="flex items-center justify-between gap-3">
                <p className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-[#6a6a6a]')}>
                  {metric.label}
                </p>
                <Icon className="h-5 w-5" style={{ color: metric.color }} aria-hidden="true" />
              </div>
              <p
                className={cn(
                  'mt-4 text-3xl font-semibold tabular-nums',
                  isDark ? 'text-slate-50' : 'text-[#0a0a0a]'
                )}
              >
                {metric.value.toLocaleString('zh-CN')}
              </p>
              {delta ? (
                <p
                  className={cn(
                    'mt-1 text-sm font-medium',
                    delta.direction === 'up'
                      ? isDark
                        ? 'text-emerald-300'
                        : 'text-[#1f7a5a]'
                      : delta.direction === 'down'
                        ? isDark
                          ? 'text-rose-300'
                          : 'text-[#d23f63]'
                        : isDark
                          ? 'text-slate-400'
                          : 'text-[#6a6a6a]'
                  )}
                >
                  {delta.direction === 'up' ? '↑ ' : delta.direction === 'down' ? '↓ ' : ''}
                  {delta.text}
                </p>
              ) : null}
              <p className={cn('mt-2 text-xs leading-5', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}>
                {metric.description}
              </p>
            </div>
          );
        })}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <Panel
          isDark={isDark}
          title="每日活动趋势"
          description={`每个日期分别显示当天的${copy.noun}去重人数、页面访问次数和学习行为次数。`}
        >
          <DailyTrend daily={result.daily} isDark={isDark} noun={copy.noun} />
        </Panel>
        <Panel
          isDark={isDark}
          title="热门页面"
          description={`按页面访问次数展示前 10 个路径，每个路径的${copy.noun}人数单独去重。`}
        >
          <TopPages pages={result.top_pages} isDark={isDark} noun={copy.noun} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          isDark={isDark}
          title="模块热度"
          description="按现有页面路径前缀归类并汇总页面访问次数。"
        >
          <ModuleBreakdown
            modules={result.module_breakdown}
            isDark={isDark}
            noun={copy.noun}
            onUserSelect={onUserSelect}
          />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
        <Panel
          isDark={isDark}
          title="活动构成"
          description="展示次数最多的前 10 类活动；占比按当前展示的次数计算。"
        >
          <ActivityMix items={result.activity_breakdown} isDark={isDark} />
        </Panel>
        <Panel
          isDark={isDark}
          title={`活跃${copy.noun}排行`}
          description={`按纳入统计的有效活动次数排序；显示人数只影响排行行数。点击任意${copy.noun}查看完整活动分析。`}
          action={
            <label
              className={cn(
                'inline-flex items-center gap-2 text-sm',
                isDark ? 'text-slate-300' : 'text-[#6a6a6a]'
              )}
            >
              显示人数
              <select
                value={String(limit)}
                onChange={(event) =>
                  onLimitChange(
                    event.target.value === 'all'
                      ? 'all'
                      : (Number(event.target.value) as AdminActivityLimit)
                  )
                }
                className={cn(
                  'h-10 rounded-xl border px-2',
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-100'
                    : 'border-[#e5e5e5] bg-white text-[#0a0a0a]'
                )}
              >
                {LIMIT_OPTIONS.map((option) => (
                  <option key={String(option)} value={String(option)}>
                    {option === 'all' ? '全部' : `前 ${option} 名`}
                  </option>
                ))}
              </select>
            </label>
          }
        >
          <TopUsers
            users={result.top_users}
            isDark={isDark}
            noun={copy.noun}
            onUserSelect={onUserSelect}
          />
        </Panel>
      </div>

      <p className={cn('mt-4 text-right text-xs', isDark ? 'text-slate-500' : 'text-[#6a6a6a]')}>
        数据更新时间：{formatShortDateTime(result.generated_at)}
      </p>
    </>
  );
}

function Panel({
  isDark,
  title,
  description,
  action,
  children,
}: {
  isDark: boolean;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-3xl border p-5 sm:p-6',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-[#e5e5e5] bg-white'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className={cn('text-lg font-semibold', isDark ? 'text-slate-100' : 'text-[#0a0a0a]')}>
            {title}
          </h2>
          {description ? (
            <p className={cn('mt-1 text-xs leading-5', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}>
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DailyTrend({
  daily,
  isDark,
  noun,
}: {
  daily: AdminActivityResponse['daily'];
  isDark: boolean;
  noun: string;
}) {
  if (daily.length === 0) {
    return <InlineEmpty isDark={isDark}>暂无每日趋势</InlineEmpty>;
  }

  const width = 720;
  const height = 250;
  // 左边留给纵轴刻度文字，底部留给日期刻度。
  const marginLeft = 52;
  const marginRight = 14;
  const marginTop = 14;
  const marginBottom = 40;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;
  const baseline = marginTop + plotHeight;

  const axis = buildValueAxis(
    Math.max(
      ...daily.flatMap((day) => [day.active_users, day.pageviews, day.learning_actions])
    )
  );
  const x = (index: number) =>
    daily.length === 1 ? marginLeft + plotWidth / 2 : marginLeft + (index * plotWidth) / (daily.length - 1);
  const y = (value: number) => baseline - (value / axis.max) * plotHeight;
  const points = (key: 'active_users' | 'pageviews' | 'learning_actions') =>
    daily.map((day, index) => `${x(index)},${y(day[key])}`).join(' ');
  const series = [
    { key: 'active_users', label: `活跃${noun}`, color: '#ff4d8b', dash: undefined },
    { key: 'pageviews', label: '页面访问', color: '#b8a4ed', dash: '12 6' },
    { key: 'learning_actions', label: '学习行为', color: '#e8b94a', dash: '3 6' },
  ] as const;
  const outlineColor = isDark ? '#f8fafc' : '#3a3a3a';
  const gridColor = isDark ? '#334155' : '#ebe6d6';
  const axisColor = isDark ? '#64748b' : '#c9c2ad';
  const tickColor = isDark ? '#94a3b8' : '#6a6a6a';
  const dayTicks = pickTickIndices(daily.length, 7);
  // 点太密时不再画标记点，否则折线会糊成一片。
  const showDots = daily.length <= 14;
  const dataTableId = 'admin-activity-daily-data';

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
        {series.map((item) => (
          <span key={item.key} className={cn('inline-flex items-center gap-2', isDark ? 'text-slate-300' : 'text-[#3a3a3a]')}>
            <svg viewBox="0 0 20 6" className="h-1.5 w-5" aria-hidden="true">
              <line x1="0" x2="20" y1="3" y2="3" stroke={outlineColor} strokeWidth="5" strokeDasharray={item.dash} />
              <line x1="0" x2="20" y1="3" y2="3" stroke={item.color} strokeWidth="3" strokeDasharray={item.dash} />
            </svg>
            {item.label}
          </span>
        ))}
      </div>
      <svg
        role="img"
        aria-label="每日活动趋势"
        aria-describedby={dataTableId}
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 h-auto w-full overflow-visible"
      >
        {/* 纵轴刻度线与数值 */}
        {axis.ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={marginLeft}
              x2={width - marginRight}
              y1={y(tick)}
              y2={y(tick)}
              stroke={tick === 0 ? axisColor : gridColor}
              strokeWidth="1"
              strokeDasharray={tick === 0 ? undefined : '4 4'}
            />
            <line x1={marginLeft - 5} x2={marginLeft} y1={y(tick)} y2={y(tick)} stroke={axisColor} strokeWidth="1" />
            <text
              x={marginLeft - 10}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fill={tickColor}
              fontSize="13"
            >
              {formatAxisValue(tick)}
            </text>
          </g>
        ))}
        {/* 纵轴 */}
        <line x1={marginLeft} x2={marginLeft} y1={marginTop} y2={baseline} stroke={axisColor} strokeWidth="1" />
        {/* 横轴刻度：日期 */}
        {dayTicks.map((index) => (
          <g key={daily[index].date}>
            <line x1={x(index)} x2={x(index)} y1={baseline} y2={baseline + 5} stroke={axisColor} strokeWidth="1" />
            <text
              x={x(index)}
              y={baseline + 22}
              textAnchor={index === 0 ? 'start' : index === daily.length - 1 ? 'end' : 'middle'}
              fill={tickColor}
              fontSize="13"
            >
              {formatDate(daily[index].date)}
            </text>
          </g>
        ))}
        {series.map((item) => (
          <g key={item.key}>
            <polyline points={points(item.key)} fill="none" stroke={outlineColor} strokeWidth="6" strokeDasharray={item.dash} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={points(item.key)} fill="none" stroke={item.color} strokeWidth="3" strokeDasharray={item.dash} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        {showDots &&
          series.map((item) => (
            <g key={`${item.key}-dots`}>
              {daily.map((day, index) => (
                <g key={day.date}>
                  <circle cx={x(index)} cy={y(day[item.key])} r="5" fill={outlineColor} />
                  <circle cx={x(index)} cy={y(day[item.key])} r="3" fill={item.color} />
                </g>
              ))}
            </g>
          ))}
      </svg>
      <p className={cn('mt-2 text-xs', isDark ? 'text-slate-500' : 'text-[#6a6a6a]')}>
        纵轴：当日数量（活跃{noun}按人计，页面访问与学习行为按次计）· 横轴：日期
      </p>
      <table id={dataTableId} className="sr-only">
        <caption>每日活动趋势数据</caption>
        <thead>
          <tr>
            <th>日期</th>
            <th>活跃{noun}</th>
            <th>页面访问</th>
            <th>学习行为</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.active_users}</td>
              <td>{day.pageviews}</td>
              <td>{day.learning_actions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopPages({
  pages,
  isDark,
  noun,
}: {
  pages: AdminActivityResponse['top_pages'];
  isDark: boolean;
  noun: string;
}) {
  if (pages.length === 0) {
    return <InlineEmpty isDark={isDark}>暂无热门页面</InlineEmpty>;
  }
  const max = Math.max(1, ...pages.map((page) => page.pageviews));

  return (
    <div className="space-y-4">
      {pages.map((page) => (
        <div key={page.path}>
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className={cn('min-w-0 break-all font-medium', isDark ? 'text-slate-200' : 'text-[#1a1a1a]')}>
              {formatPagePath(page.path)}
            </span>
            <span className={cn('shrink-0 tabular-nums', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}>
              {page.pageviews} 次
            </span>
          </div>
          <div className={cn('mt-2 h-2 overflow-hidden rounded-full', isDark ? 'bg-slate-800' : 'bg-[#f5f0e0]')}>
            <div className="h-full rounded-full bg-[#ffb084]" style={{ width: `${(page.pageviews / max) * 100}%` }} />
          </div>
          <p className={cn('mt-1 break-all text-xs', isDark ? 'text-slate-500' : 'text-[#6a6a6a]')}>
            {page.unique_users} 名{noun}访问 · {page.path || '/'}
          </p>
        </div>
      ))}
    </div>
  );
}

function ModuleBreakdown({
  modules,
  isDark,
  noun,
  onUserSelect,
}: {
  modules: AdminActivityResponse['module_breakdown'];
  isDark: boolean;
  noun: string;
  onUserSelect: (userId: string) => void;
}) {
  if (modules.length === 0) {
    return <InlineEmpty isDark={isDark}>暂无模块访问数据</InlineEmpty>;
  }
  const max = Math.max(1, ...modules.map((entry) => entry.pageviews));

  return (
    <div className="space-y-3">
      {modules.map((entry, index) => (
        <details
          key={entry.module}
          className={cn(
            'group rounded-2xl border',
            isDark ? 'border-slate-800' : 'border-[#f0f0f0]'
          )}
        >
          <summary
            className={cn(
              'flex cursor-pointer list-none items-center gap-3 rounded-2xl p-4 [&::-webkit-details-marker]:hidden',
              isDark ? 'hover:bg-slate-800' : 'hover:bg-[#faf5e8]'
            )}
          >
            <LayoutGrid
              className="h-4 w-4 shrink-0"
              style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className={cn('font-medium', isDark ? 'text-slate-200' : 'text-[#1a1a1a]')}>
                  {entry.label}
                </span>
                <span className={cn('shrink-0 tabular-nums', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}>
                  {entry.pageviews} 次 / {entry.unique_users} 人
                </span>
              </div>
              <div className={cn('mt-2 h-2 overflow-hidden rounded-full', isDark ? 'bg-slate-800' : 'bg-[#f5f0e0]')}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(entry.pageviews / max) * 100}%`,
                    background: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
              </div>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform group-open:rotate-180',
                isDark ? 'text-slate-500' : 'text-[#6a6a6a]'
              )}
              aria-hidden="true"
            />
          </summary>
          <div className="px-4 pb-4">
            {entry.users.length === 0 ? (
              <p className={cn('py-2 text-sm', isDark ? 'text-slate-500' : 'text-[#6a6a6a]')}>
                暂无{noun}访问该模块
              </p>
            ) : (
              <ul className="space-y-2">
                {entry.users.map((user) => (
                  <li key={user.user_id}>
                    <button
                      type="button"
                      onClick={() => onUserSelect(user.user_id)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition-colors',
                        isDark
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-[#3a3a3a] hover:bg-[#faf5e8]'
                      )}
                    >
                      <span className="min-w-0 truncate">{user.username}</span>
                      <span className={cn('shrink-0 tabular-nums', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}>
                        {user.pageviews} 次
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

function ActivityMix({
  items,
  isDark,
}: {
  items: AdminActivityResponse['activity_breakdown'];
  isDark: boolean;
}) {
  if (items.length === 0) {
    return <InlineEmpty isDark={isDark}>暂无学习行为</InlineEmpty>;
  }
  const total = Math.max(1, items.reduce((sum, item) => sum + item.count, 0));

  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full" aria-label="活动占比">
        {items.map((item, index) => (
          <div
            key={item.event}
            title={`${formatEventName(item.event)} ${item.count} 次`}
            style={{
              width: `${(item.count / total) * 100}%`,
              background: CHART_COLORS[index % CHART_COLORS.length],
            }}
          />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <div key={item.event} className="flex items-center justify-between gap-3 text-sm">
            <span className={cn('flex min-w-0 items-center gap-2', isDark ? 'text-slate-200' : 'text-[#1a1a1a]')}>
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} aria-hidden="true" />
              <span className="truncate">{formatEventName(item.event)}</span>
            </span>
            <span className={cn('shrink-0 tabular-nums', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}>
              {item.count} 次 / {item.unique_users} 人
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopUsers({
  users,
  isDark,
  noun,
  onUserSelect,
}: {
  users: AdminActivityResponse['top_users'];
  isDark: boolean;
  noun: string;
  onUserSelect: (userId: string) => void;
}) {
  if (users.length === 0) {
    return <InlineEmpty isDark={isDark}>暂无活跃{noun}</InlineEmpty>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className={isDark ? 'text-slate-400' : 'text-[#6a6a6a]'}>
          <tr>
            <th className="pb-3 pr-4 font-medium">{noun}</th>
            <th className="hidden pb-3 pr-4 text-right font-medium sm:table-cell">有效活动</th>
            <th className="hidden pb-3 pr-4 text-right font-medium md:table-cell">页面访问</th>
            <th className="pb-3 pr-4 text-right font-medium">学习行为</th>
            <th className="pb-3 text-right font-medium">最近活动</th>
          </tr>
        </thead>
        <tbody className={isDark ? 'text-slate-200' : 'text-[#1a1a1a]'}>
          {users.map((user) => (
            <tr
              key={user.user_id}
              tabIndex={0}
              role="button"
              aria-label={`查看 ${user.display_name} 的活动详情`}
              onClick={() => onUserSelect(user.user_id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onUserSelect(user.user_id);
                }
              }}
              className={cn(
                'cursor-pointer border-t transition-colors',
                isDark
                  ? 'border-slate-800 hover:bg-slate-800'
                  : 'border-[#f0f0f0] hover:bg-[#faf5e8]'
              )}
            >
              <td className="py-3 pr-4 font-medium">
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  {user.display_name}
                  <UserTypeBadge userType={user.user_type} isDark={isDark} />
                  <ChevronRight
                    aria-hidden="true"
                    className={cn('h-4 w-4', isDark ? 'text-slate-500' : 'text-[#a9a9a9]')}
                  />
                </span>
              </td>
              <td className="hidden py-3 pr-4 text-right tabular-nums sm:table-cell">{user.events}</td>
              <td className="hidden py-3 pr-4 text-right tabular-nums md:table-cell">{user.pageviews}</td>
              <td className="py-3 pr-4 text-right tabular-nums">{user.learning_actions}</td>
              <td className={cn('py-3 text-right text-xs', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}>
                {user.last_activity ? formatShortDateTime(user.last_activity) : '暂无记录'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserTypeBadge({
  userType,
  isDark,
}: {
  userType: UserType | null;
  isDark: boolean;
}) {
  const label = userType === 'student' ? '学生' : userType === 'teacher' ? '教师' : '未分类';
  const classes =
    userType === 'student'
      ? isDark
        ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : userType === 'teacher'
        ? isDark
          ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200'
          : 'border-cyan-200 bg-cyan-50 text-cyan-700'
        : isDark
          ? 'border-slate-700 bg-slate-800 text-slate-300'
          : 'border-slate-200 bg-slate-100 text-slate-600';

  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-medium', classes)}>
      {label}
    </span>
  );
}

function InlineEmpty({ isDark, children }: { isDark: boolean; children: ReactNode }) {
  return (
    <p className={cn('py-12 text-center text-sm', isDark ? 'text-slate-500' : 'text-[#6a6a6a]')}>
      {children}
    </p>
  );
}

function StatePanel({
  isDark,
  icon,
  title,
  description,
  action,
}: {
  isDark: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        'flex min-h-72 flex-col items-center justify-center rounded-3xl border px-6 py-12 text-center',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-[#e5e5e5] bg-white'
      )}
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', isDark ? 'bg-slate-800 text-emerald-300' : 'bg-[#f5f0e0] text-[#1a3a3a]')}>
        {icon}
      </div>
      <h2 className={cn('mt-5 text-xl font-semibold', isDark ? 'text-slate-100' : 'text-[#0a0a0a]')}>
        {title}
      </h2>
      <p className={cn('mt-2 max-w-md text-sm leading-6', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}>
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}

function ActivitySkeleton({ isDark, noun }: { isDark: boolean; noun: string }) {
  const block = isDark ? 'bg-slate-800' : 'bg-[#f5f0e0]';
  const panel = isDark ? 'border-slate-800 bg-slate-900' : 'border-[#e5e5e5] bg-white';

  return (
    <div role="status" aria-label={`正在加载${noun}活动`} className="animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className={cn('h-32 rounded-2xl border p-5', panel)}>
            <div className={cn('h-4 w-20 rounded', block)} />
            <div className={cn('mt-5 h-9 w-16 rounded', block)} />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className={cn('h-80 rounded-3xl border', panel)} />
        <div className={cn('h-80 rounded-3xl border', panel)} />
      </div>
      <span className="sr-only">正在加载{noun}活动</span>
    </div>
  );
}
