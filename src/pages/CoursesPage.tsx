/**
 * Courses Page - 实验课内容
 * 聚焦实验单元和实验入口，不再混合历史时间线导航
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpenText,
  Compass,
  Home,
  Layers,
  Loader2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PersistentHeader } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { unitApi } from "@/lib/unit.service";
import { useUnitStore } from "@/stores/unitStore";
import { CourseSelector, type CourseSelectorCourse } from "@/feature/unit/CourseSelector";
import { cn } from "@/utils/classNames";

const ALL_EXPERIMENTS_ID = "__all_experiments__";

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
      <p
        className={cn(
          "mt-2 max-w-md text-sm",
          theme === "dark" ? "text-slate-400" : "text-slate-500",
        )}
      >
        {description}
      </p>
    </div>
  );
}

export function CoursesPage() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitCourses, setSelectedUnitCourses] = useState<CourseSelectorCourse[]>([]);
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
      if (
        current === ALL_EXPERIMENTS_ID ||
        (current && units.some((unit) => unit.id === current))
      ) {
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

  const selectedUnit =
    selectedUnitId === ALL_EXPERIMENTS_ID
      ? null
      : (units.find((unit) => unit.id === selectedUnitId) ?? units[0] ?? null);
  const isAllExperimentsSelected = selectedUnitId === ALL_EXPERIMENTS_ID;
  const totalExperimentCount = units.reduce((total, unit) => total + (unit.courseCount || 0), 0);

  useEffect(() => {
    if (units.length === 0) {
      setSelectedUnitCourses([]);
      setSelectedUnitCoursesLoading(false);
      setSelectedUnitCoursesError(null);
      return;
    }

    let isCancelled = false;

    setSelectedUnitCoursesLoading(true);
    setSelectedUnitCoursesError(null);

    const coursesRequest = isAllExperimentsSelected
      ? Promise.all(
          units.map(async (unit, unitIndex) => {
            const courses = await unitApi.getPublicUnitCourses(unit.id);

            return courses.map((course, courseIndex) => ({
              ...course,
              unitTitle: unit.title,
              unitAccentColor: unit.color,
              sortKey: unit.sortOrder * 1000 + unitIndex * 100 + courseIndex,
            }));
          }),
        ).then((collections) =>
          collections
            .flat()
            .sort((left, right) => left.sortKey - right.sortKey)
            .map(({ sortKey: _sortKey, ...course }) => course),
        )
      : selectedUnit
        ? unitApi.getPublicUnitCourses(selectedUnit.id)
        : Promise.resolve([]);

    coursesRequest
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
          error instanceof Error
            ? error.message
            : isZh
              ? "实验加载失败"
              : "Failed to load experiments",
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [isAllExperimentsSelected, isZh, selectedUnit, selectedUnitCoursesReloadKey, units]);

  const surfaceClass =
    theme === "dark" ? "border-slate-800 bg-slate-950/80" : "border-slate-200 bg-white";
  const mutedTextClass = theme === "dark" ? "text-slate-400" : "text-slate-600";
  const pillClass = cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
    theme === "dark"
      ? "border-slate-700 bg-slate-900 text-slate-300"
      : "border-slate-200 bg-slate-50 text-slate-600",
  );
  const selectedSectionTitle = isAllExperimentsSelected
    ? isZh
      ? "全部实验"
      : "All experiments"
    : isZh
      ? "本单元实验"
      : "Experiments in this unit";
  const selectedSectionDescription = isAllExperimentsSelected
    ? isZh
      ? "跨单元浏览全部实验入口，适合直接查找或快速进入。"
      : "Browse every experiment across units from one unified library."
    : isZh
      ? "选择一个实验，直接进入课件与媒体内容。"
      : "Choose an experiment to open its slides and media.";

  return (
    <div
      className={cn("min-h-screen", theme === "dark" ? "text-slate-100" : "text-slate-900")}
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
              <div className="mt-2 flex items-center gap-4">
                <h1
                  className="text-3xl font-semibold tracking-tight sm:text-[2.35rem]"
                  style={{ fontFamily: "var(--font-ui-display)" }}
                >
                  {t("page.courses.title")}
                </h1>
                <Link
                  to="/"
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95",
                    theme === "dark"
                      ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300 ring-4 ring-cyan-400/20"
                      : "bg-cyan-600 text-white hover:bg-cyan-700 ring-4 ring-cyan-600/20",
                  )}
                >
                  <Home className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  <span>{isZh ? "返回主页" : "Back home"}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-2 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[292px_minmax(0,1fr)] lg:px-8">
          <aside className="lg:sticky lg:top-[108px] lg:self-start">
            <section className={cn("rounded-[1.75rem] border px-4 py-5", surfaceClass)}>
              <div className="px-2 pb-3">
                <h2 className="text-lg font-semibold">{isZh ? "实验单元" : "Units"}</h2>
                <p className={cn("mt-1 text-sm leading-6", mutedTextClass)}>
                  {isZh
                    ? "先选单元，再进入当前单元下的实验。"
                    : "Choose a unit, then open one of its experiments."}
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
                <div className="mt-2 space-y-4">
                  <button
                    type="button"
                    onClick={() => setSelectedUnitId(ALL_EXPERIMENTS_ID)}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-[1.4rem] border p-4 text-left transition-all duration-200",
                      isAllExperimentsSelected
                        ? theme === "dark"
                          ? "border-amber-300/40 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(15,23,42,0.88))] shadow-[0_18px_40px_rgba(251,191,36,0.12)]"
                          : "border-amber-300 bg-[linear-gradient(135deg,rgba(255,247,214,1),rgba(255,255,255,1))] shadow-[0_18px_40px_rgba(217,119,6,0.12)]"
                        : theme === "dark"
                          ? "border-slate-800 bg-[linear-gradient(135deg,rgba(148,163,184,0.08),rgba(15,23,42,0.88))] hover:border-amber-300/25 hover:bg-[linear-gradient(135deg,rgba(251,191,36,0.10),rgba(15,23,42,0.92))]"
                          : "border-slate-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.88),rgba(255,255,255,1))] hover:border-amber-200 hover:bg-[linear-gradient(135deg,rgba(255,247,214,1),rgba(255,255,255,1))]",
                    )}
                  >
                    <div className="absolute right-0 top-0 h-20 w-20 translate-x-5 -translate-y-5 rounded-full bg-amber-300/20 blur-2xl" />
                    <div className="relative flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border",
                          theme === "dark"
                            ? "border-amber-300/25 bg-slate-950/55 text-amber-200"
                            : "border-amber-200 bg-white/80 text-amber-700",
                        )}
                      >
                        <Compass className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-[1.2]">
                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                          <div className="min-w-0 shrink-0">
                            <p
                              className={cn(
                                "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap",
                                theme === "dark" ? "text-amber-200/85" : "text-amber-700",
                              )}
                            >
                              <Sparkles className="h-3.5 w-3.5 shrink-0" />
                              {isZh ? "总览入口" : "Library view"}
                            </p>
                            <p className="mt-1 text-sm font-semibold truncate">
                              {isZh ? "查看全部实验" : "Browse all experiments"}
                            </p>
                          </div>
                          <span className={cn(pillClass, "shrink-0")}>
                            {totalExperimentCount} {isZh ? "个实验" : "experiments"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <div
                    className={cn(
                      "overflow-hidden rounded-[1.25rem] border",
                      theme === "dark" ? "border-slate-800" : "border-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "divide-y",
                        theme === "dark" ? "divide-slate-800" : "divide-slate-200",
                      )}
                    >
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
                                    backgroundColor:
                                      theme === "dark" ? `${unit.color}16` : `${unit.color}0d`,
                                  }
                                : undefined
                            }
                          >
                            <span
                              className="mt-0.5 h-10 w-1 shrink-0 rounded-full"
                              style={{ backgroundColor: isSelected ? unit.color : "transparent" }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {getLabel(unit.title)}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                    theme === "dark"
                                      ? "bg-slate-800 text-slate-300"
                                      : "bg-slate-100 text-slate-600",
                                  )}
                                >
                                  {isZh
                                    ? `单元 ${unit.sortOrder + 1}`
                                    : `Unit ${unit.sortOrder + 1}`}
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                    theme === "dark"
                                      ? "bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-400/20"
                                      : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
                                  )}
                                >
                                  {unit.courseCount || 0} {isZh ? "个实验" : "experiments"}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
              ) : !isAllExperimentsSelected && !selectedUnit ? (
                <section className={cn("rounded-[2rem] border", surfaceClass)}>
                  <EmptyWorkspace
                    theme={theme}
                    icon={Layers}
                    title={isZh ? "暂无单元" : "No units"}
                    description={
                      isZh
                        ? "当前还没有可展示的实验单元。"
                        : "No experiment units are available yet."
                    }
                  />
                </section>
              ) : (
                <section className={cn("rounded-[2rem] border px-5 py-5 sm:px-6", surfaceClass)}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{selectedSectionTitle}</h3>
                      <p className={cn("mt-1 text-sm leading-6", mutedTextClass)}>
                        {selectedSectionDescription}
                      </p>
                    </div>
                    <span className={pillClass}>
                      {selectedUnitCoursesLoading
                        ? isZh
                          ? "实验加载中"
                          : "Loading experiments"
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
                        <p
                          className={cn(
                            "text-sm",
                            theme === "dark" ? "text-red-300" : "text-red-600",
                          )}
                        >
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
                        unitColor={selectedUnit?.color || "#d97706"}
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
