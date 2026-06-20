import { useTranslation } from "react-i18next";
import { cn } from "@/utils/classNames";

// Badge color type - exported for use in data definitions
export type BadgeColor =
  | "gray"
  | "green"
  | "blue"
  | "yellow"
  | "orange"
  | "red"
  | "purple"
  | "cyan"
  | "pink";

// Reusable badge component
interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, color = "gray", size = "sm", className }: BadgeProps) {
  const colors = {
    gray: "border-[rgba(136,160,189,0.24)] bg-white/20 text-[var(--paper-foreground)]",
    green: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200 dark:text-emerald-300",
    blue: "border-sky-300/30 bg-sky-400/10 text-sky-200 dark:text-sky-300",
    yellow: "border-amber-300/30 bg-amber-400/10 text-amber-200 dark:text-amber-300",
    orange: "border-orange-300/30 bg-orange-400/10 text-orange-200 dark:text-orange-300",
    red: "border-red-300/30 bg-red-400/10 text-red-200 dark:text-red-300",
    purple: "border-violet-300/30 bg-violet-400/10 text-violet-200 dark:text-violet-300",
    cyan: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200 dark:text-cyan-300",
    pink: "border-pink-300/30 bg-pink-400/10 text-pink-200 dark:text-pink-300",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "glass-chip inline-flex items-center rounded-full border font-medium",
        colors[color],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

// Tabs component
interface Tab {
  id: string;
  label: LabelI18n;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  const { i18n } = useTranslation();

  return (
    <div
      className={cn(
        "glass-panel flex gap-1.5 overflow-x-auto rounded-[1.75rem] p-1.5",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-[1.1rem] border px-4 py-2.5 text-sm font-medium transition-all",
            activeTab === tab.id
              ? "glass-panel-strong border-[var(--glass-stroke-strong)] text-[var(--paper-foreground)] shadow-[var(--glass-neon)]"
              : "border-transparent bg-transparent text-[var(--glass-text-muted)] hover:border-[var(--glass-stroke-strong)] hover:bg-[var(--paper-accent-soft)] hover:text-[var(--paper-foreground)]",
          )}
        >
          {tab.icon}
          {tab.label[i18n.language]}
        </button>
      ))}
    </div>
  );
}
