import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FlaskConical, Lightbulb, Mail, RefreshCw, User } from "lucide-react";

import { PersistentHeader } from "@/components/shared/PersistentHeader";
import { useTheme } from "@/contexts/ThemeContext";
import {
  feedbackApi,
  type FeedbackAdminItem,
  type FeedbackCategory,
} from "@/lib/feedback.service";
import { cn } from "@/utils/classNames";

type FilterValue = "all" | FeedbackCategory;

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCategoryMeta(category: FeedbackCategory) {
  if (category === "experiment") {
    return {
      label: "实验反馈",
      icon: FlaskConical,
      chipClassName: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    };
  }

  return {
    label: "软件建议",
    icon: Lightbulb,
    chipClassName: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  };
}

export default function AdminFeedbackPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [items, setItems] = useState<FeedbackAdminItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeedback = async (nextFilter: FilterValue, refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const result = await feedbackApi.list({
        category: nextFilter,
        limit: 100,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "获取反馈列表失败");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadFeedback(filter);
  }, [filter]);

  const summary = useMemo(() => {
    const experimentCount = items.filter((item) => item.category === "experiment").length;
    const productCount = items.filter((item) => item.category === "product").length;

    return {
      experimentCount,
      productCount,
    };
  }, [items]);

  const filterButtonClasses = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
      active
        ? theme === "dark"
          ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
          : "border-cyan-300 bg-cyan-50 text-cyan-700"
        : theme === "dark"
          ? "border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-600"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
    );

  return (
    <div className={cn("min-h-screen", theme === "dark" ? "bg-slate-950" : "bg-slate-50")}>
      <PersistentHeader
        moduleName="反馈管理"
        variant="glass"
        className={cn(
          "sticky top-0 z-40",
          theme === "dark"
            ? "border-b border-slate-800 bg-slate-950/80"
            : "border-b border-slate-200 bg-white/80"
        )}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/admin/units")}
          className={cn(
            "mb-4 inline-flex items-center gap-1 text-sm transition-colors",
            theme === "dark"
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          返回管理员面板
        </button>

        <div
          className={cn(
            "flex flex-col gap-4 rounded-3xl border px-6 py-6 sm:flex-row sm:items-end sm:justify-between",
            theme === "dark" ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-white"
          )}
        >
          <div>
            <p className={cn("text-sm", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
              Admin Feedback Inbox
            </p>
            <h1
              className={cn(
                "mt-2 text-3xl font-semibold",
                theme === "dark" ? "text-white" : "text-slate-900"
              )}
            >
              反馈意见
            </h1>
            <p
              className={cn(
                "mt-3 text-sm leading-7",
                theme === "dark" ? "text-slate-300" : "text-slate-600"
              )}
            >
              所有用户提交的反馈都会保存在这里，仅管理员账户可以查看。当前展示最近 100 条记录。
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadFeedback(filter, true)}
            disabled={isLoading || isRefreshing}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-60",
              theme === "dark"
                ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", (isLoading || isRefreshing) && "animate-spin")} />
            刷新列表
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryCard
            theme={theme}
            label="当前列表"
            value={items.length}
            hint={filter === "all" ? `总计 ${total} 条` : `该分类总计 ${total} 条`}
          />
          <SummaryCard
            theme={theme}
            label="实验反馈"
            value={summary.experimentCount}
            hint="与实验内容、资源、说明相关"
          />
          <SummaryCard
            theme={theme}
            label="软件建议"
            value={summary.productCount}
            hint="与导航、交互、功能体验相关"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => setFilter("all")} className={filterButtonClasses(filter === "all")}>
            全部
          </button>
          <button
            type="button"
            onClick={() => setFilter("experiment")}
            className={filterButtonClasses(filter === "experiment")}
          >
            实验反馈
          </button>
          <button
            type="button"
            onClick={() => setFilter("product")}
            className={filterButtonClasses(filter === "product")}
          >
            软件建议
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div
            className={cn(
              "mt-6 flex items-center justify-center rounded-3xl border px-6 py-16",
              theme === "dark" ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"
            )}
          >
            <div className={cn("flex items-center gap-3 text-sm", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
              <RefreshCw className="h-4 w-4 animate-spin" />
              正在加载反馈列表...
            </div>
          </div>
        ) : null}

        {!isLoading && items.length === 0 ? (
          <div
            className={cn(
              "mt-6 rounded-3xl border px-6 py-16 text-center",
              theme === "dark" ? "border-slate-800 bg-slate-900/70 text-slate-400" : "border-slate-200 bg-white text-slate-500"
            )}
          >
            当前筛选条件下还没有反馈记录。
          </div>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <FeedbackCard key={item.id} item={item} theme={theme} />
            ))}
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
}: {
  label: string;
  value: number;
  hint: string;
  theme: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border px-5 py-5",
        theme === "dark" ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-white"
      )}
    >
      <p className={cn("text-sm", theme === "dark" ? "text-slate-400" : "text-slate-500")}>{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>
        {value}
      </p>
      <p className={cn("mt-2 text-sm leading-6", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
        {hint}
      </p>
    </div>
  );
}

function FeedbackCard({ item, theme }: { item: FeedbackAdminItem; theme: string }) {
  const meta = getCategoryMeta(item.category);
  const CategoryIcon = meta.icon;

  return (
    <article
      className={cn(
        "rounded-3xl border px-5 py-5",
        theme === "dark" ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-white"
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", meta.chipClassName)}>
              <CategoryIcon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            <span className={cn("text-xs", theme === "dark" ? "text-slate-500" : "text-slate-400")}>
              {formatDateTime(item.created_at)}
            </span>
            <span className={cn("text-xs", theme === "dark" ? "text-slate-500" : "text-slate-400")}>
              ID: {item.id}
            </span>
          </div>

          <h2 className={cn("mt-3 text-xl font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>
            {item.subject}
          </h2>

          <p className={cn("mt-3 whitespace-pre-wrap text-sm leading-7", theme === "dark" ? "text-slate-300" : "text-slate-700")}>
            {item.content}
          </p>
        </div>

        <div className="grid gap-3 text-sm lg:min-w-[320px]">
          <InfoRow theme={theme} label="实验" value={item.course_title || item.course_id || "未提供"} />
          <InfoRow theme={theme} label="来源页面" value={item.source_page || "未提供"} />
          <InfoRow theme={theme} label="页面路径" value={item.page_path || "未提供"} />
          <InfoRow
            theme={theme}
            label="提交人"
            value={item.contact_name || item.username || "匿名用户"}
            icon={User}
          />
          <InfoRow
            theme={theme}
            label="联系邮箱"
            value={item.contact_email || "未提供"}
            icon={Mail}
          />
          <InfoRow theme={theme} label="用户角色" value={item.user_role || "未登录"} />
        </div>
      </div>
    </article>
  );
}

function InfoRow({
  label,
  value,
  theme,
  icon: Icon,
}: {
  label: string;
  value: string;
  theme: string;
  icon?: typeof User;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        theme === "dark" ? "border-slate-800 bg-slate-950/60" : "border-slate-200 bg-slate-50"
      )}
    >
      <div className={cn("mb-1 flex items-center gap-2 text-xs", theme === "dark" ? "text-slate-500" : "text-slate-400")}>
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        <span>{label}</span>
      </div>
      <div className={cn("break-all text-sm", theme === "dark" ? "text-slate-200" : "text-slate-700")}>
        {value}
      </div>
    </div>
  );
}
