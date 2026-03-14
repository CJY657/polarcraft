/**
 * Courses Page - 实验课内容
 * 聚焦实验单元和实验入口，不再混合历史时间线导航
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BookOpenText, Layers, Loader2, type LucideIcon } from "lucide-react";

import { LearningSectionNav, PersistentHeader } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { unitApi, type UnitCourse } from "@/lib/unit.service";
import { useUnitStore } from "@/stores/unitStore";
import { CourseSelector } from "@/feature/unit/CourseSelector";
import { cn } from "@/utils/classNames";

function EmptyWorkspace({
  theme,
  icon: Icon,
  title,
  description,
}: {
  theme: "dark" | "light";
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <Icon
        className={cn("mb-4 h-12 w-12", theme === "dark" ? "text-slate-600" : "text-slate-400")}
      />
      <p className="text-lg font-semibold">{title}</p>
      <p className={cn("mt-2 max-w-md text-sm", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
        {description}
      </p>
    </div>
  );
}

export function CoursesPage() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitCourses, setSelectedUnitCourses] = useState<UnitCourse[]>([]);
  const [selectedUnitCoursesLoading, setSelectedUnitCoursesLoading] = useState(false);
  const [selectedUnitCoursesError, setSelectedUnitCoursesError] = useState<string | null>(null);
  const [selectedUnitCoursesReloadKey, setSelectedUnitCoursesReloadKey] = useState(0);

  const { units, isLoading: unitsLoading, fetchUnits } = useUnitStore();

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    if (units.length === 0) {
      setSelectedUnitId(null);
      return;
    }

    setSelectedUnitId((current) => {
      if (current && units.some((unit) => unit.id === current)) {
        return current;
      }

      return units[0].id;
    });
  }, [units]);

  const isZh = i18n.language !== "en-US";

  const getLabel = useCallback(
    (label: { "zh-CN"?: string; "en-US"?: string }) => {
      return label[isZh ? "zh-CN" : "en-US"] || label["zh-CN"] || label["en-US"] || "";
    },
    [isZh],
  );

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? units[0] ?? null;
  useEffect(() => {
    if (!selectedUnit) {
      setSelectedUnitCourses([]);
      setSelectedUnitCoursesLoading(false);
      setSelectedUnitCoursesError(null);
      return;
    }

    let isCancelled = false;

    setSelectedUnitCoursesLoading(true);
    setSelectedUnitCoursesError(null);

    unitApi
      .getPublicUnitCourses(selectedUnit.id)
      .then((courses) => {
        if (isCancelled) {
          return;
        }

        setSelectedUnitCourses(courses);
        setSelectedUnitCoursesLoading(false);
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        setSelectedUnitCourses([]);
        setSelectedUnitCoursesLoading(false);
        setSelectedUnitCoursesError(
          error instanceof Error ? error.message : isZh ? "实验加载失败" : "Failed to load experiments",
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [isZh, selectedUnit, selectedUnitCoursesReloadKey]);

  const surfaceClass = theme === "dark"
    ? "border-slate-800 bg-slate-950/80"
    : "border-slate-200 bg-white";
  const mutedTextClass = theme === "dark" ? "text-slate-400" : "text-slate-600";
  const subtleTextClass = theme === "dark" ? "text-slate-500" : "text-slate-500";
  const pillClass = cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
    theme === "dark"
      ? "border-slate-700 bg-slate-900 text-slate-300"
      : "border-slate-200 bg-slate-50 text-slate-600",
  );

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark" ? "text-slate-100" : "text-slate-900",
      )}
      style={{
        background:
          theme === "dark"
            ? "linear-gradient(180deg, rgba(7,20,34,0.98) 0%, rgba(9,24,40,0.98) 100%)"
            : "linear-gradient(180deg, #f6f8fc 0%, #ffffff 28%, #f8fafc 100%)",
      }}
    >
      <PersistentHeader
        moduleKey="courses"
        moduleName={t("page.courses.title")}
        variant="solid"
        className="sticky top-0 z-40"
      />

      <main className="w-full pb-8">
        <section className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1d4ed8]">
                Experiment Library
              </p>
              <h1
                className="mt-2 text-3xl font-semibold tracking-tight sm:text-[2.35rem]"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                {t("page.courses.title")}
              </h1>
              <p className={cn("mt-2 text-sm leading-7 sm:text-[15px]", mutedTextClass)}>
                {isZh
                  ? "按单元进入实验课件与媒体内容，不再和历史时间线混排。"
                  : "Open experiments by unit without mixing in the historical timeline."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={pillClass}>{units.length} {isZh ? "个单元" : "units"}</span>
              <span className={pillClass}>
                {selectedUnit?.courseCount || 0} {isZh ? "个实验" : "experiments"}
              </span>
            </div>
          </div>

          <LearningSectionNav />
        </section>

        <div className="mt-2 grid gap-6 lg:grid-cols-[292px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-[108px] lg:self-start">
            <section
              className={cn(
                "mx-4 rounded-[1.75rem] border px-4 py-5 sm:mx-6 lg:mx-0 lg:rounded-l-none lg:border-l-0",
                surfaceClass,
              )}
            >
              <div className="px-2 pb-3">
                <h2 className="text-lg font-semibold">{isZh ? "实验单元" : "Units"}</h2>
                <p className={cn("mt-1 text-sm leading-6", mutedTextClass)}>
                  {isZh ? "先选单元，再进入当前单元下的实验。" : "Choose a unit, then open one of its experiments."}
                </p>
              </div>

              {unitsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1d4ed8]" />
                </div>
              ) : units.length === 0 ? (
                <EmptyWorkspace
                  theme={theme}
                  icon={Layers}
                  title={isZh ? "暂无单元" : "No units"}
                  description={
                    isZh ? "当前还没有可展示的实验单元。" : "No experiment units are available yet."
                  }
                />
              ) : (
                <div className={cn("mt-2 divide-y", theme === "dark" ? "divide-slate-800" : "divide-slate-200")}>
                  {units.map((unit) => {
                    const isSelected = selectedUnit?.id === unit.id;

                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => setSelectedUnitId(unit.id)}
                        className={cn(
                          "flex w-full items-start gap-3 px-3 py-4 text-left transition-colors",
                          theme === "dark" ? "hover:bg-slate-900/80" : "hover:bg-slate-50",
                        )}
                        style={
                          isSelected
                            ? {
                                backgroundColor: theme === "dark" ? `${unit.color}16` : `${unit.color}0d`,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="mt-0.5 h-10 w-1 shrink-0 rounded-full"
                          style={{ backgroundColor: isSelected ? unit.color : "transparent" }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{getLabel(unit.title)}</p>
                          <p className={cn("mt-1 text-xs", subtleTextClass)}>
                            {isZh ? `单元 ${unit.sortOrder + 1}` : `Unit ${unit.sortOrder + 1}`} · {unit.courseCount || 0} {isZh ? "个实验" : "experiments"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>

          <section className="space-y-6 px-4 sm:px-6 lg:pl-0 lg:pr-8 xl:pr-10">
            <div className="max-w-5xl space-y-6">
              {unitsLoading ? (
                <section className={cn("rounded-[2rem] border", surfaceClass)}>
                  <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1d4ed8]" />
                  </div>
                </section>
              ) : !selectedUnit ? (
                <section className={cn("rounded-[2rem] border", surfaceClass)}>
                  <EmptyWorkspace
                    theme={theme}
                    icon={Layers}
                    title={isZh ? "暂无单元" : "No units"}
                    description={
                      isZh ? "当前还没有可展示的实验单元。" : "No experiment units are available yet."
                    }
                  />
                </section>
              ) : (
                <section className={cn("rounded-[2rem] border px-5 py-5 sm:px-6", surfaceClass)}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{isZh ? "本单元实验" : "Experiments in this unit"}</h3>
                      <p className={cn("mt-1 text-sm leading-6", mutedTextClass)}>
                        {isZh ? "选择一个实验，直接进入课件与媒体内容。" : "Choose an experiment to open its slides and media."}
                      </p>
                    </div>
                    <span className={pillClass}>
                      {selectedUnitCoursesLoading
                        ? isZh ? "实验加载中" : "Loading experiments"
                        : `${selectedUnitCourses.length} ${isZh ? "个实验" : "experiments"}`}
                    </span>
                  </div>

                  <div className="mt-5">
                    {selectedUnitCoursesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1d4ed8]" />
                      </div>
                    ) : selectedUnitCoursesError ? (
                      <div className="py-8 text-center">
                        <p className={cn("text-sm", theme === "dark" ? "text-red-300" : "text-red-600")}>
                          {selectedUnitCoursesError}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedUnitCoursesReloadKey((value) => value + 1)}
                          className="mt-4 text-sm font-semibold text-[#1d4ed8] transition-opacity hover:opacity-80"
                        >
                          {isZh ? "重新加载" : "Retry"}
                        </button>
                      </div>
                    ) : selectedUnitCourses.length === 0 ? (
                      <EmptyWorkspace
                        theme={theme}
                        icon={BookOpenText}
                        title={isZh ? "该单元暂无实验" : "No experiments in this unit"}
                        description={
                          isZh
                            ? "当前单元还没有可进入的实验内容。"
                            : "There are no experiment entries available in this unit yet."
                        }
                      />
                    ) : (
                      <CourseSelector
                        courses={selectedUnitCourses}
                        unitColor={selectedUnit.color}
                        showHeader={false}
                      />
                    )}
                  </div>
                </section>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default CoursesPage;
