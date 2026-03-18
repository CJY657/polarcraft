/**
 * PersistentHeader - 持久化顶部导航栏组件
 * Khan Academy-inspired site chrome with simplified navigation.
 */

import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";

import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { ModuleIconMap, PolarCraftLogo, type ModuleIconKey } from "@/components/icons";
import { AuthThemeSwitcher } from "../ui/AuthThemeSwitcher";

const MODULE_THEMES: Record<
  string,
  {
    primary: string;
    secondary: string;
  }
> = {
  courses: { primary: "#1865f2", secondary: "#75a8ff" },
  units: { primary: "#14bf96", secondary: "#7adfc5" },
  unit: { primary: "#14bf96", secondary: "#7adfc5" },
  demos: { primary: "#0ea5a4", secondary: "#6fd5d4" },
  gallery: { primary: "#f59e42", secondary: "#f8c27a" },
  labGroup: { primary: "#0f9b74", secondary: "#5fd0af" },
  creativeLab: { primary: "#f59e42", secondary: "#f8c27a" },
  polarquest: { primary: "#c58b1d", secondary: "#e4b554" },
  course: { primary: "#1865f2", secondary: "#75a8ff" },
  game3d: { primary: "#c58b1d", secondary: "#e4b554" },
  game2d: { primary: "#c58b1d", secondary: "#e4b554" },
  profile: { primary: "#1865f2", secondary: "#75a8ff" },
};

const NAV_ITEMS = [
  { label: "首页", path: "/" },
  { label: "单元", path: "/units" },
  { label: "历史时间线", path: "/chronicles" },
  { label: "模拟", path: "/demos" },
  { label: "成果", path: "/gallery" },
  { label: "研究", path: "/lab/explore" },
  { label: "关于", path: "/about" },
];

type PersistentHeaderModuleKey =
  | ModuleIconKey
  | "game3d"
  | "game2d"
  | "course"
  | "units"
  | "unit"
  | "profile";

interface PersistentHeaderProps {
  moduleKey?: PersistentHeaderModuleKey;
  moduleNameKey?: string;
  moduleName?: string;
  showSettings?: boolean;
  compact?: boolean;
  rightContent?: ReactNode;
  centerContent?: ReactNode;
  className?: string;
  variant?: "transparent" | "solid" | "glass";
  showBreadcrumb?: boolean;
}

function isNavItemActive(currentPath: string, targetPath: string) {
  if (targetPath === "/") {
    return currentPath === "/";
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export function PersistentHeader({
  moduleKey,
  moduleNameKey,
  moduleName,
  showSettings = true,
  compact = false,
  rightContent,
  centerContent,
  className,
  variant = "glass",
  showBreadcrumb = true,
}: PersistentHeaderProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const moduleTheme = moduleKey ? MODULE_THEMES[moduleKey] ?? null : null;
  const ModuleIcon =
    moduleKey && moduleKey in ModuleIconMap ? ModuleIconMap[moduleKey as ModuleIconKey] : null;
  const displayName = moduleName || (moduleNameKey ? t(moduleNameKey, moduleNameKey) : null);
  const isTransparent = variant === "transparent";

  return (
    <header
      className={cn(
        "relative z-50 border-b",
        isTransparent
          ? "border-transparent bg-transparent text-white shadow-none"
          : "border-[var(--paper-border)] bg-[color:var(--paper-surface-strong)]/95 text-[var(--paper-foreground)] shadow-[0_12px_24px_-24px_rgba(36,59,83,0.3)] backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center gap-3 py-3">
          <Link
            to="/"
            className={cn(
              "group flex min-w-0 items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5",
              compact && "gap-2",
            )}
            title={t("common.home")}
          >
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                !isTransparent && "glass-chip",
              )}
              style={
                isTransparent
                  ? {
                      borderColor: "rgba(255,255,255,0.22)",
                      backgroundColor: "rgba(5, 14, 22, 0.38)",
                    }
                  : undefined
              }
            >
              <PolarCraftLogo
                size={compact ? 26 : 30}
                theme={theme}
                animated={false}
                beamActive={!isTransparent}
                activeColor={moduleTheme?.primary ?? "#14bf96"}
                className="transition-transform duration-200 group-hover:scale-105"
              />
            </div>

            {!compact && (
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.22em]",
                    isTransparent ? "text-white/70" : "text-[var(--glass-text-muted)]",
                  )}
                >
                  PolarCraft
                </p>
                <p className="truncate text-base font-semibold" style={{ fontFamily: "var(--font-ui-display)" }}>
                  偏振实验平台
                </p>
              </div>
            )}
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = isNavItemActive(location.pathname, item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isTransparent
                      ? isActive
                        ? "bg-white/14 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                      : isActive
                        ? "bg-[var(--paper-accent-soft)] text-[var(--paper-link)]"
                        : "text-[var(--glass-text-muted)] hover:bg-[var(--color-secondary)] hover:text-[var(--paper-link)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {moduleKey && displayName && showBreadcrumb ? (
              <div
                className={cn(
                  "ml-2 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
                  isTransparent
                    ? "border-white/18 bg-white/10 text-white"
                    : "border-[var(--paper-link)]/18 bg-[var(--paper-accent-soft)] text-[var(--paper-link)]",
                )}
                style={
                  !isTransparent && moduleTheme?.primary
                    ? {
                        borderColor: `${moduleTheme.primary}22`,
                        backgroundColor: `${moduleTheme.primary}14`,
                        color: moduleTheme.primary,
                      }
                    : undefined
                }
              >
                {ModuleIcon && (
                  <ModuleIcon
                    size={16}
                    primaryColor={moduleTheme?.primary}
                    secondaryColor={moduleTheme?.secondary}
                    className="shrink-0"
                  />
                )}
                <span className="truncate font-semibold">{displayName}</span>
              </div>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {rightContent}
            {showSettings && <AuthThemeSwitcher compact />}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border lg:hidden",
                isTransparent ? "border-white/20 bg-black/25 text-white" : "glass-button text-[var(--paper-foreground)]",
              )}
              aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {(mobileMenuOpen || centerContent) && (
          <div
            className={cn(
              "border-t py-3",
              isTransparent ? "border-white/16" : "border-[var(--paper-border)]",
            )}
          >
            <div className="flex flex-col gap-3 lg:gap-4">
              {mobileMenuOpen && (
                <nav className="grid gap-1 lg:hidden">
                  {NAV_ITEMS.map((item) => {
                    const isActive = isNavItemActive(location.pathname, item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                        isTransparent
                          ? isActive
                              ? "border-white/24 bg-white/12 text-white"
                              : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                            : isActive
                              ? "border-[var(--paper-link)] bg-[var(--paper-accent-soft)] text-[var(--paper-link)]"
                              : "border-[var(--paper-border)] bg-[var(--glass-panel-soft)] text-[var(--paper-foreground)] hover:text-[var(--paper-link)]",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}

                  {moduleKey && displayName && showBreadcrumb ? (
                    <div
                      className={cn(
                        "mt-1 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold",
                        isTransparent
                          ? "border-white/18 bg-white/10 text-white"
                          : "border-[var(--paper-link)]/18 bg-[var(--paper-accent-soft)] text-[var(--paper-link)]",
                      )}
                      style={
                        !isTransparent && moduleTheme?.primary
                          ? {
                              borderColor: `${moduleTheme.primary}22`,
                              backgroundColor: `${moduleTheme.primary}12`,
                              color: moduleTheme.primary,
                            }
                          : undefined
                      }
                    >
                      {ModuleIcon && (
                        <ModuleIcon
                          size={18}
                          primaryColor={moduleTheme?.primary}
                          secondaryColor={moduleTheme?.secondary}
                          className="shrink-0"
                        />
                      )}
                      <span className="truncate">{displayName}</span>
                    </div>
                  ) : null}
                </nav>
              )}

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {centerContent ? (
                  <div className="min-w-0 flex-1 md:flex md:justify-end">{centerContent}</div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function MiniLogo({ size = 24, className }: { size?: number; className?: string }) {
  const { theme } = useTheme();

  return (
    <Link to="/" className={cn("inline-flex items-center", className)}>
      <PolarCraftLogo size={size} theme={theme} animated={false} />
    </Link>
  );
}
