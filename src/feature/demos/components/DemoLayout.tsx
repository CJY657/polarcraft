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
        "inline-flex items-center gap-1.5 text-xs whitespace-nowrap",
        theme === "dark" ? "text-gray-300" : "text-gray-600",
      )}
    >
      {item.shape === "line" ? (
        <span
          className="inline-block w-4 h-0.5 rounded-full"
          style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }}
        />
      ) : (
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }}
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
  /** 舞台内容区的内边距，默认 p-3 sm:p-4 */
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
        "rounded-2xl border overflow-hidden",
        theme === "dark"
          ? "bg-slate-900/60 border-cyan-400/20 shadow-[0_0_40px_rgba(8,47,73,0.35)]"
          : "bg-white border-cyan-200 shadow-sm",
        className,
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            "px-4 py-2.5 border-b flex flex-wrap items-center gap-x-4 gap-y-1.5",
            theme === "dark" ? "border-cyan-400/10" : "border-cyan-100",
          )}
        >
          {title && (
            <h3
              className={cn(
                "text-sm font-semibold flex items-center gap-2",
                theme === "dark" ? "text-white" : "text-gray-900",
              )}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
              {title}
            </h3>
          )}
          {subtitle && (
            <span className={cn("text-xs", theme === "dark" ? "text-gray-500" : "text-gray-500")}>
              {subtitle}
            </span>
          )}
          {legend && legend.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 ml-auto">
              {legend.map((item) => (
                <LegendChip key={item.label} item={item} />
              ))}
            </div>
          )}
          {actions && (
            <div className={cn("flex items-center gap-2", !legend?.length && "ml-auto")}>
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={cn("bg-[#070d1a]", bodyClassName ?? "p-3 sm:p-4")}>{children}</div>
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
    <section className={className}>
      <h3
        className={cn(
          "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] mb-3",
          theme === "dark" ? "text-gray-500" : "text-gray-500",
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
