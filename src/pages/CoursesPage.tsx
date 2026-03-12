/**
 * Courses Page - 实验课内容
 * 保留原有单元和时间线交互，重构为更清晰的工作台式布局
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/utils/classNames";
import { Tabs, PersistentHeader } from "@/components/shared";
import {
  ArrowRight,
  BookOpenText,
  Clock,
  Layers,
  Loader2,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { TIMELINE_EVENTS } from "@/data/timeline-events";
import { CATEGORY_LABELS } from "@/data/chronicles-constants";
import { PSRT_CURRICULUM, getSectionsForEvent } from "@/data/psrt-curriculum";
import { useUnitStore } from "@/stores/unitStore";
import { unitApi, type UnitCourse } from "@/lib/unit.service";
import { CourseSelector } from "@/feature/unit/CourseSelector";

import {
  DualTrackCard,
  CenturyNavigator,
  ChapterSelector,
  DEMO_ITEMS,
  StoryModal,
} from "@/feature/course/chronicles";

const TABS = [
  {
    id: "slides",
    label: { "zh-CN": "按单元浏览", "en-US": "By Unit" },
    icon: <BookOpenText className="w-4 h-4" />,
  },
  {
    id: "timeline",
    label: { "zh-CN": "历史时间线", "en-US": "Timeline" },
    icon: <Clock className="w-4 h-4" />,
  },
];

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
  const { isMobile, isTablet } = useIsMobile();

  const [activeTab, setActiveTab] = useState("slides");
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [trackFilter, setTrackFilter] = useState<"all" | "optics" | "polarization">("all");
  const [storyModalEvent, setStoryModalEvent] = useState<number | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [highlightedSections, setHighlightedSections] = useState<Set<string>>(new Set());
  const [selectedDemos] = useState<string[]>([]);
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
  const useSingleTrack = isMobile || isTablet;

  const getLabel = useCallback(
    (label: { "zh-CN"?: string; "en-US"?: string }) => {
      return label[isZh ? "zh-CN" : "en-US"] || label["zh-CN"] || label["en-US"] || "";
    },
    [isZh],
  );

  void highlightedSections;

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
          error instanceof Error ? error.message : isZh ? "课程加载失败" : "Failed to load courses",
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [isZh, selectedUnit, selectedUnitCoursesReloadKey]);

  const matchedEventKeysFromSections = useMemo(() => {
    if (selectedSections.length === 0) {
      return null;
    }

    const eventKeys = new Set<string>();

    selectedSections.forEach((sectionId) => {
      const section = PSRT_CURRICULUM.flatMap((unit) => unit.sections).find((item) => item.id === sectionId);

      if (section) {
        section.relatedEvents.forEach((ref) => {
          eventKeys.add(`${ref.year}-${ref.track}`);
        });
      }
    });

    return eventKeys;
  }, [selectedSections]);

  const matchedEventKeysFromDemos = useMemo(() => {
    if (selectedDemos.length === 0) {
      return null;
    }

    const eventKeys = new Set<string>();

    selectedDemos.forEach((demoId) => {
      const demo = DEMO_ITEMS.find((item) => item.id === demoId);
      if (demo?.relatedEvents) {
        demo.relatedEvents.forEach((ref) => {
          eventKeys.add(`${ref.year}-${ref.track}`);
        });
      }
    });

    return eventKeys;
  }, [selectedDemos]);

  const matchedEventKeys = useMemo(() => {
    if (!matchedEventKeysFromSections && !matchedEventKeysFromDemos) {
      return null;
    }

    if (!matchedEventKeysFromSections) {
      return matchedEventKeysFromDemos;
    }

    if (!matchedEventKeysFromDemos) {
      return matchedEventKeysFromSections;
    }

    const intersection = new Set<string>();
    matchedEventKeysFromSections.forEach((key) => {
      if (matchedEventKeysFromDemos.has(key)) {
        intersection.add(key);
      }
    });

    return intersection;
  }, [matchedEventKeysFromSections, matchedEventKeysFromDemos]);

  const filteredEvents = useMemo(() => {
    return TIMELINE_EVENTS.filter((event) => {
      if (event.hidden) {
        return false;
      }

      const categoryMatch = !filter || event.category === filter;
      const trackMatch = trackFilter === "all" || event.track === trackFilter;
      const courseMatch =
        matchedEventKeys === null || matchedEventKeys.has(`${event.year}-${event.track}`);

      return categoryMatch && trackMatch && courseMatch;
    }).sort((a, b) => a.year - b.year);
  }, [filter, trackFilter, matchedEventKeys]);

  const totalCenturyCount = useMemo(() => {
    return new Set(filteredEvents.map((event) => Math.floor(event.year / 100) + 1)).size;
  }, [filteredEvents]);

  const majorMilestoneCount = useMemo(() => {
    return filteredEvents.filter((event) => event.importance === 1).length;
  }, [filteredEvents]);

  const hasTimelineFilters =
    selectedSections.length > 0 || trackFilter !== "all" || Boolean(filter);

  const handleFilterChange = useCallback((sections: string[]) => {
    setSelectedSections(sections);
  }, []);

  const handleOpenStory = (index: number) => {
    setStoryModalEvent(index);
  };

  const handleCloseStory = () => {
    setStoryModalEvent(null);
  };

  const handleNextStory = () => {
    if (storyModalEvent !== null && storyModalEvent < filteredEvents.length - 1) {
      setStoryModalEvent(storyModalEvent + 1);
    }
  };

  const handlePrevStory = () => {
    if (storyModalEvent !== null && storyModalEvent > 0) {
      setStoryModalEvent(storyModalEvent - 1);
    }
  };

  const handleEventClickForHighlight = useCallback(
    (year: number, track: "optics" | "polarization") => {
      const mappings = getSectionsForEvent(year, track);
      setHighlightedSections(new Set(mappings.map((item) => item.sectionId)));

      window.setTimeout(() => {
        setHighlightedSections(new Set());
      }, 5000);
    },
    [],
  );

  const handleLinkTo = useCallback((year: number, track: "optics" | "polarization") => {
    setTrackFilter("all");
    setFilter("");

    const allEventsSorted = [...TIMELINE_EVENTS]
      .filter((event) => !event.hidden)
      .sort((a, b) => a.year - b.year);
    const targetIndex = allEventsSorted.findIndex(
      (event) => event.year === year && event.track === track,
    );

    if (targetIndex !== -1) {
      setExpandedEvent(targetIndex);

      window.setTimeout(() => {
        const targetElement = document.querySelector(`[data-event-index="${targetIndex}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, []);

  const resetTimelineFilters = useCallback(() => {
    setSelectedSections([]);
    setTrackFilter("all");
    setFilter("");
  }, []);

  const renderMobileTimeline = () => (
    <div className="relative pl-8">
      <div
        className={cn(
          "absolute left-3 top-0 bottom-0 w-0.5",
          theme === "dark"
            ? "bg-gradient-to-b from-amber-500/50 via-gray-500/50 to-cyan-500/50"
            : "bg-gradient-to-b from-amber-300 via-gray-300 to-cyan-300",
        )}
      />

      {filteredEvents.map((event, index) => (
        <div
          key={`${event.year}-${event.titleEn}`}
          id={`timeline-year-${event.year}`}
          className="relative mb-4 last:mb-0 scroll-mt-32"
        >
          <div
            className={cn(
              "absolute -left-5 flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-xs font-bold",
              event.track === "optics"
                ? theme === "dark"
                  ? "border-amber-500 bg-amber-500/20 text-amber-400"
                  : "border-amber-500 bg-amber-100 text-amber-700"
                : theme === "dark"
                  ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                  : "border-cyan-500 bg-cyan-100 text-cyan-700",
            )}
          >
            {String(event.year).slice(-2)}
          </div>

          <div className="mb-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                event.track === "optics"
                  ? theme === "dark"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-amber-100 text-amber-700"
                  : theme === "dark"
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-cyan-100 text-cyan-700",
              )}
            >
              {event.track === "optics" ? (
                <>
                  <Sun className="w-3 h-3" /> {event.year}
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" /> {event.year}
                </>
              )}
            </span>
          </div>

          <DualTrackCard
            event={event}
            eventIndex={index}
            isExpanded={expandedEvent === index}
            onToggle={() => setExpandedEvent(expandedEvent === index ? null : index)}
            onReadStory={() => handleOpenStory(index)}
            onLinkTo={handleLinkTo}
            onHighlightCourses={handleEventClickForHighlight}
            side={event.track === "optics" ? "left" : "right"}
          />
        </div>
      ))}
    </div>
  );

  const renderDesktopTimeline = () => (
    <div className="relative">
      <div className="mb-6 flex items-center justify-between">
        <div
          className={cn(
            "flex-1 rounded-l-2xl border-r py-3 text-center",
            theme === "dark"
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-amber-200 bg-amber-50",
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Sun className={cn("w-5 h-5", theme === "dark" ? "text-amber-400" : "text-amber-600")} />
            <span
              className={cn(
                "font-semibold",
                theme === "dark" ? "text-amber-400" : "text-amber-700",
              )}
            >
              {isZh ? "广义光学" : "General Optics"}
            </span>
          </div>
        </div>

        <div className={cn("w-24 py-3 text-center", theme === "dark" ? "bg-slate-800" : "bg-slate-100")}>
          <span className={cn("text-sm font-mono", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
            {isZh ? "年份" : "Year"}
          </span>
        </div>

        <div
          className={cn(
            "flex-1 rounded-r-2xl border-l py-3 text-center",
            theme === "dark"
              ? "border-cyan-500/30 bg-cyan-500/10"
              : "border-cyan-200 bg-cyan-50",
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className={cn("w-5 h-5", theme === "dark" ? "text-cyan-400" : "text-cyan-600")} />
            <span
              className={cn(
                "font-semibold",
                theme === "dark" ? "text-cyan-400" : "text-cyan-700",
              )}
            >
              {isZh ? "偏振光" : "Polarization"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className={cn(
            "absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2",
            theme === "dark"
              ? "bg-gradient-to-b from-amber-500/50 via-gray-500/50 to-cyan-500/50"
              : "bg-gradient-to-b from-amber-300 via-gray-300 to-cyan-300",
          )}
        />

        {[...new Set(filteredEvents.map((event) => event.year))]
          .sort((a, b) => a - b)
          .map((year) => {
            const opticsEvents = filteredEvents.filter(
              (event) => event.year === year && event.track === "optics",
            );
            const polarizationEvents = filteredEvents.filter(
              (event) => event.year === year && event.track === "polarization",
            );
            const hasOptics = opticsEvents.length > 0;
            const hasPolarization = polarizationEvents.length > 0;

            return (
              <div
                key={year}
                id={`timeline-year-${year}`}
                className="relative mb-6 flex items-stretch last:mb-0 scroll-mt-28"
              >
                <div className="flex flex-1 justify-end pr-4">
                  {hasOptics && (
                    <div className="w-full max-w-md space-y-3">
                      {opticsEvents.map((event) => {
                        const eventIndex = filteredEvents.findIndex((item) => item === event);

                        return (
                          <DualTrackCard
                            key={event.titleEn}
                            event={event}
                            eventIndex={eventIndex}
                            isExpanded={expandedEvent === eventIndex}
                            onToggle={() =>
                              setExpandedEvent(expandedEvent === eventIndex ? null : eventIndex)
                            }
                            onReadStory={() => handleOpenStory(eventIndex)}
                            onLinkTo={handleLinkTo}
                            onHighlightCourses={handleEventClickForHighlight}
                            side="left"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex w-24 flex-shrink-0 flex-col items-center justify-start">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2 font-mono text-sm font-bold",
                      hasOptics && hasPolarization
                        ? theme === "dark"
                          ? "border-slate-500 bg-gradient-to-br from-amber-500/20 to-cyan-500/20 text-white"
                          : "border-slate-400 bg-gradient-to-br from-amber-100 to-cyan-100 text-slate-800"
                        : hasOptics
                          ? theme === "dark"
                            ? "border-amber-500 bg-amber-500/20 text-amber-400"
                            : "border-amber-500 bg-amber-100 text-amber-700"
                          : theme === "dark"
                            ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                            : "border-cyan-500 bg-cyan-100 text-cyan-700",
                    )}
                  >
                    {year}
                  </div>

                  {hasOptics && (
                    <div
                      className={cn(
                        "absolute top-6 right-full h-0.5 w-4",
                        theme === "dark" ? "bg-amber-500/50" : "bg-amber-400",
                      )}
                    />
                  )}
                  {hasPolarization && (
                    <div
                      className={cn(
                        "absolute top-6 left-full h-0.5 w-4",
                        theme === "dark" ? "bg-cyan-500/50" : "bg-cyan-400",
                      )}
                    />
                  )}
                </div>

                <div className="flex flex-1 justify-start pl-4">
                  {hasPolarization && (
                    <div className="w-full max-w-md space-y-3">
                      {polarizationEvents.map((event) => {
                        const eventIndex = filteredEvents.findIndex((item) => item === event);

                        return (
                          <DualTrackCard
                            key={event.titleEn}
                            event={event}
                            eventIndex={eventIndex}
                            isExpanded={expandedEvent === eventIndex}
                            onToggle={() =>
                              setExpandedEvent(expandedEvent === eventIndex ? null : eventIndex)
                            }
                            onReadStory={() => handleOpenStory(eventIndex)}
                            onLinkTo={handleLinkTo}
                            onHighlightCourses={handleEventClickForHighlight}
                            side="right"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "glass-page min-h-screen",
        theme === "dark" ? "text-slate-100" : "text-slate-900",
      )}
      style={{
        background:
          theme === "dark"
            ? "radial-gradient(circle at top left, rgba(123, 186, 255, 0.16), transparent 24%), radial-gradient(circle at top right, rgba(96, 212, 255, 0.14), transparent 26%), linear-gradient(180deg, rgba(7,20,34,0.94) 0%, rgba(10,24,44,0.96) 52%, rgba(7,20,34,0.98) 100%)"
            : "#ffffff",
      }}
    >
      <PersistentHeader
        moduleKey="courses"
        moduleName={t("page.courses.title")}
        variant="glass"
        className="sticky top-0 z-40"
      />

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
        <section className="mb-6">
          <div
            className={cn(
              "glass-panel-strong relative overflow-hidden rounded-[32px] border p-6 shadow-[0_26px_80px_-60px_rgba(15,23,42,0.45)] sm:p-8",
            )}
          >
            <div
              className="pointer-events-none absolute inset-0"
            style={{
              background:
                theme === "dark"
                    ? "radial-gradient(circle at top right, rgba(123,186,255,0.2), transparent 40%)"
                    : "linear-gradient(180deg, rgba(25,140,255,0.04), transparent 50%)",
              }}
            />

            <div className="relative flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
                <span
                  className={cn(
                    "glass-chip rounded-full border px-3 py-1 text-[var(--paper-accent)]",
                  )}
                >
                  课程总览
                </span>
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-4xl">
                  <h2 className="text-3xl font-black tracking-tight sm:text-[2.3rem]" style={{ fontFamily: "var(--font-ui-display)" }}>
                    {t("page.courses.title")}
                  </h2>
                  <p
                    className={cn(
                      "mt-3 text-sm leading-7 text-[var(--glass-text-muted)] sm:text-[15px]",
                    )}
                  >
                    {t("page.courses.description")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "slides" ? "timeline" : "slides")}
                  className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                >
                  {activeTab === "slides" ? "查看时间线" : "查看单元"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-[116px] xl:self-start">
            <section
              className={cn(
                "glass-panel-strong rounded-[28px] border p-5 shadow-[0_18px_60px_-46px_rgba(15,23,42,0.35)]",
              )}
            >
              <div className="mb-4">
                <h3 className="text-base font-bold">浏览模式</h3>
              </div>

              <Tabs
                tabs={TABS}
                activeTab={activeTab}
                onChange={setActiveTab}
                className="rounded-2xl p-1.5"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold",
                    theme === "dark"
                      ? "border-slate-700 bg-slate-900/85 text-slate-300"
                      : "border-slate-200 bg-slate-50 text-slate-600",
                  )}
                >
                  {activeTab === "slides" ? `${units.length} 个单元` : `${filteredEvents.length} 个事件`}
                </span>
                {activeTab === "timeline" && (
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      theme === "dark"
                        ? "border-slate-700 bg-slate-900/85 text-slate-300"
                        : "border-slate-200 bg-slate-50 text-slate-600",
                    )}
                  >
                    {majorMilestoneCount} 个里程碑
                  </span>
                )}
              </div>
            </section>

            {activeTab === "slides" ? (
              <section
                className={cn(
                  "rounded-[28px] border p-5",
                  theme === "dark"
                    ? "border-slate-800 bg-slate-950/72"
                    : "border-slate-200 bg-white/92",
                )}
              >
                <div className="mb-4">
                  <h3 className="text-base font-bold">单元列表</h3>
                </div>

                {unitsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                  </div>
                ) : units.length === 0 ? (
                  <EmptyWorkspace
                    theme={theme}
                    icon={Layers}
                    title={isZh ? "暂无单元" : "No units"}
                    description={
                      isZh ? "当前还没有可展示的实验课单元。" : "No experiment units are available yet."
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    {units.map((unit) => (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => setSelectedUnitId(unit.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all",
                          theme === "dark"
                            ? "border-slate-800 bg-slate-900/65 hover:bg-slate-900/85"
                            : "border-slate-200 bg-slate-50/80 hover:bg-white",
                        )}
                        style={
                          selectedUnit?.id === unit.id
                            ? {
                                backgroundColor:
                                  theme === "dark" ? `${unit.color}14` : `${unit.color}10`,
                                borderColor:
                                  theme === "dark" ? `${unit.color}38` : `${unit.color}22`,
                              }
                            : undefined
                        }
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                          style={{
                            backgroundColor:
                              theme === "dark" ? `${unit.color}18` : `${unit.color}12`,
                          }}
                        >
                          <Layers className="h-5 w-5" style={{ color: unit.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{getLabel(unit.title)}</p>
                          <p
                            className={cn(
                              "mt-1 text-xs",
                              theme === "dark" ? "text-slate-400" : "text-slate-500",
                            )}
                          >
                            {unit.courseCount || 0} {isZh ? "门课程" : "courses"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <>
                <section
                  className={cn(
                    "rounded-[28px] border p-5",
                    theme === "dark"
                      ? "border-slate-800 bg-slate-950/72"
                      : "border-slate-200 bg-white/92",
                  )}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold">章节筛选</h3>
                    </div>

                    {hasTimelineFilters && (
                      <button
                        type="button"
                        onClick={resetTimelineFilters}
                        className={cn(
                          "rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                          theme === "dark"
                            ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                        )}
                      >
                        清除筛选
                      </button>
                    )}
                  </div>

                  <ChapterSelector
                    selectedSections={selectedSections}
                    onFilterChange={handleFilterChange}
                    matchedEventCount={filteredEvents.length}
                  />
                </section>

                <section
                  className={cn(
                    "rounded-[28px] border p-5",
                    theme === "dark"
                      ? "border-slate-800 bg-slate-950/72"
                      : "border-slate-200 bg-white/92",
                  )}
                >
                  <div className="mb-4">
                    <h3 className="text-base font-bold">时间线筛选</h3>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <p className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.16em]", theme === "dark" ? "text-slate-500" : "text-slate-400")}>
                        轨道
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setTrackFilter("all")}
                          className={cn(
                            "rounded-full px-3 py-2 text-sm font-medium transition-all",
                            trackFilter === "all"
                              ? "bg-slate-700 text-white"
                              : theme === "dark"
                                ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                          )}
                        >
                          全部
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrackFilter("optics")}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all",
                            trackFilter === "optics"
                              ? "bg-amber-500 text-white"
                              : theme === "dark"
                                ? "bg-amber-500/12 text-amber-300 hover:bg-amber-500/20"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100",
                          )}
                        >
                          <Sun className="h-3.5 w-3.5" />
                          广义光学
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrackFilter("polarization")}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all",
                            trackFilter === "polarization"
                              ? "bg-cyan-500 text-white"
                              : theme === "dark"
                                ? "bg-cyan-500/12 text-cyan-300 hover:bg-cyan-500/20"
                                : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
                          )}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          偏振光
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.16em]", theme === "dark" ? "text-slate-500" : "text-slate-400")}>
                        类型
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setFilter("")}
                          className={cn(
                            "rounded-full px-3 py-2 text-sm font-medium transition-all",
                            !filter
                              ? "bg-slate-700 text-white"
                              : theme === "dark"
                                ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                          )}
                        >
                          全部
                        </button>
                        {Object.entries(CATEGORY_LABELS).map(([key, value]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFilter(key)}
                            className={cn(
                              "rounded-full px-3 py-2 text-sm font-medium transition-all",
                              filter === key
                                ? "bg-slate-700 text-white"
                                : theme === "dark"
                                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                            )}
                          >
                            {isZh ? value.zh : value.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={cn(
                          "rounded-2xl border p-4",
                          theme === "dark"
                            ? "border-slate-800 bg-slate-900/65"
                            : "border-slate-200 bg-slate-50/80",
                        )}
                      >
                        <p className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                          事件
                        </p>
                        <p className="mt-2 text-lg font-semibold">{filteredEvents.length}</p>
                      </div>
                      <div
                        className={cn(
                          "rounded-2xl border p-4",
                          theme === "dark"
                            ? "border-slate-800 bg-slate-900/65"
                            : "border-slate-200 bg-slate-50/80",
                        )}
                      >
                        <p className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                          世纪
                        </p>
                        <p className="mt-2 text-lg font-semibold">{totalCenturyCount || 0}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </aside>

          <section className="min-w-0 space-y-6">
            {activeTab === "slides" ? (
              <>
                {unitsLoading ? (
                  <section
                    className={cn(
                      "rounded-[32px] border",
                      theme === "dark"
                        ? "border-slate-800 bg-slate-950/72"
                        : "border-slate-200 bg-white/92",
                    )}
                  >
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                    </div>
                  </section>
                ) : !selectedUnit ? (
                  <section
                    className={cn(
                      "rounded-[32px] border",
                      theme === "dark"
                        ? "border-slate-800 bg-slate-950/72"
                        : "border-slate-200 bg-white/92",
                    )}
                  >
                    <EmptyWorkspace
                      theme={theme}
                      icon={Layers}
                      title={isZh ? "暂无单元" : "No units"}
                      description={
                        isZh
                          ? "当前还没有可展示的实验课单元。"
                          : "No experiment units are available yet."
                      }
                    />
                  </section>
                ) : (
                  <>
                    <section
                      className={cn(
                        "overflow-hidden rounded-[32px] border p-6 shadow-[0_28px_90px_-70px_rgba(15,23,42,0.9)] sm:p-7",
                        theme === "dark"
                          ? "border-slate-800 bg-slate-950/72"
                          : "border-slate-200 bg-white/92",
                      )}
                    >
                      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                        <div
                          className="relative overflow-hidden rounded-[28px] border"
                          style={{
                            backgroundColor:
                              theme === "dark" ? `${selectedUnit.color}12` : `${selectedUnit.color}0e`,
                            borderColor:
                              theme === "dark" ? `${selectedUnit.color}38` : `${selectedUnit.color}22`,
                          }}
                        >
                          {selectedUnit.coverImage ? (
                            <img
                              src={selectedUnit.coverImage}
                              alt={getLabel(selectedUnit.title)}
                              className="h-full min-h-[220px] w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full min-h-[220px] items-center justify-center">
                              <Layers className="h-16 w-16" style={{ color: selectedUnit.color }} />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-full border px-3 py-1 text-xs font-semibold"
                              style={{
                                color: theme === "dark" ? "#f8fafc" : selectedUnit.color,
                                backgroundColor:
                                  theme === "dark"
                                    ? `${selectedUnit.color}20`
                                    : `${selectedUnit.color}12`,
                                borderColor:
                                  theme === "dark"
                                    ? `${selectedUnit.color}38`
                                    : `${selectedUnit.color}22`,
                              }}
                            >
                              {isZh ? "当前单元" : "Current unit"}
                            </span>
                            <span
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-semibold",
                                theme === "dark"
                                  ? "border-slate-700 bg-slate-900/85 text-slate-300"
                                  : "border-slate-200 bg-slate-50 text-slate-600",
                              )}
                            >
                              {isZh ? "课程总览 / 单元 / 课程" : "Course overview / Unit / Course"}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-3xl font-black tracking-tight">
                              {getLabel(selectedUnit.title)}
                            </h3>
                            <p
                              className={cn(
                                "mt-3 text-sm leading-7 sm:text-[15px]",
                                theme === "dark" ? "text-slate-300" : "text-slate-600",
                              )}
                            >
                              {getLabel(selectedUnit.description)}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div
                              className={cn(
                                "rounded-2xl border p-4",
                                theme === "dark"
                                  ? "border-slate-800 bg-slate-900/65"
                                  : "border-slate-200 bg-slate-50/80",
                              )}
                            >
                              <p className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                                课程
                              </p>
                              <p className="mt-2 text-lg font-semibold">
                                {selectedUnit.courseCount || 0} 门
                              </p>
                            </div>
                            <div
                              className={cn(
                                "rounded-2xl border p-4",
                                theme === "dark"
                                  ? "border-slate-800 bg-slate-900/65"
                                  : "border-slate-200 bg-slate-50/80",
                              )}
                            >
                              <p className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                                课件状态
                              </p>
                              <p className="mt-2 text-lg font-semibold">
                                {selectedUnit.mainSlide ? "已就绪" : "待补充"}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "rounded-2xl border p-4 sm:col-span-2",
                                theme === "dark"
                                  ? "border-slate-800 bg-slate-900/65"
                                  : "border-slate-200 bg-slate-50/80",
                              )}
                            >
                              <p className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                                {isZh ? "关系" : "Relationship"}
                              </p>
                              <p className="mt-2 text-lg font-semibold">
                                {isZh
                                  ? `1 份单元导览 + ${selectedUnit.courseCount || 0} 门课程`
                                  : `1 unit overview + ${selectedUnit.courseCount || 0} courses`}
                              </p>
                              <p
                                className={cn(
                                  "mt-2 text-sm leading-6",
                                  theme === "dark" ? "text-slate-400" : "text-slate-600",
                                )}
                              >
                                {isZh
                                  ? "单元负责组织主题和导览，课程负责承载具体课件与媒体资源。"
                                  : "The unit frames the topic and overview, while courses hold the detailed slides and media."}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Link
                              to={`/units/${selectedUnit.id}`}
                              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
                              style={{
                                backgroundColor: selectedUnit.color,
                                boxShadow: `0 18px 40px -24px ${selectedUnit.color}`,
                              }}
                            >
                              {isZh ? "进入单元导览" : "Open unit overview"}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setActiveTab("timeline")}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors",
                                theme === "dark"
                                  ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white",
                              )}
                            >
                              查看时间线
                              <Clock className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section
                      className={cn(
                        "overflow-hidden rounded-[32px] border shadow-[0_28px_80px_-60px_rgba(15,23,42,0.9)]",
                        theme === "dark"
                          ? "border-slate-800 bg-slate-950/72"
                          : "border-slate-200 bg-white/92",
                      )}
                    >
                      <div
                        className={cn(
                          "flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                          theme === "dark" ? "border-slate-800" : "border-slate-200",
                        )}
                      >
                        <div>
                          <h3 className="text-base font-bold">{isZh ? "当前单元下的课程" : "Courses in this unit"}</h3>
                          <p className={cn("mt-1 text-sm", theme === "dark" ? "text-slate-400" : "text-slate-600")}>
                            {isZh
                              ? "单元是学习容器，下面这些课程才是具体进入点。"
                              : "The unit is the container; the courses below are the concrete entry points."}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold",
                            theme === "dark"
                              ? "border-slate-700 bg-slate-900/85 text-slate-300"
                              : "border-slate-200 bg-slate-50 text-slate-600",
                          )}
                        >
                          {selectedUnitCoursesLoading
                            ? isZh
                              ? "课程加载中"
                              : "Loading courses"
                            : `${selectedUnitCourses.length} ${isZh ? "门课程" : "courses"}`}
                        </div>
                      </div>

                      <div className="px-5 py-5">
                        {selectedUnitCoursesLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                          </div>
                        ) : selectedUnitCoursesError ? (
                          <div className="py-8 text-center">
                            <p className={cn("text-sm", theme === "dark" ? "text-red-300" : "text-red-600")}>
                              {selectedUnitCoursesError}
                            </p>
                            <button
                              type="button"
                              onClick={() => setSelectedUnitCoursesReloadKey((value) => value + 1)}
                              className={cn(
                                "mt-4 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                                theme === "dark"
                                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                              )}
                            >
                              {isZh ? "重试" : "Retry"}
                            </button>
                          </div>
                        ) : selectedUnitCourses.length === 0 ? (
                          <EmptyWorkspace
                            theme={theme}
                            icon={BookOpenText}
                            title={isZh ? "该单元暂无课程" : "No courses in this unit"}
                            description={
                              isZh
                                ? "当前单元还没有可进入的课程内容。"
                                : "There are no course entries available in this unit yet."
                            }
                          />
                        ) : (
                          <CourseSelector
                            unitId={selectedUnit.id}
                            courses={selectedUnitCourses}
                            unitColor={selectedUnit.color}
                            showHeader={false}
                          />
                        )}
                      </div>
                    </section>
                  </>
                )}
              </>
            ) : (
              <>
                <section
                  className={cn(
                    "rounded-[32px] border p-6 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.9)]",
                    theme === "dark"
                      ? "border-slate-800 bg-slate-950/72"
                      : "border-slate-200 bg-white/92",
                  )}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">历史时间线</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        `${filteredEvents.length} 个事件`,
                        `${majorMilestoneCount} 个里程碑`,
                        `${totalCenturyCount || 0} 个世纪`,
                      ].map((label) => (
                        <span
                          key={label}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold",
                            theme === "dark"
                              ? "border-slate-700 bg-slate-900/85 text-slate-300"
                              : "border-slate-200 bg-slate-50 text-slate-600",
                          )}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_140px]">
                  <div
                    className={cn(
                      "overflow-hidden rounded-[32px] border p-6 shadow-[0_28px_80px_-60px_rgba(15,23,42,0.9)]",
                      theme === "dark"
                        ? "border-slate-800 bg-slate-950/72"
                        : "border-slate-200 bg-white/92",
                    )}
                  >
                    {filteredEvents.length === 0 ? (
                      <EmptyWorkspace
                        theme={theme}
                        icon={Clock}
                        title={isZh ? "没有匹配的历史事件" : "No matching events"}
                        description={
                          isZh
                            ? "可以清除筛选，或者换一个章节、轨道与类型组合。"
                            : "Try clearing filters or changing the chapter, track, and category combination."
                        }
                      />
                    ) : useSingleTrack ? (
                      renderMobileTimeline()
                    ) : (
                      renderDesktopTimeline()
                    )}
                  </div>

                  {!useSingleTrack && filteredEvents.length > 0 && (
                    <div className="hidden 2xl:block">
                      <CenturyNavigator events={filteredEvents} isZh={isZh} variant="inline" />
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      </main>

      {storyModalEvent !== null && filteredEvents[storyModalEvent] && (
        <StoryModal
          event={filteredEvents[storyModalEvent]}
          onClose={handleCloseStory}
          onNext={handleNextStory}
          onPrev={handlePrevStory}
          hasNext={storyModalEvent < filteredEvents.length - 1}
          hasPrev={storyModalEvent > 0}
        />
      )}
    </div>
  );
}

export default CoursesPage;
