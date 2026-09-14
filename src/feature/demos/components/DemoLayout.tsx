/**
 * DemoLayout - 演示页共享布局组件
 *
 * 统一各演示的版面节奏：
 * - DemoStage: 可视化"舞台"面板（深色舞台 + 标题栏 + 图例 + 操作区）
 * - DemoSection: 带小节标题的内容区（原理卡片、思考题等）
 * - LegendChip: 舞台标题栏中的彩色图例
 *
 * 设计原则：光学演示的画布永远是深色舞台（黑暗中才能"看见光"），
 * 标题栏与周边区域则跟随亮/暗主题。
 */
import { ReactNode } from "react";
import { cn } from "@/utils/classNames";
import { useTheme } from "@/contexts/ThemeContext";

export interface LegendItem {
  color: string;
  label: string;
  /** 形状：dot 圆点 | line 线段 */
  shape?: "dot" | "line";
}

export function LegendChip({ item }: { item: LegendItem }) {
  const { theme } = useTheme();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs leading-5 whitespace-nowrap",
        theme === "dark" ? "text-gray-300" : "text-gray-600",
      )}
    >
      {item.shape === "line" ? (
        <span
          className="inline-block h-0.5 w-4 shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
        />
      ) : (
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
        />
      )}
      {item.label}
    </span>
  );
}

interface DemoStageProps {
  title?: string;
  /** 标题旁的辅助说明 */
  subtitle?: string;
  legend?: LegendItem[];
  /** 标题栏右侧操作区（按钮等） */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 舞台内容区的内边距，默认 p-2 sm:p-4 */
  bodyClassName?: string;
}

export function DemoStage({
  title,
  subtitle,
  legend,
  actions,
  children,
  className,
  bodyClassName,
}: DemoStageProps) {
  const { theme } = useTheme();
  const hasHeader = title || subtitle || (legend && legend.length > 0) || actions;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border shadow-sm",
        theme === "dark"
          ? "bg-slate-900 border-slate-700"
          : "bg-white border-slate-200",
        className,
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-3 py-3 sm:px-4",
            theme === "dark" ? "border-slate-700" : "border-slate-200",
          )}
        >
          {(title || subtitle) && (
            <div className="min-w-0 flex-1 basis-40">
              {title && (
                <h3 className={cn("text-sm font-semibold leading-5", theme === "dark" ? "text-white" : "text-gray-900")}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={cn("mt-0.5 text-xs leading-5", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {legend && legend.length > 0 && (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              {legend.map((item) => (
                <LegendChip key={item.label} item={item} />
              ))}
            </div>
          )}
          {actions && (
            <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={cn("min-w-0 flex-1 bg-[#070d1a]", bodyClassName ?? "p-2 sm:p-4")}>{children}</div>
    </div>
  );
}

interface DemoSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DemoSection({ title, icon, children, className }: DemoSectionProps) {
  const { theme } = useTheme();
  return (
    <section className={cn("min-w-0", className)}>
      <h3
        className={cn(
          "mb-3 flex items-center gap-2 text-sm font-semibold",
          theme === "dark" ? "text-slate-300" : "text-slate-600",
        )}
      >
        {icon}
        {title}
        <span
          className={cn(
            "flex-1 h-px",
            theme === "dark" ? "bg-slate-700/60" : "bg-gray-200",
          )}
        />
      </h3>
      {children}
    </section>
  );
}
