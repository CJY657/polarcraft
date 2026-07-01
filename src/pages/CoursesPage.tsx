/**
 * Courses Page - 实验课内容
 * 聚焦实验单元和实验入口，不再混合历史时间线导航
 */

import { useState, useCallback, useEffect, useRef } from "react";
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
import type { ModuleIconKey } from "@/components/icons";
import { useTheme } from "@/contexts/ThemeContext";
import { unitApi, type Unit } from "@/lib/unit.service";
import { normalizeKnowledgeTag, type KnowledgeTag } from "@/lib/course.service";
import { useUnitStore } from "@/stores/unitStore";
import { CourseSelector, type CourseSelectorCourse } from "@/feature/unit/CourseSelector";
import { cn } from "@/utils/classNames";

const ALL_EXPERIMENTS_ID = "__all_experiments__";

type CourseLibraryVariant = "experiments" | "applications";

interface CourseLibraryConfig {
  knowledgeTag: KnowledgeTag;
  moduleKey: ModuleIconKey;
  visualTone: "legacy" | "clay";
  shellTestId: string;
  accentColor: string;
  titleKey?: string;
  titleZh: string;
  titleEn: string;
  eyebrow: string;
  basePath: string;
  allTitleZh: string;
  allTitleEn: string;
  unitTitleZh: string;
  unitTitleEn: string;
  allDescriptionZh: string;
  allDescriptionEn: string;
  unitDescriptionZh: string;
  unitDescriptionEn: string;
  unitsHeadingZh: string;
  unitsHeadingEn: string;
  unitsDescriptionZh: string;
  unitsDescriptionEn: string;
  browseAllZh: string;
  browseAllEn: string;
  emptyUnitTitleZh: string;
  emptyUnitTitleEn: string;
  emptyUnitDescriptionZh: string;
  emptyUnitDescriptionEn: string;
  loadingZh: string;
  loadingEn: string;
  itemLabelZh: string;
  itemLabelEn: string;
  openLabelZh: string;
  openLabelEn: string;
}

const COURSE_LIBRARY_CONFIGS: Record<CourseLibraryVariant, CourseLibraryConfig> = {
  experiments: {
    knowledgeTag: "foundation",
    moduleKey: "courses",
    visualTone: "clay",
    shellTestId: "experiments-clay-shell",
    accentColor: "#264653",
    titleKey: "page.courses.title",
    titleZh: "实验内容",
    titleEn: "Experiments",
    eyebrow: "Experiment Library",
    basePath: "/experiments",
    allTitleZh: "全部实验",
    allTitleEn: "All experiments",
    unitTitleZh: "本单元实验",
    unitTitleEn: "Experiments in this unit",
    allDescriptionZh: "跨单元浏览全部基础知识实验入口，适合直接查找或快速进入。",
    allDescriptionEn: "Browse every foundation experiment across units from one unified library.",
    unitDescriptionZh: "选择一个实验，直接进入课件与媒体内容。",
    unitDescriptionEn: "Choose an experiment to open its slides and media.",
    unitsHeadingZh: "实验单元",
    unitsHeadingEn: "Units",
    unitsDescriptionZh: "先选单元，再进入当前单元下的基础知识实验。",
    unitsDescriptionEn: "Choose a unit, then open one of its foundation experiments.",
    browseAllZh: "查看全部实验",
    browseAllEn: "Browse all experiments",
    emptyUnitTitleZh: "该单元暂无基础知识实验",
    emptyUnitTitleEn: "No foundation experiments in this unit",
    emptyUnitDescriptionZh: "当前单元还没有可进入的基础知识内容。",
    emptyUnitDescriptionEn: "There are no foundation entries available in this unit yet.",
    loadingZh: "实验加载中",
    loadingEn: "Loading experiments",
    itemLabelZh: "实验",
    itemLabelEn: "Experiment",
    openLabelZh: "进入实验",
    openLabelEn: "Open",
  },
  applications: {
    knowledgeTag: "optical_device",
    moduleKey: "applications",
    visualTone: "clay",
    shellTestId: "applications-clay-shell",
    accentColor: "#2a9d8f",
    titleZh: "前沿应用",
    titleEn: "Frontier Applications",
    eyebrow: "Application Library",
    basePath: "/applications",
    allTitleZh: "全部应用",
    allTitleEn: "All applications",
    unitTitleZh: "本单元应用",
    unitTitleEn: "Applications in this unit",
    allDescriptionZh: "集中浏览光学设备类内容，连接仪器、检测与前沿应用场景。",
    allDescriptionEn: "Browse optical-device content across instruments, detection, and frontier use cases.",
    unitDescriptionZh: "选择一个应用，直接进入课件与媒体内容。",
    unitDescriptionEn: "Choose an application to open its slides and media.",
    unitsHeadingZh: "应用单元",
    unitsHeadingEn: "Application units",
    unitsDescriptionZh: "先选单元，再进入当前单元下的光学设备应用。",
    unitsDescriptionEn: "Choose a unit, then open one of its optical-device applications.",
    browseAllZh: "查看全部应用",
    browseAllEn: "Browse all applications",
    emptyUnitTitleZh: "该单元暂无光学设备应用",
    emptyUnitTitleEn: "No optical-device applications in this unit",
    emptyUnitDescriptionZh: "当前单元还没有可进入的光学设备内容。",
    emptyUnitDescriptionEn: "There are no optical-device entries available in this unit yet.",
    loadingZh: "应用加载中",
    loadingEn: "Loading applications",
    itemLabelZh: "应用",
    itemLabelEn: "Application",
    openLabelZh: "进入应用",
    openLabelEn: "Open",
  },
};

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

export function CoursesPage({ variant = "experiments" }: { variant?: CourseLibraryVariant } = {}) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const config = COURSE_LIBRARY_CONFIGS[variant];
  const useClayTone = config.visualTone === "clay";
  const useDarkTheme = !useClayTone && theme === "dark";
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitCourses, setSelectedUnitCourses] = useState<CourseSelectorCourse[]>([]);
  const [selectedUnitCoursesLoading, setSelectedUnitCoursesLoading] = useState(false);
  const [selectedUnitCoursesError, setSelectedUnitCoursesError] = useState<string | null>(null);
  const [selectedUnitCoursesReloadKey, setSelectedUnitCoursesReloadKey] = useState(0);
  const [unitCourseStructures, setUnitCourseStructures] = useState<
    Record<string, CourseSelectorCourse[]>
  >({});
  const [unitCourseStructuresLoading, setUnitCourseStructuresLoading] = useState(false);
  const [unitCourseStructuresError, setUnitCourseStructuresError] = useState<string | null>(null);
  const unitCoursesCacheRef = useRef<
    Record<string, CourseSelectorCourse[] | Promise<CourseSelectorCourse[]>>
  >({});

  const { units, isLoading: unitsLoading, fetchUnits } = useUnitStore();
  const isZh = i18n.language !== "en-US";
  const pageTitle = config.titleKey ? t(config.titleKey) : isZh ? config.titleZh : config.titleEn;

  const courseMatchesLibrary = useCallback(
    (course: CourseSelectorCourse) => normalizeKnowledgeTag(course.knowledgeTag) === config.knowledgeTag,
    [config.knowledgeTag],
  );

  const getUnitCourses = useCallback((unit: Unit) => {
    const cachedCourses = unitCoursesCacheRef.current[unit.id];
    if (cachedCourses) {
      return Promise.resolve(cachedCourses);
    }

    const request = unitApi
      .getPublicUnitCourses(unit.id)
      .then((courses) => {
        const matchingCourses = courses.filter(courseMatchesLibrary);
        unitCoursesCacheRef.current[unit.id] = matchingCourses;
        return matchingCourses;
      })
      .catch((error: unknown) => {
        if (unitCoursesCacheRef.current[unit.id] === request) {
          delete unitCoursesCacheRef.current[unit.id];
        }
        throw error;
      });

    unitCoursesCacheRef.current[unit.id] = request;
    return request;
  }, [courseMatchesLibrary]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    const activeUnitIds = new Set(units.map((unit) => unit.id));
    Object.keys(unitCoursesCacheRef.current).forEach((unitId) => {
      if (!activeUnitIds.has(unitId)) {
        delete unitCoursesCacheRef.current[unitId];
      }
    });
  }, [units]);

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

      return ALL_EXPERIMENTS_ID;
    });
  }, [units]);

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
  const getVisibleCourseCount = useCallback(
    (unit: Unit) => unitCourseStructures[unit.id]?.length ?? 0,
    [unitCourseStructures],
  );
  const totalExperimentCount = units.reduce((total, unit) => total + getVisibleCourseCount(unit), 0);

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
            const courses = await getUnitCourses(unit);

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
        ? getUnitCourses(selectedUnit)
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
              ? `${config.itemLabelZh}加载失败`
              : `Failed to load ${config.itemLabelEn.toLowerCase()}s`,
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [
    getUnitCourses,
    isAllExperimentsSelected,
    isZh,
    selectedUnit,
    selectedUnitCoursesReloadKey,
    units,
  ]);

  useEffect(() => {
    if (units.length === 0) {
      setUnitCourseStructures({});
      setUnitCourseStructuresLoading(false);
      setUnitCourseStructuresError(null);
      return;
    }

    let isCancelled = false;

    setUnitCourseStructuresLoading(true);
    setUnitCourseStructuresError(null);

    Promise.all(
      units.map(async (unit) => {
        const courses = await getUnitCourses(unit);

        return [unit.id, courses] as const;
      }),
    )
      .then((entries) => {
        if (isCancelled) {
          return;
        }

        setUnitCourseStructures(Object.fromEntries(entries));
        setUnitCourseStructuresLoading(false);
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        setUnitCourseStructures({});
        setUnitCourseStructuresLoading(false);
        setUnitCourseStructuresError(
          error instanceof Error
            ? error.message
            : isZh
              ? `${config.itemLabelZh}加载失败`
              : `Failed to load ${config.itemLabelEn.toLowerCase()}s`,
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [getUnitCourses, isZh, units]);

  const surfaceClass = useClayTone
    ? "border-clay-surface-strong bg-clay-surface-card text-clay-ink shadow-sm"
    : useDarkTheme
      ? "border-slate-800 bg-slate-950/80"
      : "border-slate-200 bg-white";
  const mutedTextClass = useClayTone
    ? "text-clay-body"
    : useDarkTheme
      ? "text-slate-400"
      : "text-slate-600";
  const pillClass = cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
    useClayTone
      ? "border-clay-surface-strong bg-clay-canvas text-clay-body"
      : useDarkTheme
        ? "border-slate-700 bg-slate-900 text-slate-300"
        : "border-slate-200 bg-slate-50 text-slate-600",
  );
  const emptyWorkspaceTheme = useClayTone ? "light" : theme;
  const spinnerClass = useClayTone ? "text-clay-ink" : "text-[#1d4ed8]";
  const selectedSectionTitle = isAllExperimentsSelected
    ? isZh
      ? config.allTitleZh
      : config.allTitleEn
    : isZh
      ? config.unitTitleZh
      : config.unitTitleEn;
  const selectedSectionDescription = isAllExperimentsSelected
    ? isZh
      ? config.allDescriptionZh
      : config.allDescriptionEn
    : isZh
      ? config.unitDescriptionZh
      : config.unitDescriptionEn;

  return (
    <div
      data-testid={useClayTone ? config.shellTestId : undefined}
      className={cn(
        "min-h-screen",
        useClayTone
          ? "clay-canvas text-clay-ink"
          : useDarkTheme
            ? "text-slate-100"
            : "text-slate-900",
      )}
      style={
        useClayTone
          ? undefined
          : {
              background:
                useDarkTheme
                  ? "linear-gradient(180deg, rgba(7,20,34,0.98) 0%, rgba(9,24,40,0.98) 100%)"
                  : "linear-gradient(180deg, #f6f8fc 0%, #ffffff 28%, #f8fafc 100%)",
            }
      }
    >
      <PersistentHeader
        moduleKey={config.moduleKey}
        moduleName={pageTitle}
        variant="solid"
        className="sticky top-0 z-40"
      />

      <main className="w-full pb-8">
        <section className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.22em]",
                  useClayTone ? "text-clay-muted" : "text-[#1d4ed8]",
                )}
              >
                {config.eyebrow}
              </p>
              <div className="mt-2 flex items-center gap-4">
                <h1
                  className={cn(
                    "text-3xl font-semibold tracking-tight sm:text-[2.35rem]",
                    useClayTone && "text-clay-ink",
                  )}
                  style={{ fontFamily: "var(--font-ui-display)" }}
                >
                  {pageTitle}
                </h1>
                <Link
                  to="/"
                  className={cn(
                    "group inline-flex items-center gap-2 text-sm font-bold transition-all active:scale-95",
                    useClayTone
                      ? "rounded-xl border border-clay-surface-strong bg-clay-surface-card px-4 py-2 text-clay-ink shadow-sm hover:border-clay-ink"
                      : useDarkTheme
                        ? "rounded-full bg-cyan-400 px-4 py-1.5 text-slate-950 shadow-lg ring-4 ring-cyan-400/20 hover:scale-105 hover:bg-cyan-300"
                        : "rounded-full bg-cyan-600 px-4 py-1.5 text-white shadow-lg ring-4 ring-cyan-600/20 hover:scale-105 hover:bg-cyan-700",
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
                <h2 className="text-lg font-semibold">
                  {isZh ? config.unitsHeadingZh : config.unitsHeadingEn}
                </h2>
                <p className={cn("mt-1 text-sm leading-6", mutedTextClass)}>
                  {isZh ? config.unitsDescriptionZh : config.unitsDescriptionEn}
                </p>
              </div>

              {unitsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className={cn("h-6 w-6 animate-spin", spinnerClass)} />
                </div>
              ) : units.length === 0 ? (
                <EmptyWorkspace
                  theme={emptyWorkspaceTheme}
                  icon={Layers}
                  title={isZh ? "暂无单元" : "No units"}
                  description={
                    isZh ? "当前还没有可展示的单元。" : "No units are available yet."
                  }
                />
              ) : (
                <div className="mt-2 space-y-4">
                  <button
                    type="button"
                    onClick={() => setSelectedUnitId(ALL_EXPERIMENTS_ID)}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-[1.4rem] border p-4 text-left transition-all duration-200",
                      useClayTone
                        ? isAllExperimentsSelected
                          ? "border-transparent text-white shadow-sm"
                          : "border-clay-surface-strong bg-clay-canvas text-clay-ink hover:border-clay-ink"
                        : isAllExperimentsSelected
                          ? useDarkTheme
                            ? "border-amber-300/40 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(15,23,42,0.88))] shadow-[0_18px_40px_rgba(251,191,36,0.12)]"
                            : "border-amber-300 bg-[linear-gradient(135deg,rgba(255,247,214,1),rgba(255,255,255,1))] shadow-[0_18px_40px_rgba(217,119,6,0.12)]"
                          : useDarkTheme
                            ? "border-slate-800 bg-[linear-gradient(135deg,rgba(148,163,184,0.08),rgba(15,23,42,0.88))] hover:border-amber-300/25 hover:bg-[linear-gradient(135deg,rgba(251,191,36,0.10),rgba(15,23,42,0.92))]"
                            : "border-slate-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.88),rgba(255,255,255,1))] hover:border-amber-200 hover:bg-[linear-gradient(135deg,rgba(255,247,214,1),rgba(255,255,255,1))]",
                    )}
                    style={
                      useClayTone && isAllExperimentsSelected
                        ? {
                            backgroundColor: config.accentColor,
                            borderColor: config.accentColor,
                          }
                        : undefined
                    }
                  >
                    {!useClayTone && (
                      <div className="absolute right-0 top-0 h-20 w-20 translate-x-5 -translate-y-5 rounded-full bg-amber-300/20 blur-2xl" />
                    )}
                    <div className="relative flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border",
                          useClayTone
                            ? isAllExperimentsSelected
                              ? "border-white/25 bg-white/20 text-white"
                              : "border-clay-surface-strong bg-clay-surface-card"
                            : useDarkTheme
                            ? "border-amber-300/25 bg-slate-950/55 text-amber-200"
                            : "border-amber-200 bg-white/80 text-amber-700",
                        )}
                        style={
                          useClayTone && !isAllExperimentsSelected
                            ? { color: config.accentColor }
                            : undefined
                        }
                      >
                        <Compass className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-[1.2]">
                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                          <div className="min-w-0 shrink-0">
                            <p
                              className={cn(
                                "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap",
                                useClayTone
                                  ? isAllExperimentsSelected
                                    ? "text-white/75"
                                    : "text-clay-muted"
                                  : useDarkTheme
                                    ? "text-amber-200/85"
                                    : "text-amber-700",
                              )}
                            >
                              <Sparkles className="h-3.5 w-3.5 shrink-0" />
                              {isZh ? "总览入口" : "Library view"}
                            </p>
                            <p className="mt-1 text-sm font-semibold truncate">
                              {isZh ? config.browseAllZh : config.browseAllEn}
                            </p>
                          </div>
                          <span className={cn(pillClass, "shrink-0")}>
                            {totalExperimentCount} {isZh ? `个${config.itemLabelZh}` : `${config.itemLabelEn.toLowerCase()}s`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <div
                    className={cn(
                      "overflow-hidden rounded-[1.25rem] border",
                      useClayTone
                        ? "border-clay-surface-strong bg-clay-canvas"
                        : useDarkTheme
                          ? "border-slate-800"
                          : "border-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "divide-y",
                        useClayTone
                          ? "divide-clay-surface-strong"
                          : useDarkTheme
                            ? "divide-slate-800"
                            : "divide-slate-200",
                      )}
                    >
                      {units.map((unit) => {
                        const isSelected = selectedUnit?.id === unit.id;
                        const unitCourses = unitCourseStructures[unit.id] ?? [];
                        const unitExperimentCount = getVisibleCourseCount(unit);
                        const isUnitStructureLoading =
                          unitCourseStructuresLoading && !unitCourseStructures[unit.id];

                        return (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => setSelectedUnitId(unit.id)}
                            className={cn(
                              "flex w-full items-start gap-3 px-3 py-4 text-left transition-colors",
                              useClayTone
                                ? "hover:bg-clay-surface-soft"
                                : useDarkTheme
                                  ? "hover:bg-slate-900/80"
                                  : "hover:bg-slate-50",
                            )}
                            style={
                              isSelected
                                ? {
                                    backgroundColor:
                                      useClayTone
                                        ? `${unit.color}14`
                                        : useDarkTheme
                                          ? `${unit.color}16`
                                          : `${unit.color}0d`,
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
                                    useClayTone
                                      ? "bg-clay-surface-card text-clay-body"
                                      : useDarkTheme
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
                                    useClayTone
                                      ? "ring-1 ring-inset"
                                      : useDarkTheme
                                      ? "bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-400/20"
                                      : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
                                  )}
                                  style={
                                    useClayTone
                                      ? {
                                          color: config.accentColor,
                                          backgroundColor: `${config.accentColor}1A`,
                                          boxShadow: `inset 0 0 0 1px ${config.accentColor}33`,
                                        }
                                      : undefined
                                  }
                                >
                                  {unitExperimentCount} {isZh ? `个${config.itemLabelZh}` : `${config.itemLabelEn.toLowerCase()}s`}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "mt-3 rounded-xl border px-3 py-2",
                                  useClayTone
                                    ? "border-clay-surface-strong bg-clay-surface-soft"
                                    : useDarkTheme
                                    ? "border-slate-800 bg-slate-950/45"
                                    : "border-slate-200 bg-white/72",
                                )}
                              >
                                <p
                                  className={cn(
                                    "text-[10px] font-bold uppercase tracking-[0.16em]",
                                    useClayTone
                                      ? "text-clay-muted"
                                      : useDarkTheme
                                        ? "text-slate-500"
                                        : "text-slate-400",
                                  )}
                                >
                                  {isZh ? "章节结构" : "Structure"}
                                </p>
                                {isUnitStructureLoading ? (
                                  <p className={cn("mt-1 text-xs", mutedTextClass)}>
                                    {isZh ? "加载中..." : "Loading..."}
                                  </p>
                                ) : unitCourseStructuresError && unitCourses.length === 0 ? (
                                  <p className={cn("mt-1 text-xs", mutedTextClass)}>
                                    {isZh
                                      ? "结构暂不可用"
                                      : "Structure unavailable"}
                                  </p>
                                ) : unitCourses.length === 0 ? (
                                  <p className={cn("mt-1 text-xs", mutedTextClass)}>
                                    {isZh ? `暂无${config.itemLabelZh}章节` : `No ${config.itemLabelEn.toLowerCase()} chapters`}
                                  </p>
                                ) : (
                                  <ol className="mt-1.5 space-y-1">
                                    {unitCourses.map((course, index) => (
                                      <li key={course.id} className="flex items-start gap-2 text-xs">
                                        <span
                                          className="mt-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold"
                                          style={{
                                            backgroundColor:
                                              useDarkTheme
                                                ? `${unit.color}24`
                                                : `${unit.color}14`,
                                            color: unit.color,
                                          }}
                                        >
                                          {index + 1}
                                        </span>
                                        <span className={cn("line-clamp-2", mutedTextClass)}>
                                          {getLabel(course.title)}
                                        </span>
                                      </li>
                                    ))}
                                  </ol>
                                )}
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
                    <Loader2 className={cn("h-8 w-8 animate-spin", spinnerClass)} />
                  </div>
                </section>
              ) : !isAllExperimentsSelected && !selectedUnit ? (
                <section className={cn("rounded-[2rem] border", surfaceClass)}>
                  <EmptyWorkspace
                    theme={emptyWorkspaceTheme}
                    icon={Layers}
                    title={isZh ? "暂无单元" : "No units"}
                    description={
                      isZh
                        ? "当前还没有可展示的单元。"
                        : "No units are available yet."
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
                          ? config.loadingZh
                          : config.loadingEn
                        : `${selectedUnitCourses.length} ${isZh ? `个${config.itemLabelZh}` : `${config.itemLabelEn.toLowerCase()}s`}`}
                    </span>
                  </div>

                  <div className="mt-5">
                    {selectedUnitCoursesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className={cn("h-6 w-6 animate-spin", spinnerClass)} />
                      </div>
                    ) : selectedUnitCoursesError ? (
                      <div className="py-8 text-center">
                        <p
                          className={cn(
                            "text-sm",
                            useDarkTheme ? "text-red-300" : "text-red-600",
                          )}
                        >
                          {selectedUnitCoursesError}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedUnitCoursesReloadKey((value) => value + 1)}
                          className={cn(
                            "mt-4 text-sm font-semibold transition-opacity hover:opacity-80",
                            useClayTone ? "text-clay-ink" : "text-[#1d4ed8]",
                          )}
                          style={useClayTone ? { color: config.accentColor } : undefined}
                        >
                          {isZh ? "重新加载" : "Retry"}
                        </button>
                      </div>
                    ) : selectedUnitCourses.length === 0 ? (
                      <EmptyWorkspace
                        theme={emptyWorkspaceTheme}
                        icon={BookOpenText}
                        title={isZh ? config.emptyUnitTitleZh : config.emptyUnitTitleEn}
                        description={isZh ? config.emptyUnitDescriptionZh : config.emptyUnitDescriptionEn}
                      />
                    ) : (
                      <CourseSelector
                        courses={selectedUnitCourses}
                        unitColor={selectedUnit?.color || config.accentColor}
                        basePath={config.basePath}
                        itemLabel={isZh ? config.itemLabelZh : config.itemLabelEn}
                        openLabel={isZh ? config.openLabelZh : config.openLabelEn}
                        showHeader={false}
                        tone={useClayTone ? "clay" : "legacy"}
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
