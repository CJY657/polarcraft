/**
 * 学生活动详情 — slide-over for one learner, opened from the activity dashboard.
 * 教师常投屏查看，字号刻意偏大。
 */

import { useEffect, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Eye,
  MousePointerClick,
  RefreshCw,
  X,
} from 'lucide-react';

import { formatActivityDelta, formatPagePath } from '@/lib/activity-labels';
import {
  adminUserApi,
  type AdminLearnerActivityResponse,
} from '@/lib/admin-user.service';
import { buildValueAxis, formatAxisDay, formatAxisValue, pickTickIndices } from '@/lib/chart-axis';
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

export default function AdminLearnerActivityDrawer({
  userId,
  learnerName,
  range,
  isDark,
  onClose,
}: {
  userId: string;
  learnerName: string;
  range: { start: string; end: string };
  isDark: boolean;
  onClose: () => void;
}) {
  const [retryKey, setRetryKey] = useState(0);
  const [detail, setDetail] = useState<AdminLearnerActivityResponse | null>(null);
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
            loadError instanceof Error ? loadError.message : '学生活动详情暂时无法加载'
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
        aria-label={`${learnerName} 的活动详情`}
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
            <h2 className={cn('truncate text-2xl font-semibold', strong)}>{learnerName}</h2>
            <p className={cn('mt-1 text-sm', muted)}>
              学生活动详情 · {range.start} 至 {range.end}
              {detail?.last_activity
                ? ` · 最近活动 ${formatShortDateTime(detail.last_activity)}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            aria-label="关闭学生活动详情"
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
              aria-label="正在加载学生活动详情"
              className="animate-pulse space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className={cn('h-28 rounded-2xl border', panel)} />
                ))}
              </div>
              <div className={cn('h-56 rounded-2xl border', panel)} />
              <span className="sr-only">正在加载学生活动详情</span>
            </div>
          ) : error ? (
            <DrawerState
              isDark={isDark}
              icon={<AlertTriangle className="h-6 w-6" />}
              title="加载学生活动详情失败"
              description={error}
              action={
                <button
                  type="button"
                  onClick={() => setRetryKey((current) => current + 1)}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold active:scale-[0.98]',
                    isDark ? 'bg-emerald-300 text-slate-950' : 'bg-[#0a0a0a] text-white'
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
              description={`${range.start} 至 ${range.end} 该学生没有留下学习记录。`}
            />
          ) : detail && detail.summary ? (
            <LearnerDetail detail={detail} isDark={isDark} />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function LearnerDetail({
  detail,
  isDark,
}: {
  detail: AdminLearnerActivityResponse;
  isDark: boolean;
}) {
  const summary = detail.summary!;
  const previous = detail.previous_summary;
  const panel = isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#f0f0f0] bg-[#fdfbf4]';
  const muted = isDark ? 'text-slate-400' : 'text-[#6a6a6a]';
  const strong = isDark ? 'text-slate-50' : 'text-[#0a0a0a]';

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
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3" aria-label="学生活动指标">
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
                {metric.value.toLocaleString('zh-CN')}
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

      <Section isDark={isDark} title="每日活动" description="该学生每天纳入统计的有效活动次数。">
        <LearnerTrend daily={detail.daily} isDark={isDark} />
      </Section>

      <Section isDark={isDark} title="模块分布" description="按页面路径前缀归类的访问次数。">
        {detail.module_breakdown.length === 0 ? (
          <InlineEmpty isDark={isDark}>暂无模块访问数据</InlineEmpty>
        ) : (
          <div className="space-y-3">
            {detail.module_breakdown.map((entry) => {
              const max = Math.max(
                1,
                ...detail.module_breakdown.map((item) => item.pageviews)
              );
              return (
                <div key={entry.module}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className={cn('font-medium', strong)}>{entry.label}</span>
                    <span className={cn('shrink-0 tabular-nums', muted)}>
                      {entry.pageviews} 次
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
                      style={{ width: `${(entry.pageviews / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
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

function LearnerTrend({
  daily,
  isDark,
}: {
  daily: AdminLearnerActivityResponse['daily'];
  isDark: boolean;
}) {
  if (daily.length === 0) {
    return <InlineEmpty isDark={isDark}>暂无每日趋势</InlineEmpty>;
  }

  const axis = buildValueAxis(Math.max(...daily.map((day) => day.events)));
  const labelled = new Set(pickTickIndices(daily.length, 6));
  const tickText = isDark ? 'text-slate-400' : 'text-[#6a6a6a]';
  const gridLine = isDark ? 'border-slate-700' : 'border-[#e5ddc8]';
  const axisLine = isDark ? 'border-slate-600' : 'border-[#cdc5ae]';

  return (
    <figure>
      <div className="flex gap-2" aria-hidden="true">
        {/* 纵轴刻度：次数 */}
        <div className="relative h-36 w-10 shrink-0">
          {axis.ticks.map((tick) => (
            <span
              key={tick}
              className={cn(
                'absolute right-0 translate-y-1/2 text-xs tabular-nums',
                tickText
              )}
              style={{ bottom: `${(tick / axis.max) * 100}%` }}
            >
              {formatAxisValue(tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className={cn('relative h-36 border-b border-l', axisLine)}>
            {axis.ticks.map((tick) =>
              tick === 0 ? null : (
                <div
                  key={tick}
                  className={cn('absolute inset-x-0 border-t border-dashed', gridLine)}
                  style={{ bottom: `${(tick / axis.max) * 100}%` }}
                />
              )
            )}
            <div className="absolute inset-0 flex items-end gap-1">
              {daily.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date} · ${day.events} 次`}
                  className="flex h-full flex-1 items-end"
                >
                  <div
                    className="w-full rounded-t bg-[#2f8f83]"
                    style={{
                      height:
                        day.events === 0
                          ? '0%'
                          : `${Math.max(2, (day.events / axis.max) * 100)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 横轴刻度：日期 */}
          <div className="mt-2 flex gap-1">
            {daily.map((day, index) => (
              <span
                key={day.date}
                className={cn(
                  'min-w-0 flex-1 whitespace-nowrap text-center text-xs tabular-nums',
                  tickText
                )}
              >
                {labelled.has(index) ? formatAxisDay(day.date) : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      <figcaption className={cn('mt-3 text-xs', tickText)}>
        纵轴：当日有效活动次数（次）· 横轴：日期（月/日）· 虚线为刻度参考线
      </figcaption>

      <table className="sr-only">
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
  hourly: AdminLearnerActivityResponse['hourly'];
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
