/**
 * DemoControls - 演示控制组件
 * 提供滑块、按钮、预设等交互控件
 * 支持亮色/暗色主题
 */
import { ReactNode } from "react";
import { cn } from "@/utils/classNames";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import MathText from "@/components/shared/MathText";

// 滑块控制器
interface SliderControlProps {
  label: string | ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  color?: "cyan" | "red" | "green" | "blue" | "orange" | "purple";
}

const sliderColorClasses: Record<string, { track: string; thumb: string; glow: string }> = {
  cyan: {
    track: "bg-cyan-400/30",
    thumb: "bg-cyan-400",
    glow: "shadow-[0_0_10px_rgba(34,211,238,0.5)]",
  },
  red: {
    track: "bg-red-400/30",
    thumb: "bg-red-400",
    glow: "shadow-[0_0_10px_rgba(248,113,113,0.5)]",
  },
  green: {
    track: "bg-green-400/30",
    thumb: "bg-green-400",
    glow: "shadow-[0_0_10px_rgba(74,222,128,0.5)]",
  },
  blue: {
    track: "bg-blue-400/30",
    thumb: "bg-blue-400",
    glow: "shadow-[0_0_10px_rgba(96,165,250,0.5)]",
  },
  orange: {
    track: "bg-orange-400/30",
    thumb: "bg-orange-400",
    glow: "shadow-[0_0_10px_rgba(251,146,60,0.5)]",
  },
  purple: {
    track: "bg-purple-400/30",
    thumb: "bg-purple-400",
    glow: "shadow-[0_0_10px_rgba(192,132,252,0.5)]",
  },
};

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  formatValue,
  color = "cyan",
}: SliderControlProps) {
  const { theme } = useTheme();
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;
  const colors = sliderColorClasses[color] || sliderColorClasses.cyan;
  const textColorClass = theme === "dark" ? `text-${color}-400` : `text-${color}-600`;

  // Calculate percentage, handling edge case where min equals max to avoid division by zero
  const range = max - min;
  const percentage = range > 0 ? Math.max(0, Math.min(100, ((value - min) / range) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>{label}</span>
        <span className={cn("font-mono", textColorClass)}>{displayValue}</span>
      </div>
      <div className="relative">
        <div
          className={cn("absolute inset-0 h-2 rounded-lg", colors.track)}
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={cn(
            "w-full h-2 rounded-lg appearance-none cursor-pointer relative",
            theme === "dark" ? "bg-slate-700" : "bg-gray-200",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:h-4",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-thumb]:transition-transform",
            "[&::-webkit-slider-thumb]:hover:scale-110",
            "[&::-moz-range-thumb]:w-4",
            "[&::-moz-range-thumb]:h-4",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:border-0",
            color === "cyan" &&
              "[&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.5)] [&::-moz-range-thumb]:bg-cyan-400",
            color === "red" &&
              "[&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(248,113,113,0.5)] [&::-moz-range-thumb]:bg-red-400",
            color === "green" &&
              "[&::-webkit-slider-thumb]:bg-green-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(74,222,128,0.5)] [&::-moz-range-thumb]:bg-green-400",
            color === "blue" &&
              "[&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(96,165,250,0.5)] [&::-moz-range-thumb]:bg-blue-400",
            color === "orange" &&
              "[&::-webkit-slider-thumb]:bg-orange-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(251,146,60,0.5)] [&::-moz-range-thumb]:bg-orange-400",
            color === "purple" &&
              "[&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(192,132,252,0.5)] [&::-moz-range-thumb]:bg-purple-400",
          )}
        />
      </div>
    </div>
  );
}

// 预设按钮组 - 新增组件
interface PresetButtonsProps {
  options: { value: string | number; label: Record<string, string> }[];
  value: string | number;
  onChange: (value: string | number) => void;
  columns?: 2 | 3 | 4;
}

export function PresetButtons({ options, value, onChange, columns = 2 }: PresetButtonsProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className={cn("grid gap-2", gridCols[columns])}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
            "border hover:scale-[1.02] active:scale-[0.98]",
            value === option.value
              ? theme === "dark"
                ? "bg-gradient-to-r from-cyan-400/30 to-blue-400/30 text-cyan-300 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                : "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 border-cyan-300 shadow-sm"
              : theme === "dark"
                ? "bg-slate-800/50 text-gray-400 border-slate-600/50 hover:border-cyan-400/30 hover:text-gray-300"
                : "bg-white text-gray-600 border-gray-200 hover:border-cyan-300 hover:text-gray-800",
          )}
        >
          {option.label[i18n.language]}
        </button>
      ))}
    </div>
  );
}

// 切换开关
interface ToggleProps {
  label: string | ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  const { theme } = useTheme();
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className={cn(
          "w-10 h-5 rounded-full transition-colors relative",
          checked
            ? theme === "dark"
              ? "bg-cyan-400/30"
              : "bg-cyan-200"
            : theme === "dark"
              ? "bg-slate-700"
              : "bg-gray-200",
        )}
        onClick={() => onChange(!checked)}
      >
        <div
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full transition-transform",
            checked
              ? theme === "dark"
                ? "translate-x-5 bg-cyan-400"
                : "translate-x-5 bg-cyan-500"
              : theme === "dark"
                ? "translate-x-0.5 bg-gray-500"
                : "translate-x-0.5 bg-gray-400",
          )}
        />
      </div>
      <span className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
        {label}
      </span>
    </label>
  );
}

// 数值显示
interface ValueDisplayProps {
  label: string | ReactNode;
  value: string | number | ReactNode;
  unit?: string;
  color?: string;
}

export function ValueDisplay({ label, value, unit = "", color = "cyan" }: ValueDisplayProps) {
  const { theme } = useTheme();
  const colorClassesDark: Record<string, string> = {
    cyan: "text-cyan-400",
    red: "text-red-400",
    green: "text-green-400",
    blue: "text-blue-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
  };
  const colorClassesLight: Record<string, string> = {
    cyan: "text-cyan-600",
    red: "text-red-600",
    green: "text-green-600",
    blue: "text-blue-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
    yellow: "text-yellow-600",
  };
  const colorClasses = theme === "dark" ? colorClassesDark : colorClassesLight;

  return (
    <div className="flex justify-between items-center py-1">
      <span className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
        {label}
      </span>
      <span className={cn("font-mono text-sm", colorClasses[color] || colorClasses.cyan)}>
        {value}
        {unit}
      </span>
    </div>
  );
}

// 控制面板容器
interface ControlPanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function ControlPanel({ title, children, className }: ControlPanelProps) {
  const { theme } = useTheme();
  return (
    <div
      className={cn(
        "rounded-xl p-4 border backdrop-blur-sm",
        theme === "dark"
          ? "bg-slate-800/70 border-cyan-400/20"
          : "bg-white/90 border-cyan-200 shadow-sm",
        className,
      )}
    >
      {title && (
        <h3
          className={cn(
            "text-base font-semibold mb-3",
            theme === "dark" ? "text-white" : "text-gray-800",
          )}
        >
          {title}
        </h3>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// 公式显示
interface FormulaProps {
  children: string;
  className?: string;
  highlight?: boolean;
}

export function Formula({ children, className, highlight = false }: FormulaProps) {
  const { theme } = useTheme();
  return (
    <div
      className={cn(
        "font-mono px-4 py-3 rounded-lg text-center transition-all",
        theme === "dark" ? "text-cyan-400" : "text-cyan-700",
        highlight
          ? theme === "dark"
            ? "bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-400/30"
            : "bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200"
          : theme === "dark"
            ? "bg-slate-900/50"
            : "bg-gray-50",
        className,
      )}
    >
      <MathText text={children} />
    </div>
  );
}

// 增强型信息卡片 - 用于展示物理原理、实验应用、前沿应用
interface InfoCardProps {
  title: string;
  icon?: ReactNode;
  color?: "cyan" | "green" | "purple" | "orange" | "blue";
  children: ReactNode;
  className?: string;
  expanded?: boolean;
}

const infoCardColorsDark = {
  cyan: {
    border: "border-cyan-400/30",
    bg: "from-cyan-900/20 to-slate-900/50",
    title: "text-cyan-400",
    icon: "bg-cyan-400/20 text-cyan-400",
    headerBorder: "border-slate-700/50",
  },
  green: {
    border: "border-green-400/30",
    bg: "from-green-900/20 to-slate-900/50",
    title: "text-green-400",
    icon: "bg-green-400/20 text-green-400",
    headerBorder: "border-slate-700/50",
  },
  purple: {
    border: "border-purple-400/30",
    bg: "from-purple-900/20 to-slate-900/50",
    title: "text-purple-400",
    icon: "bg-purple-400/20 text-purple-400",
    headerBorder: "border-slate-700/50",
  },
  orange: {
    border: "border-orange-400/30",
    bg: "from-orange-900/20 to-slate-900/50",
    title: "text-orange-400",
    icon: "bg-orange-400/20 text-orange-400",
    headerBorder: "border-slate-700/50",
  },
  blue: {
    border: "border-blue-400/30",
    bg: "from-blue-900/20 to-slate-900/50",
    title: "text-blue-400",
    icon: "bg-blue-400/20 text-blue-400",
    headerBorder: "border-slate-700/50",
  },
};

const infoCardColorsLight = {
  cyan: {
    border: "border-cyan-200",
    bg: "from-cyan-50 to-white",
    title: "text-cyan-700",
    icon: "bg-cyan-100 text-cyan-600",
    headerBorder: "border-cyan-100",
  },
  green: {
    border: "border-green-200",
    bg: "from-green-50 to-white",
    title: "text-green-700",
    icon: "bg-green-100 text-green-600",
    headerBorder: "border-green-100",
  },
  purple: {
    border: "border-purple-200",
    bg: "from-purple-50 to-white",
    title: "text-purple-700",
    icon: "bg-purple-100 text-purple-600",
    headerBorder: "border-purple-100",
  },
  orange: {
    border: "border-orange-200",
    bg: "from-orange-50 to-white",
    title: "text-orange-700",
    icon: "bg-orange-100 text-orange-600",
    headerBorder: "border-orange-100",
  },
  blue: {
    border: "border-blue-200",
    bg: "from-blue-50 to-white",
    title: "text-blue-700",
    icon: "bg-blue-100 text-blue-600",
    headerBorder: "border-blue-100",
  },
};

export function InfoCard({ title, icon, color = "cyan", children, className }: InfoCardProps) {
  const { theme } = useTheme();
  // 使用默认颜色作为回退，防止无效颜色值导致崩溃
  const colorsDark = infoCardColorsDark[color] || infoCardColorsDark.cyan;
  const colorsLight = infoCardColorsLight[color] || infoCardColorsLight.cyan;
  const colors = theme === "dark" ? colorsDark : colorsLight;

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-sm overflow-hidden shadow-sm",
        "bg-gradient-to-br",
        colors.border,
        colors.bg,
        className,
      )}
    >
      <div className={cn("px-4 py-3 border-b flex items-center gap-3", colors.headerBorder)}>
        {icon && (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.icon)}>
            {icon}
          </div>
        )}
        <h4 className={cn("font-semibold text-sm", colors.title)}>{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// 带图标的列表项
interface ListItemProps {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ListItem({ icon, children, className }: ListItemProps) {
  const { theme } = useTheme();
  return (
    <div
      className={cn(
        "flex items-start gap-3 text-sm",
        theme === "dark" ? "text-gray-300" : "text-gray-700",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "mt-0.5 flex-shrink-0",
            theme === "dark" ? "text-cyan-400" : "text-cyan-600",
          )}
        >
          {icon}
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}

// 实时数值显示（带动画效果）
interface AnimatedValueProps {
  label: string | ReactNode;
  value: number;
  unit?: string;
  decimals?: number;
  color?: "cyan" | "red" | "green" | "blue" | "orange" | "purple";
  showBar?: boolean;
  min?: number;
  max?: number;
}

export function AnimatedValue({
  label,
  value,
  unit = "",
  decimals = 2,
  color = "cyan",
  showBar = false,
  min = 0,
  max = 1,
}: AnimatedValueProps) {
  const { theme } = useTheme();
  const colorClassesDark: Record<string, { text: string; bar: string }> = {
    cyan: { text: "text-cyan-400", bar: "bg-cyan-400" },
    red: { text: "text-red-400", bar: "bg-red-400" },
    green: { text: "text-green-400", bar: "bg-green-400" },
    blue: { text: "text-blue-400", bar: "bg-blue-400" },
    orange: { text: "text-orange-400", bar: "bg-orange-400" },
    purple: { text: "text-purple-400", bar: "bg-purple-400" },
  };
  const colorClassesLight: Record<string, { text: string; bar: string }> = {
    cyan: { text: "text-cyan-600", bar: "bg-cyan-500" },
    red: { text: "text-red-600", bar: "bg-red-500" },
    green: { text: "text-green-600", bar: "bg-green-500" },
    blue: { text: "text-blue-600", bar: "bg-blue-500" },
    orange: { text: "text-orange-600", bar: "bg-orange-500" },
    purple: { text: "text-purple-600", bar: "bg-purple-500" },
  };
  const colorClasses = theme === "dark" ? colorClassesDark : colorClassesLight;
  const colors = colorClasses[color] || colorClasses.cyan;

  // Calculate percentage, handling edge case where min equals max to avoid division by zero
  const range = max - min;
  const percentage = range > 0 ? ((value - min) / range) * 100 : 0;

  // Validate value for display
  const displayValue =
    typeof value === "number" && !isNaN(value) && isFinite(value) ? value.toFixed(decimals) : "0";

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
          {label}
        </span>
        <span className={cn("font-mono text-sm font-semibold", colors.text)}>
          {displayValue}
          {unit}
        </span>
      </div>
      {showBar && (
        <div
          className={cn(
            "h-1.5 rounded-full overflow-hidden",
            theme === "dark" ? "bg-slate-700" : "bg-gray-200",
          )}
        >
          <div
            className={cn("h-full rounded-full transition-all duration-300", colors.bar)}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>
      )}
    </div>
  );
}
