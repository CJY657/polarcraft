/**
 * Reusable Search and Filter Components
 * 可复用的搜索和筛选组件
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { cn } from "@/utils/classNames";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--glass-text-muted)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t("common.search")}
        className={cn(
          "glass-input w-full rounded-2xl px-4 py-3 pl-11 pr-10 text-sm",
          "focus:outline-none",
        )}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)] hover:text-[var(--paper-foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface FilterOption {
  value: string;
  label: LabelI18n;
}

interface FilterSelectProps {
  label: LabelI18n;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function FilterSelect({ label, value, options, onChange, className }: FilterSelectProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label
        className="whitespace-nowrap text-sm font-medium text-[var(--paper-foreground)]"
      >
        {label[i18n.language]}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "glass-input min-w-32 cursor-pointer appearance-none rounded-xl px-3 py-2 pr-8 text-sm",
            "focus:outline-none",
          )}
        >
          <option value="">{t("common.all")}</option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
            >
              {opt.label[i18n.language]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--glass-text-muted)]" />
      </div>
    </div>
  );
}

interface ToggleFilterProps {
  label: LabelI18n;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function ToggleFilter({ label, checked, onChange, className }: ToggleFilterProps) {
  const { i18n } = useTranslation();

  return (
    <label className={cn("flex cursor-pointer items-center gap-2", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={cn(
          "glass-chip relative h-5 w-9 rounded-full",
          checked && "border-[var(--paper-accent)] bg-[var(--paper-accent-soft)]",
        )}
      >
        <div
          className={cn(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-[0_6px_14px_rgba(6,18,40,0.18)] transition-transform",
            checked && "translate-x-4",
          )}
        />
      </div>
      <span className="text-sm text-[var(--paper-foreground)]">
        {label[i18n.language]}
      </span>
    </label>
  );
}

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "glass-panel rounded-[1.75rem] p-3.5",
        className,
      )}
    >
      {/* Mobile toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex w-full items-center gap-2 text-sm font-medium text-[var(--paper-foreground)] md:hidden",
        )}
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        <ChevronDown
          className={cn("ml-auto h-4 w-4 transition-transform", isExpanded && "rotate-180")}
        />
      </button>

      {/* Filters content */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-3",
          "md:flex",
          isExpanded ? "flex mt-3" : "hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
}

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
