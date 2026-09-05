/**
 * 用户活动详情 — slide-over opened from the activity dashboard.
 * 教师常投屏查看，字号刻意偏大。
 */

import {
  useEffect,
  useId,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Eye,
  MousePointerClick,
  Percent,
  RefreshCw,
  X,
} from 'lucide-react';

import { formatActivityDelta, formatPagePath } from '@/lib/activity-labels';
import {
  adminUserApi,
  type AdminUserActivityResponse,
} from '@/lib/admin-user.service';
import type { UserType } from '@/lib/auth.service';
import { formatAxisDay, pickTickIndices } from '@/lib/chart-axis';
import { formatShortDateTime } from '@/lib/datetime.util';
import { cn } from '@/utils/classNames';

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const HOUR_BUCKETS = [
  { label: '0-3', hours: [0, 1, 2, 3] },
  { label: '4-7', hours: [4, 5, 6, 7] },
  { label: '8-11', hours: [8, 9, 10, 11] },
  { label: '12-15', hours: [12, 13, 14, 15] },
  { label: '16-19', hours: [16, 17, 18, 19] },
  { label: '20-23', hours: [20, 21, 22, 23] },
];

/** 上升绿、下降红、持平灰。 */
function deltaClass(direction: 'up' | 'down' | 'flat', isDark: boolean): string {
  if (direction === 'up') return isDark ? 'text-emerald-300' : 'text-[#1f7a5a]';
  if (direction === 'down') return isDark ? 'text-rose-300' : 'text-[#d23f63]';
  return isDark ? 'text-slate-400' : 'text-[#6a6a6a]';
}

export function UserTypeBadge({
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
    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', classes)}>
      {label}
    </span>
  );
}

export default function AdminLearnerActivityDrawer({
  userId,
  userName,
  userType,
  range,
  isDark,
  onClose,
}: {
  userId: string;
  userName: string;
  userType: UserType | null | undefined;
  range: { start: string; end: string };
  isDark: boolean;
  onClose: () => void;
}) {
  const [retryKey, setRetryKey] = useState(0);
  const [detail, setDetail] = useState<AdminUserActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setDetail(null);

    void adminUserApi
      .getActivityDetail(userId, range)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : '用户活动详情暂时无法加载'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, range.start, range.end, retryKey]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const surface = isDark ? 'border-slate-800 bg-slate-900' : 'border-[#e5e5e5] bg-white';
  const panel = isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#f0f0f0] bg-[#fdfbf4]';
  const muted = isDark ? 'text-slate-400' : 'text-[#6a6a6a]';
  const strong = isDark ? 'text-slate-50' : 'text-[#0a0a0a]';
  const hasResolvedUserType = detail !== null || userType !== undefined;
  const selectedUserType = detail ? detail.user_type : userType;
  const selectedUserName = detail?.display_name || userName;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${selectedUserName} 的活动详情`}
        className={cn(
          'relative flex h-full w-full max-w-2xl flex-col border-l shadow-2xl',
          surface
        )}
      >
        <header
          className={cn(
            'flex items-start justify-between gap-4 border-b px-6 py-5',
            isDark ? 'border-slate-800' : 'border-[#e5e5e5]'
          )}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn('truncate text-2xl font-semibold', strong)}>
                {selectedUserName}
              </h2>
              {hasResolvedUserType ? (
                <UserTypeBadge userType={selectedUserType ?? null} isDark={isDark} />
              ) : null}
            </div>
            <p className={cn('mt-1 text-sm', muted)}>
              {detail?.username && detail.username !== selectedUserName
                ? `账号 ${detail.username} · `
                : ''}
              账号活动详情 · {range.start} 至 {range.end}
              {detail?.last_activity
                ? ` · 最近活动 ${formatShortDateTime(detail.last_activity)}`
                : ''}
              {detail
                ? ` · 数据更新时间 ${formatShortDateTime(detail.generated_at)}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            aria-label="关闭账号活动详情"
            onClick={onClose}
            className={cn(
              'rounded-full p-2 transition-colors',
              isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-[#6a6a6a] hover:bg-[#faf5e8] hover:text-[#0a0a0a]'
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div
              role="status"
              aria-label="正在加载账号活动详情"
              className="animate-pulse space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className={cn('h-28 rounded-2xl border', panel)} />
                ))}
              </div>
              <div className={cn('h-56 rounded-2xl border', panel)} />
              <span className="sr-only">正在加载账号活动详情</span>
            </div>
          ) : error ? (
            <DrawerState
              isDark={isDark}
              icon={<AlertTriangle className="h-6 w-6" />}
              title="加载账号活动详情失败"
              description={error}
              action={
                <button
                  type="button"
                  onClick={() => setRetryKey((current) => current + 1)}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold active:scale-[0.98]',
                    isDark ? 'bg-emerald-300 text-emerald-950' : 'bg-[#0a0a0a] text-white'
                  )}
                >
                  <RefreshCw className="h-4 w-4" />
                  重试
                </button>
              }
            />
          ) : detail?.status === 'disabled' ? (
            <DrawerState
              isDark={isDark}
              icon={<BarChart3 className="h-6 w-6" />}
              title="行为统计暂未启用"
              description="当前环境尚未启用行为统计，完成服务器配置后即可查看。"
            />
          ) : detail && detail.summary && detail.summary.meaningful_events === 0 ? (
            <DrawerState
              isDark={isDark}
              icon={<Activity className="h-6 w-6" />}
              title="这段时间没有活动"
              description={`${range.start} 至 ${range.end} 该账号没有留下活动记录。`}
            />
          ) : detail && detail.summary ? (
            <UserActivityDetail detail={detail} isDark={isDark} />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export function UserActivityDetail({
  detail,
  isDark,
}: {
  detail: AdminUserActivityResponse;
  isDark: boolean;
}) {
  const summary = detail.summary!;
  const previous = detail.previous_summary;
  const panel = isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#f0f0f0] bg-[#fdfbf4]';
  const muted = isDark ? 'text-slate-400' : 'text-[#6a6a6a]';
  const strong = isDark ? 'text-slate-50' : 'text-[#0a0a0a]';
  const activeDays =
    summary.active_days ?? detail.daily.filter((day) => day.events > 0).length;
  const previousActiveDays = previous?.active_days;
  const averagePerActiveDay =
    summary.average_meaningful_events_per_active_day ??
    (activeDays === 0 ? 0 : summary.meaningful_events / activeDays);
  const previousAveragePerActiveDay =
    previous?.average_meaningful_events_per_active_day;
  const learningActionRate =
    summary.learning_action_rate ??
    (summary.meaningful_events === 0
      ? 0
      : (summary.learning_actions / summary.meaningful_events) * 100);
  const previousLearningActionRate =
    previous?.learning_action_rate ??
    (previous
      ? previous.meaningful_events === 0
        ? 0
        : (previous.learning_actions / previous.meaningful_events) * 100
      : undefined);
  const formatOneDecimal = (value: number) =>
    value.toLocaleString('zh-CN', { maximumFractionDigits: 1 });

  const metrics = [
    {
      label: '有效活动',
      value: summary.meaningful_events,
      previous: previous?.meaningful_events,
      Icon: Activity,
      color: '#1a3a3a',
    },
    {
      label: '页面访问',
      value: summary.pageviews,
      previous: previous?.pageviews,
      Icon: Eye,
      color: '#b8a4ed',
    },
    {
      label: '学习行为',
      value: summary.learning_actions,
      previous: previous?.learning_actions,
      Icon: MousePointerClick,
      color: '#e8b94a',
    },
    {
      label: '活跃天数',
      value: activeDays,
      previous: previousActiveDays,
      Icon: CalendarDays,
      color: '#ff4d8b',
      format: (value: number) => `${value.toLocaleString('zh-CN')} 天`,
    },
    {
      label: '活跃日均活动',
      value: averagePerActiveDay,
      previous: previousAveragePerActiveDay,
      Icon: Activity,
      color: '#2f8f83',
      format: (value: number) => `${formatOneDecimal(value)} 次`,
    },
    {
      label: '学习行为占比',
      value: learningActionRate,
      previous: previousLearningActionRate,
      Icon: Percent,
      color: '#d23f63',
      format: (value: number) => `${formatOneDecimal(value)}%`,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="账号活动指标">
        {metrics.map((metric) => {
          const Icon = metric.Icon;
          const delta = formatActivityDelta(metric.value, metric.previous);
          return (
            <div
              key={metric.label}
              className={cn('relative overflow-hidden rounded-2xl border p-4', panel)}
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: metric.color }}
              />
              <div className="flex items-center justify-between gap-3">
                <p className={cn('text-sm font-medium', muted)}>{metric.label}</p>
                <Icon aria-hidden="true" className="h-5 w-5" style={{ color: metric.color }} />
              </div>
              <p className={cn('mt-3 text-3xl font-semibold tabular-nums', strong)}>
                {'format' in metric && metric.format
                  ? metric.format(metric.value)
                  : metric.value.toLocaleString('zh-CN')}
              </p>
              {delta ? (
                <p className={cn('mt-1 text-sm font-medium', deltaClass(delta.direction, isDark))}>
                  {delta.direction === 'up' ? '↑ ' : delta.direction === 'down' ? '↓ ' : ''}
                  {delta.text}
                </p>
              ) : null}
            </div>
          );
        })}
      </section>

      <Section
        isDark={isDark}
        title="每日活动"
        description="三条曲线分别按各指标在当前日期范围内的自身峰值归一化，用于观察同步变化与峰值日期。"
      >
        <UserTrend daily={detail.daily} isDark={isDark} />
      </Section>

      <Section isDark={isDark} title="模块分布" description="按页面路径前缀归类的访问次数。">
        {detail.module_breakdown.length === 0 ? (
          <InlineEmpty isDark={isDark}>暂无模块访问数据</InlineEmpty>
        ) : (
          <div>
            {(() => {
              const modulePageviews = detail.module_breakdown.reduce(
                (total, entry) => total + entry.pageviews,
                0
              );
              const coverage =
                summary.pageviews === 0
                  ? 0
                  : Math.min(100, (modulePageviews / summary.pageviews) * 100);
              return (
                <p className={cn('mb-4 text-sm', muted)}>
                  六大模块覆盖 {modulePageviews.toLocaleString('zh-CN')} /{' '}
                  {summary.pageviews.toLocaleString('zh-CN')} 次页面访问（
                  {formatOneDecimal(coverage)}%）
                </p>
              );
            })()}
            <div className="space-y-3">
              {detail.module_breakdown.map((entry) => {
                const share =
                  summary.pageviews === 0
                    ? 0
                    : Math.min(100, (entry.pageviews / summary.pageviews) * 100);
                return (
                  <div key={entry.module}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className={cn('font-medium', strong)}>{entry.label}</span>
                      <span className={cn('shrink-0 tabular-nums', muted)}>
                        {entry.pageviews} 次 · {entry.active_days ?? 0} 天 ·{' '}
                        {formatOneDecimal(share)}%
                      </span>
                    </div>
                    <div
                      className={cn(
                        'mt-2 h-2 overflow-hidden rounded-full',
                        isDark ? 'bg-slate-800' : 'bg-[#f5f0e0]'
                      )}
                    >
                      <div
                        className="h-full rounded-full bg-[#ff4d8b]"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      <Section isDark={isDark} title="常访页面" description="访问次数最多的前 10 个页面。">
        {detail.top_pages.length === 0 ? (
          <InlineEmpty isDark={isDark}>暂无页面访问</InlineEmpty>
        ) : (
          <ul className="space-y-2">
            {detail.top_pages.map((page) => (
              <li
                key={page.path}
                className={cn('flex items-start justify-between gap-3 text-sm', strong)}
              >
                <span className="min-w-0 break-all font-medium">
                  {formatPagePath(page.path)}
                </span>
                <span className={cn('shrink-0 tabular-nums', muted)}>{page.pageviews} 次</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        isDark={isDark}
        title="时段热力图"
        description="按中国时区统计，颜色越深表示该时段活动越多。"
      >
        <HourlyHeatmap hourly={detail.hourly} isDark={isDark} />
      </Section>
    </div>
  );
}

function UserTrend({
  daily,
  isDark,
}: {
  daily: AdminUserActivityResponse['daily'];
  isDark: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const dataTableId = useId();
  const helpId = useId();

  if (daily.length === 0) {
    return <InlineEmpty isDark={isDark}>暂无每日趋势</InlineEmpty>;
  }

  const width = 720;
  const height = 270;
  const marginLeft = 54;
  const marginRight = 16;
  const marginTop = 18;
  const marginBottom = 42;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;
  const baseline = marginTop + plotHeight;
  const yTicks = [0, 25, 50, 75, 100];
  const dayTicks = pickTickIndices(daily.length, 6);
  const series = [
    { key: 'events', label: '有效活动', color: '#2f8f83', dash: undefined },
    { key: 'pageviews', label: '页面访问', color: '#b8a4ed', dash: '12 6' },
    { key: 'learning_actions', label: '学习行为', color: '#c58b2b', dash: '3 6' },
  ] as const;
  type SeriesKey = (typeof series)[number]['key'];
  const safeValue = (value: number) =>
    Number.isFinite(value) ? Math.max(0, value) : 0;
  const peaks = Object.fromEntries(
    series.map((item) => [
      item.key,
      Math.max(0, ...daily.map((day) => safeValue(day[item.key]))),
    ])
  ) as Record<SeriesKey, number>;
  const normalizedValue = (key: SeriesKey, value: number) =>
    peaks[key] === 0 ? 0 : (safeValue(value) / peaks[key]) * 100;
  const x = (index: number) =>
    daily.length === 1
      ? marginLeft + plotWidth / 2
      : marginLeft + (index * plotWidth) / (daily.length - 1);
  const y = (percent: number) => baseline - (percent / 100) * plotHeight;
  const points = (key: SeriesKey) =>
    daily
      .map((day, index) => `${x(index)},${y(normalizedValue(key, day[key]))}`)
      .join(' ');
  const outlineColor = isDark ? '#f8fafc' : '#3a3a3a';
  const gridColor = isDark ? '#334155' : '#e5ddc8';
  const axisColor = isDark ? '#64748b' : '#cdc5ae';
  const tickColor = isDark ? '#94a3b8' : '#6a6a6a';
  const tooltipSurface = isDark ? '#0f172a' : '#fffdf7';
  const tooltipText = isDark ? '#f8fafc' : '#0a0a0a';
  const selectedDay = selectedIndex === null ? null : daily[selectedIndex];
  const selectedX = selectedIndex === null ? 0 : x(selectedIndex);
  const tooltipWidth = 210;
  const tooltipX = Math.min(
    width - marginRight - tooltipWidth,
    Math.max(marginLeft + 4, selectedX - tooltipWidth / 2)
  );

  const onKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setSelectedIndex(null);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    setSelectedIndex((current) => {
      const index = current ?? 0;
      return event.key === 'ArrowLeft'
        ? Math.max(0, index - 1)
        : Math.min(daily.length - 1, index + 1);
    });
  };

  return (
    <figure>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs" aria-label="趋势图例">
        {series.map((item) => (
          <span
            key={item.key}
            className={cn(
              'inline-flex items-center gap-2',
              isDark ? 'text-slate-300' : 'text-[#3a3a3a]'
            )}
          >
            <svg viewBox="0 0 20 6" className="h-1.5 w-5" aria-hidden="true">
              <line
                x1="0"
                x2="20"
                y1="3"
                y2="3"
                stroke={outlineColor}
                strokeWidth="5"
                strokeDasharray={item.dash}
              />
              <line
                x1="0"
                x2="20"
                y1="3"
                y2="3"
                stroke={item.color}
                strokeWidth="3"
                strokeDasharray={item.dash}
              />
            </svg>
            {item.label}
          </span>
        ))}
      </div>

      <svg
        role="img"
        aria-label="每日三指标相对趋势"
        aria-describedby={`${helpId} ${dataTableId}`}
        viewBox={`0 0 ${width} ${height}`}
        tabIndex={0}
        onFocus={() => setSelectedIndex((current) => current ?? 0)}
        onBlur={() => setSelectedIndex(null)}
        onKeyDown={onKeyDown}
        onPointerLeave={() => setSelectedIndex(null)}
        className="mt-4 h-auto w-full overflow-visible rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        {yTicks.map((tick) => (
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
            <text
              x={marginLeft - 10}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fill={tickColor}
              fontSize="13"
            >
              {tick}%
            </text>
          </g>
        ))}
        <line
          x1={marginLeft}
          x2={marginLeft}
          y1={marginTop}
          y2={baseline}
          stroke={axisColor}
          strokeWidth="1"
        />
        {dayTicks.map((index) => (
          <g key={daily[index].date} data-axis-date={daily[index].date}>
            <line
              x1={x(index)}
              x2={x(index)}
              y1={baseline}
              y2={baseline + 5}
              stroke={axisColor}
              strokeWidth="1"
            />
            <text
              x={x(index)}
              y={baseline + 23}
              textAnchor={
                index === 0 ? 'start' : index === daily.length - 1 ? 'end' : 'middle'
              }
              fill={tickColor}
              fontSize="13"
            >
              {formatAxisDay(daily[index].date)}
            </text>
          </g>
        ))}

        {series.map((item) => (
          <polyline
            key={`${item.key}-outline`}
            data-series-outline={item.key}
            points={points(item.key)}
            fill="none"
            stroke={outlineColor}
            strokeWidth="6"
            strokeDasharray={item.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          />
        ))}
        {series.map((item) => (
          <polyline
            key={item.key}
            data-series={item.key}
            data-peak={peaks[item.key]}
            points={points(item.key)}
            fill="none"
            stroke={item.color}
            strokeWidth="3"
            strokeDasharray={item.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          />
        ))}

        {daily.map((day, index) => (
          <rect
            key={day.date}
            data-day-index={index}
            x={marginLeft + (index * plotWidth) / daily.length}
            y={marginTop}
            width={plotWidth / daily.length}
            height={plotHeight}
            fill="transparent"
            onPointerEnter={() => setSelectedIndex(index)}
            onPointerDown={() => setSelectedIndex(index)}
          />
        ))}

        {selectedDay ? (
          <g aria-hidden="true" pointerEvents="none">
            <line
              x1={selectedX}
              x2={selectedX}
              y1={marginTop}
              y2={baseline}
              stroke={outlineColor}
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <rect
              x={tooltipX}
              y={marginTop + 6}
              width={tooltipWidth}
              height="92"
              rx="10"
              fill={tooltipSurface}
              stroke={axisColor}
            />
            <text x={tooltipX + 12} y={marginTop + 26} fill={tooltipText} fontSize="13" fontWeight="600">
              {selectedDay.date}
            </text>
            <text x={tooltipX + 12} y={marginTop + 47} fill={tooltipText} fontSize="13">
              有效活动 {selectedDay.events.toLocaleString('zh-CN')} 次
            </text>
            <text x={tooltipX + 12} y={marginTop + 66} fill={tooltipText} fontSize="13">
              页面访问 {selectedDay.pageviews.toLocaleString('zh-CN')} 次
            </text>
            <text x={tooltipX + 12} y={marginTop + 85} fill={tooltipText} fontSize="13">
              学习行为 {selectedDay.learning_actions.toLocaleString('zh-CN')} 次
            </text>
          </g>
        ) : null}
      </svg>

      <figcaption
        id={helpId}
        className={cn('mt-2 text-xs', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}
      >
        纵轴：各指标相对自身峰值（%）· 横轴：日期（月/日）。曲线高度不可用于比较三项绝对数量；聚焦图表后可用左右方向键查看真实次数。
      </figcaption>

      <p className="sr-only" role="status" aria-live="polite">
        {selectedDay
          ? `${selectedDay.date}，有效活动 ${selectedDay.events} 次，页面访问 ${selectedDay.pageviews} 次，学习行为 ${selectedDay.learning_actions} 次`
          : ''}
      </p>

      <table id={dataTableId} className="sr-only">
        <caption>每日活动数据</caption>
        <thead>
          <tr>
            <th>日期</th>
            <th>有效活动</th>
            <th>页面访问</th>
            <th>学习行为</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.events}</td>
              <td>{day.pageviews}</td>
              <td>{day.learning_actions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function HourlyHeatmap({
  hourly,
  isDark,
}: {
  hourly: AdminUserActivityResponse['hourly'];
  isDark: boolean;
}) {
  if (hourly.length === 0) {
    return <InlineEmpty isDark={isDark}>暂无时段数据</InlineEmpty>;
  }

  // weekday 1-7 (Mon-Sun) × 4-hour buckets, so a projected grid stays readable.
  const counts = new Map<string, number>();
  for (const cell of hourly) {
    const bucket = HOUR_BUCKETS.findIndex((entry) => entry.hours.includes(cell.hour));
    if (bucket < 0) continue;
    const key = `${cell.weekday}-${bucket}`;
    counts.set(key, (counts.get(key) ?? 0) + cell.count);
  }
  const max = Math.max(1, ...counts.values());

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[380px] border-separate border-spacing-1 text-sm">
        <caption className="sr-only">按星期与时段统计的活动次数</caption>
        <thead>
          <tr>
            <th />
            {HOUR_BUCKETS.map((bucket) => (
              <th
                key={bucket.label}
                scope="col"
                className={cn(
                  'pb-1 text-center text-xs font-medium',
                  isDark ? 'text-slate-400' : 'text-[#6a6a6a]'
                )}
              >
                {bucket.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WEEKDAY_LABELS.map((label, dayIndex) => (
            <tr key={label}>
              <th
                scope="row"
                className={cn(
                  'pr-2 text-right text-xs font-medium',
                  isDark ? 'text-slate-400' : 'text-[#6a6a6a]'
                )}
              >
                {label}
              </th>
              {HOUR_BUCKETS.map((bucket, bucketIndex) => {
                const count = counts.get(`${dayIndex + 1}-${bucketIndex}`) ?? 0;
                return (
                  <td key={bucket.label} className="p-0">
                    <div
                      title={`${label} ${bucket.label} 点 · ${count} 次`}
                      className={cn(
                        'flex h-9 items-center justify-center rounded-lg text-xs font-semibold tabular-nums',
                        count === 0
                          ? isDark
                            ? 'bg-slate-800 text-slate-600'
                            : 'bg-[#f5f0e0] text-[#c4bda6]'
                          : 'text-[#10201f]'
                      )}
                      style={
                        count === 0
                          ? undefined
                          : {
                              backgroundColor: `rgba(47, 143, 131, ${
                                0.25 + (count / max) * 0.75
                              })`,
                            }
                      }
                    >
                      {count || ''}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({
  isDark,
  title,
  description,
  children,
}: {
  isDark: boolean;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border p-5',
        isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#f0f0f0] bg-[#fdfbf4]'
      )}
    >
      <h3 className={cn('text-lg font-semibold', isDark ? 'text-slate-100' : 'text-[#0a0a0a]')}>
        {title}
      </h3>
      {description ? (
        <p className={cn('mt-1 text-xs leading-5', isDark ? 'text-slate-400' : 'text-[#6a6a6a]')}>
          {description}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InlineEmpty({ isDark, children }: { isDark: boolean; children: ReactNode }) {
  return (
    <p className={cn('py-8 text-center text-sm', isDark ? 'text-slate-500' : 'text-[#6a6a6a]')}>
      {children}
    </p>
  );
}

function DrawerState({
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
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-2xl',
          isDark ? 'bg-slate-800 text-emerald-300' : 'bg-[#f5f0e0] text-[#1a3a3a]'
        )}
      >
        {icon}
      </div>
      <h3 className={cn('mt-5 text-xl font-semibold', isDark ? 'text-slate-100' : 'text-[#0a0a0a]')}>
        {title}
      </h3>
      <p
        className={cn(
          'mt-2 max-w-sm text-sm leading-6',
          isDark ? 'text-slate-400' : 'text-[#6a6a6a]'
        )}
      >
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
