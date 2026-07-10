import { useEffect, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  Eye,
  MousePointerClick,
  RefreshCw,
  Users,
} from 'lucide-react';

import { PersistentHeader } from '@/components/shared/PersistentHeader';
import { useTheme } from '@/contexts/ThemeContext';
import {
  adminUserApi,
  type AdminActivityDays,
  type AdminActivityResponse,
} from '@/lib/admin-user.service';
import { cn } from '@/utils/classNames';

const RANGES: Array<{ days: AdminActivityDays; label: string }> = [
  { days: 7, label: '近 7 天' },
  { days: 30, label: '近 30 天' },
  { days: 90, label: '近 90 天' },
];

const EVENT_LABELS: Record<string, string> = {
  $pageview: '页面访问',
  auth_login_success: '登录平台',
  auth_register_success: '完成注册',
  course_opened: '进入课程',
  experiment_opened: '进入实验',
  feedback_submitted: '提交反馈',
  gallery_work_opened: '查看学习成果',
  project_application_submitted: '提交课题申请',
  research_project_opened: '查看研究课题',
  simulation_opened: '使用计算模拟',
  unit_opened: '进入学习单元',
};

const CHART_COLORS = ['#ff4d8b', '#1a3a3a', '#b8a4ed', '#ffb084', '#e8b94a'];

function formatEventName(event: string): string {
  return EVENT_LABELS[event] ?? '其他学习行为';
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminActivityPage() {
  const { theme } = useTheme();
  const [days, setDays] = useState<AdminActivityDays>(30);
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState<AdminActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void adminUserApi
      .getActivity(days)
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
  }, [days, retryKey]);

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
              查看已登录学生的页面访问和学习行为，快速了解近期学习参与情况。
            </p>
          </div>

          <div
            className={cn(
              'inline-flex w-full gap-1 rounded-2xl border p-1 lg:w-auto',
              isDark ? 'border-slate-700 bg-slate-900' : 'border-[#e5e5e5] bg-white'
            )}
            aria-label="统计时间范围"
          >
            {RANGES.map((range) => {
              const selected = days === range.days;
              return (
                <button
                  key={range.days}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setDays(range.days)}
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
                  {range.label}
                </button>
              );
            })}
          </div>
        </header>

        <div className="mt-7">
          {isLoading ? (
            <ActivitySkeleton isDark={isDark} />
          ) : error ? (
            <StatePanel
              isDark={isDark}
              icon={<AlertTriangle className="h-6 w-6" />}
              title="加载用户活动失败"
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
              description={`近 ${days} 天还没有已登录学生的学习活动。`}
            />
          ) : result?.summary ? (
            <Dashboard result={result} isDark={isDark} />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ result, isDark }: { result: AdminActivityResponse; isDark: boolean }) {
  const summary = result.summary!;
  const metrics = [
    { label: '活跃学生', value: summary.active_learners, icon: Users, color: '#ff4d8b' },
    { label: '有效活动', value: summary.meaningful_events, icon: Activity, color: '#1a3a3a' },
    { label: '页面访问', value: summary.pageviews, icon: Eye, color: '#b8a4ed' },
    { label: '学习行为', value: summary.learning_actions, icon: MousePointerClick, color: '#e8b94a' },
  ];

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="活动概览">
        {metrics.map((metric) => {
          const Icon = metric.icon;
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
            </div>
          );
        })}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <Panel isDark={isDark} title="每日活动趋势">
          <DailyTrend daily={result.daily} isDark={isDark} />
        </Panel>
        <Panel isDark={isDark} title="热门页面">
          <TopPages pages={result.top_pages} isDark={isDark} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
        <Panel isDark={isDark} title="活动构成">
          <ActivityMix items={result.activity_breakdown} isDark={isDark} />
        </Panel>
        <Panel isDark={isDark} title="活跃学生排行">
          <TopLearners learners={result.top_learners} isDark={isDark} />
        </Panel>
      </div>

      <p className={cn('mt-4 text-right text-xs', isDark ? 'text-slate-500' : 'text-[#6a6a6a]')}>
        数据更新时间：{formatDateTime(result.generated_at)}
      </p>
    </>
  );
}

function Panel({
  isDark,
  title,
  children,
}: {
  isDark: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-3xl border p-5 sm:p-6',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-[#e5e5e5] bg-white'
      )}
    >
      <h2 className={cn('text-lg font-semibold', isDark ? 'text-slate-100' : 'text-[#0a0a0a]')}>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DailyTrend({ daily, isDark }: { daily: AdminActivityResponse['daily']; isDark: boolean }) {
  if (daily.length === 0) {
    return <InlineEmpty isDark={isDark}>暂无每日趋势</InlineEmpty>;
  }

  const width = 720;
  const height = 220;
  const padding = 22;
  const maxValue = Math.max(
    1,
    ...daily.flatMap((day) => [day.active_learners, day.pageviews, day.learning_actions])
  );
  const x = (index: number) =>
    daily.length === 1
      ? width / 2
      : padding + (index * (width - padding * 2)) / (daily.length - 1);
  const y = (value: number) => height - padding - (value / maxValue) * (height - padding * 2);
  const points = (key: 'active_learners' | 'pageviews' | 'learning_actions') =>
    daily.map((day, index) => `${x(index)},${y(day[key])}`).join(' ');
  const series = [
    { key: 'active_learners', label: '活跃学生', color: '#ff4d8b', dash: undefined },
    { key: 'pageviews', label: '页面访问', color: '#b8a4ed', dash: '12 6' },
    { key: 'learning_actions', label: '学习行为', color: '#e8b94a', dash: '3 6' },
  ] as const;
  const outlineColor = isDark ? '#f8fafc' : '#3a3a3a';
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
        {[0.25, 0.5, 0.75].map((position) => (
          <line
            key={position}
            x1={padding}
            x2={width - padding}
            y1={padding + (height - padding * 2) * position}
            y2={padding + (height - padding * 2) * position}
            stroke={isDark ? '#334155' : '#ebe6d6'}
            strokeWidth="1"
          />
        ))}
        {series.map((item) => (
          <g key={item.key}>
            <polyline points={points(item.key)} fill="none" stroke={outlineColor} strokeWidth="6" strokeDasharray={item.dash} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={points(item.key)} fill="none" stroke={item.color} strokeWidth="3" strokeDasharray={item.dash} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        {daily.length === 1 && (
          series.map((item) => (
            <g key={item.key}>
              <circle cx={x(0)} cy={y(daily[0][item.key])} r="7" fill={outlineColor} />
              <circle cx={x(0)} cy={y(daily[0][item.key])} r="5" fill={item.color} />
            </g>
          ))
        )}
      </svg>
      <div className={cn('mt-2 flex justify-between text-xs', isDark ? 'text-slate-500' : 'text-[#6a6a6a]')}>
        <span>{formatDate(daily[0].date)}</span>
        {daily.length > 1 && <span>{formatDate(daily[daily.length - 1].date)}</span>}
      </div>
      <table id={dataTableId} className="sr-only">
        <caption>每日活动趋势数据</caption>
        <thead>
          <tr>
            <th>日期</th>
            <th>活跃学生</th>
            <th>页面访问</th>
            <th>学习行为</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.active_learners}</td>
              <td>{day.pageviews}</td>
              <td>{day.learning_actions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopPages({ pages, isDark }: { pages: AdminActivityResponse['top_pages']; isDark: boolean }) {
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
              {page.path || '/'}
            </span>
            <span className={cn('shrink-0 tabular-nums', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}>
              {page.pageviews} 次
            </span>
          </div>
          <div className={cn('mt-2 h-2 overflow-hidden rounded-full', isDark ? 'bg-slate-800' : 'bg-[#f5f0e0]')}>
            <div className="h-full rounded-full bg-[#ffb084]" style={{ width: `${(page.pageviews / max) * 100}%` }} />
          </div>
          <p className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-[#6a6a6a]')}>
            {page.unique_learners} 名学生访问
          </p>
        </div>
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
              {item.count} 次 / {item.unique_learners} 人
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopLearners({
  learners,
  isDark,
}: {
  learners: AdminActivityResponse['top_learners'];
  isDark: boolean;
}) {
  if (learners.length === 0) {
    return <InlineEmpty isDark={isDark}>暂无活跃学生</InlineEmpty>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className={isDark ? 'text-slate-400' : 'text-[#6a6a6a]'}>
          <tr>
            <th className="pb-3 pr-4 font-medium">学生</th>
            <th className="hidden pb-3 pr-4 text-right font-medium sm:table-cell">有效活动</th>
            <th className="hidden pb-3 pr-4 text-right font-medium md:table-cell">页面访问</th>
            <th className="pb-3 pr-4 text-right font-medium">学习行为</th>
            <th className="pb-3 text-right font-medium">最近活动</th>
          </tr>
        </thead>
        <tbody className={isDark ? 'text-slate-200' : 'text-[#1a1a1a]'}>
          {learners.map((learner) => (
            <tr key={learner.user_id} className={cn('border-t', isDark ? 'border-slate-800' : 'border-[#f0f0f0]')}>
              <td className="py-3 pr-4 font-medium">{learner.username}</td>
              <td className="hidden py-3 pr-4 text-right tabular-nums sm:table-cell">{learner.events}</td>
              <td className="hidden py-3 pr-4 text-right tabular-nums md:table-cell">{learner.pageviews}</td>
              <td className="py-3 pr-4 text-right tabular-nums">{learner.learning_actions}</td>
              <td className={cn('py-3 text-right text-xs', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}>
                {learner.last_activity ? formatDateTime(learner.last_activity) : '暂无记录'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

function ActivitySkeleton({ isDark }: { isDark: boolean }) {
  const block = isDark ? 'bg-slate-800' : 'bg-[#f5f0e0]';
  const panel = isDark ? 'border-slate-800 bg-slate-900' : 'border-[#e5e5e5] bg-white';

  return (
    <div role="status" aria-label="正在加载用户活动" className="animate-pulse">
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
      <span className="sr-only">正在加载用户活动</span>
    </div>
  );
}
