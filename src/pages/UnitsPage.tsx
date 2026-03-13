/**
 * Units Page - Experiment Units List
 * 单元页面 - 实验课单元列表
 *
 * Displays all experiment units with direct experiment entry
 * 展示所有实验单元，并直接进入实验内容
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { PersistentHeader } from "@/components/shared";
import { BookOpen, FileText, Loader2, Layers } from "lucide-react";
import { useUnitStore } from "@/stores/unitStore";

export function UnitsPage() {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const { units, isLoading, error, fetchUnits } = useUnitStore();

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const isZh = i18n.language === "zh-CN";

  // Helper to get localized label
  const getLabel = (label: { "zh-CN"?: string; "en-US"?: string }) => {
    return label[isZh ? "zh-CN" : "en-US"] || label["zh-CN"] || label["en-US"] || "";
  };

  return (
    <div
      className={cn(
        "glass-page min-h-screen",
      )}
    >
      {/* Header with Persistent Logo */}
      <PersistentHeader
        moduleKey="units"
        moduleName={isZh ? "实验单元" : "Experiment Units"}
        variant="glass"
        className="sticky top-0 z-40"
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero section */}
        <section className="glass-panel-strong relative mx-auto mb-8 max-w-5xl overflow-hidden rounded-[2.2rem] px-6 py-8 text-center sm:px-8">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                theme === "dark"
                  ? "radial-gradient(circle at top right, rgba(123,186,255,0.18), transparent 34%)"
                  : "linear-gradient(180deg, rgba(25,140,255,0.04), transparent 48%)",
            }}
          />

          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              <span className="glass-chip rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-accent)]">
                Direct Entry
              </span>
              <span className="glass-chip rounded-full border px-3 py-1 text-[11px] font-medium text-[var(--glass-text-muted)]">
                {isZh ? "单元直达实验" : "Unit to experiment"}
              </span>
            </div>

            <h2 className="mb-3 text-2xl font-bold text-[var(--paper-foreground)] sm:text-3xl" style={{ fontFamily: "var(--font-ui-display)" }}>
              {isZh ? "实验单元" : "Experiment Units"}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-[var(--glass-text-muted)]">
              {isZh
                ? "选择单元后直接进入实验内容，减少中间跳转。"
                : "Choose a unit to open its experiment directly, without the extra overview step."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="glass-panel-soft rounded-[1.4rem] border px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-muted)]">
                  Units
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--paper-foreground)]">{units.length}</p>
              </div>
              <div className="glass-panel-soft rounded-[1.4rem] border px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-muted)]">
                  Slides
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--paper-foreground)]">
                  {units.filter((unit) => unit.mainSlide).length}
                </p>
              </div>
              <div className="glass-panel-soft rounded-[1.4rem] border px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-muted)]">
                  Experiments
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--paper-foreground)]">
                  {units.reduce((count, unit) => count + (unit.courseCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Error state */}
        {error && (
          <div className="text-center py-10">
            <p className={cn("text-red-500", theme === "dark" ? "text-red-400" : "text-red-600")}>
              {error}
            </p>
            <button
              onClick={() => fetchUnits()}
              className="glass-button glass-button-primary mt-4 rounded-full px-4 py-2 text-sm font-medium"
            >
              {isZh ? "重试" : "Retry"}
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && units.length === 0 && (
          <div className="text-center py-20">
            <Layers
              className={cn(
                "w-12 h-12 mx-auto mb-4",
                theme === "dark" ? "text-gray-600" : "text-gray-400"
              )}
            />
            <p className={cn("text-lg", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
              {isZh ? "暂无单元" : "No units available"}
            </p>
          </div>
        )}

        {/* Units grid */}
        {!isLoading && !error && units.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit) => (
              <div
                key={unit.id}
                onClick={() => navigate(`/units/${unit.id}`)}
                className={cn(
                  "glass-panel-strong group cursor-pointer overflow-hidden rounded-[1.9rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_64px_-34px_rgba(15,42,76,0.3)]"
                )}
              >
                {/* Cover Image */}
                <div className="relative h-40 overflow-hidden">
                  {unit.coverImage ? (
                    <>
                      <img
                        src={unit.coverImage}
                        alt={getLabel(unit.title)}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,18,32,0.46)] via-transparent to-transparent" />
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, ${unit.color}3d 0%, rgba(255,255,255,0.12) 100%)`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="glass-chip flex h-16 w-16 items-center justify-center rounded-[1.25rem]"
                          style={{ backgroundColor: `${unit.color}24` }}
                        >
                          <Layers className="w-8 h-8" style={{ color: unit.color }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="glass-chip rounded-full border px-3 py-1 text-[11px] font-medium text-[var(--glass-text-muted)]">
                      {isZh ? `单元 ${unit.sortOrder + 1}` : `Unit ${unit.sortOrder + 1}`}
                    </span>
                    <span className="text-xs font-medium" style={{ color: unit.color }}>
                      {unit.courseCount || 0} {isZh ? "个实验" : "experiments"}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className={cn(
                      "mb-2 line-clamp-2 text-lg font-bold text-[var(--paper-foreground)]"
                    )}
                  >
                    {getLabel(unit.title)}
                  </h3>

                  {/* Description */}
                  <p
                    className={cn(
                      "mb-4 line-clamp-2 text-sm text-[var(--glass-text-muted)]"
                    )}
                  >
                    {getLabel(unit.description)}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    {unit.mainSlide && (
                      <div className="glass-chip flex items-center gap-1.5 rounded-full border px-3 py-1" style={{ color: unit.color }}>
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isZh ? "主课件" : "Slides"}</span>
                      </div>
                    )}
                    <div className="glass-chip flex items-center gap-1.5 rounded-full border px-3 py-1" style={{ color: unit.color }}>
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>
                        {unit.courseCount || 0} {isZh ? "个实验" : "Experiments"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default UnitsPage;
