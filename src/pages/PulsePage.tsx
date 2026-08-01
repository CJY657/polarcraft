/**
 * 平台学习热度 / Public learning activity.
 *
 * Public by design: the leaderboard shows anonymous codes only — no username,
 * nickname or user id ever reaches this page (see server/public-stats.service).
 */

import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Eye,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { PersistentHeader } from "@/components/shared/PersistentHeader";
import { formatPagePath } from "@/lib/activity-labels";
import {
  publicStatsApi,
  type PublicActivityResponse,
  type PublicActivityWindow,
} from "@/lib/stats.service";
import { cn } from "@/utils/classNames";

const WINDOWS: Array<{ value: PublicActivityWindow; label: string }> = [
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
];

const MEDAL_STYLE = [
  "bg-clay-ochre text-[#10201f]",
  "bg-clay-surface-strong text-clay-ink",
  "bg-clay-peach text-[#10201f]",
];

function formatDay(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

export function PulsePage() {
  const [window, setWindow] = useState<PublicActivityWindow>("7d");
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState<PublicActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void publicStatsApi
      .getActivity(window)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "学习热度暂时无法加载");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [window, retryKey]);

  const summary = result?.summary;
  const isEmpty =
    result?.status === "ok" && (!summary || summary.active_learners === 0);

  return (
    <div className="clay-canvas min-h-screen">
      <PersistentHeader moduleName="学习热度" variant="solid" />

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:px-8">
        <header>
          <span className="clay-caption">Learning Pulse</span>
          <h1 className="clay-display-lg mt-3">平台学习热度</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-clay-body">
            汇总了全平台已登用户的学习活动：每天有多少人在做实验、看模拟、参与课题。
            数据每 10 分钟更新一次。
          </p>

          <div
            aria-label="统计时间范围"
            className="mt-6 inline-flex gap-1 rounded-2xl border border-clay-surface-strong bg-clay-surface-card p-1"
          >
            {WINDOWS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={window === option.value}
                onClick={() => setWindow(option.value)}
                className={cn(
                  "h-11 rounded-xl px-5 text-sm font-semibold transition-colors active:scale-[0.98]",
                  window === option.value
                    ? "bg-clay-ink text-white"
                    : "text-clay-body hover:bg-clay-surface-soft",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        {isLoading ? (
          <PulseSkeleton />
        ) : error ? (
          <StatePanel
            icon={<AlertTriangle className="h-6 w-6" />}
            title="加载学习热度失败"
            description={error}
            action={
              <button
                type="button"
                onClick={() => setRetryKey((current) => current + 1)}
                className="clay-button-primary"
              >
                <RefreshCw className="h-4 w-4" />
                重试
              </button>
            }
          />
        ) : result?.status === "disabled" ? (
          <StatePanel
            icon={<BarChart3 className="h-6 w-6" />}
            title="学习热度暂未启用"
            description="当前环境还没有开启活动统计，稍后再来看看。"
          />
        ) : isEmpty ? (
          <StatePanel
            icon={<Sparkles className="h-6 w-6" />}
            title="这段时间还很安静"
            description={`${result?.range.start} 至 ${result?.range.end} 还没有学习活动记录，快来做第一个。`}
          />
        ) : result && summary ? (
          <PulseDashboard result={result} />
        ) : null}
      </main>
    </div>
  );
}

function PulseDashboard({ result }: { result: PublicActivityResponse }) {
  const summary = result.summary!;
  const viewer = result.viewer;
  const viewerInTopList = Boolean(
    viewer && result.top_learners.some((learner) => learner.code === viewer.code),
  );

  const metrics = [
    {
      label: "活跃用户",
      value: summary.active_learners,
      unit: "人",
      description: "这段时间里至少学习过一次的用户人数。",
      Icon: Users,
    },
    {
      label: "页面浏览",
      value: summary.pageviews,
      unit: "次",
      description: "实验、模拟、课题等页面的访问次数。",
      Icon: Eye,
    },
    {
      label: "学习行为",
      value: summary.learning_actions,
      unit: "次",
      description: "进入实验和提交课题申请的合计次数。",
      Icon: Activity,
    },
  ];

  return (
    <>
      <section aria-label="学习热度概览" className="grid gap-5 sm:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.Icon;
          return (
            <div
              key={metric.label}
              className="rounded-[1.25rem] border border-clay-surface-strong bg-clay-surface-card p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-clay-body">{metric.label}</p>
                <Icon aria-hidden="true" className="h-5 w-5 text-clay-ink" />
              </div>
              <p className="mt-4 text-4xl font-bold tabular-nums text-clay-ink">
                {metric.value.toLocaleString("zh-CN")}
                <span className="ml-1 text-base font-semibold text-clay-muted">
                  {metric.unit}
                </span>
              </p>
              <p className="mt-2 text-sm leading-6 text-clay-body">{metric.description}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-[1.25rem] border border-clay-surface-strong bg-clay-surface-card p-6">
        <h2 className="text-xl font-semibold text-clay-ink">每日活跃人数</h2>
        <p className="mt-1 text-sm text-clay-body">每根柱子表示当天有多少用户在平台上学习。</p>
        <DailyBars daily={result.daily} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.25rem] border border-clay-surface-strong bg-clay-surface-card p-6">
          <h2 className="text-xl font-semibold text-clay-ink">活跃用户榜</h2>
          <p className="mt-1 text-sm text-clay-body">
            按有效活动次数排名，只展示前 10 位的匿名编号。
          </p>

          {result.top_learners.length === 0 ? (
            <InlineEmpty>暂时还没有上榜的用户</InlineEmpty>
          ) : (
            <ol className="mt-5 space-y-2">
              {result.top_learners.map((learner, index) => {
                const isViewer = viewer?.code === learner.code;
                return (
                  <li
                    key={learner.code}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3",
                      isViewer
                        ? "bg-clay-mint ring-2 ring-clay-ink"
                        : "bg-clay-surface-soft",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                        index < 3 ? MEDAL_STYLE[index] : "bg-clay-surface-card text-clay-body",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-base font-semibold text-clay-ink">
                      用户 #{learner.code}
                      {isViewer ? (
                        <span className="ml-2 rounded-full bg-clay-ink px-2 py-0.5 text-xs font-bold text-white">
                          你
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-clay-body">
                      {learner.events.toLocaleString("zh-CN")} 次
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {viewer && !viewerInTopList ? (
            <div className="mt-4 rounded-2xl bg-clay-mint px-4 py-4">
              <p className="text-sm font-semibold text-clay-ink">
                你的排名：第 {viewer.rank} 名
              </p>
              <p className="mt-1 text-sm text-clay-ink/80">
                用户 #{viewer.code} · {viewer.events.toLocaleString("zh-CN")} 次有效活动，
                继续加油就能进入榜单。
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.25rem] border border-clay-surface-strong bg-clay-surface-card p-6">
          <h2 className="text-xl font-semibold text-clay-ink">热门页面榜</h2>
          <p className="mt-1 text-sm text-clay-body">这段时间大家看得最多的内容。</p>
          <TopPages pages={result.top_pages} />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/experiments" className="clay-button-primary">
          去做实验
        </Link>
        <p className="text-sm text-clay-muted">
          统计区间 {result.range.start} 至 {result.range.end}
        </p>
      </div>
    </>
  );
}

function DailyBars({ daily }: { daily: PublicActivityResponse["daily"] }) {
  if (daily.length === 0) {
    return <InlineEmpty>暂无每日数据</InlineEmpty>;
  }

  const max = Math.max(1, ...daily.map((day) => day.active_learners));

  return (
    <div className="mt-6">
      <div className="flex h-40 items-end gap-1" aria-hidden="true">
        {daily.map((day) => (
          <div
            key={day.date}
            title={`${day.date} · ${day.active_learners} 人`}
            className="flex-1 rounded-t-lg bg-clay-teal"
            style={{ height: `${Math.max(4, (day.active_learners / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-clay-muted">
        <span>{formatDay(daily[0].date)}</span>
        {daily.length > 1 ? <span>{formatDay(daily[daily.length - 1].date)}</span> : null}
      </div>
      <table className="sr-only">
        <caption>每日活跃人数</caption>
        <thead>
          <tr>
            <th>日期</th>
            <th>活跃用户</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.active_learners}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopPages({ pages }: { pages: PublicActivityResponse["top_pages"] }) {
  if (pages.length === 0) {
    return <InlineEmpty>暂无热门页面</InlineEmpty>;
  }
  const max = Math.max(1, ...pages.map((page) => page.pageviews));

  return (
    <div className="mt-5 space-y-4">
      {pages.map((page) => (
        <div key={page.path}>
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0 font-semibold text-clay-ink">
              {formatPagePath(page.path)}
            </span>
            <span className="shrink-0 tabular-nums text-clay-body">
              {page.pageviews.toLocaleString("zh-CN")} 次
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-clay-surface-soft">
            <div
              className="h-full rounded-full bg-clay-lavender"
              style={{ width: `${(page.pageviews / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function InlineEmpty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-clay-muted">{children}</p>;
}

function StatePanel({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex min-h-72 flex-col items-center justify-center rounded-[1.5rem] border border-clay-surface-strong bg-clay-surface-card px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-surface-soft text-clay-ink">
        {icon}
      </div>
      <h2 className="mt-5 text-xl font-semibold text-clay-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-clay-body">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}

function PulseSkeleton() {
  return (
    <div role="status" aria-label="正在加载学习热度" className="animate-pulse space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-40 rounded-[1.25rem] border border-clay-surface-strong bg-clay-surface-card"
          />
        ))}
      </div>
      <div className="h-64 rounded-[1.25rem] border border-clay-surface-strong bg-clay-surface-card" />
      <span className="sr-only">正在加载学习热度</span>
    </div>
  );
}

export default PulsePage;
