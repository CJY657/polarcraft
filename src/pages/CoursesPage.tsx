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
import { PersistentHeader } from "@/components/shared";
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
  const primaryCourse = selectedUnitCourses[0] ?? null;

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
                  ? "从单元直接进入实验，或者沿着时间线查看关键发现。"
                  : "Open experiments by unit, or browse the key discoveries on a timeline."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={pillClass}>{units.length} {isZh ? "个单元" : "units"}</span>
              <span className={pillClass}>
                {activeTab === "slides"
                  ? `${selectedUnit?.courseCount || 0} ${isZh ? "个实验" : "experiments"}`
                  : `${filteredEvents.length} ${isZh ? "个事件" : "events"}`}
              </span>
              {activeTab === "timeline" && (
                <span className={pillClass}>{majorMilestoneCount} {isZh ? "个里程碑" : "milestones"}</span>
              )}
            </div>
          </div>

          <div
            className={cn(
              "inline-flex w-fit flex-wrap gap-2 rounded-full border p-1.5",
              theme === "dark"
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-slate-50",
            )}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-[#1d4ed8] text-white"
                      : theme === "dark"
                        ? "text-slate-300 hover:bg-slate-800"
                        : "text-slate-600 hover:bg-white",
                  )}
                >
                  {tab.icon}
                  <span>{getLabel(tab.label)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === "slides" ? (
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
                  <>
                    <section className={cn("rounded-[2rem] border px-5 py-5 sm:px-6", surfaceClass)}>
                      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
                        <div
                          className={cn(
                            "overflow-hidden rounded-[1.5rem] border",
                            theme === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50",
                          )}
                        >
                          {selectedUnit.coverImage ? (
                            <img
                              src={selectedUnit.coverImage}
                              alt={getLabel(selectedUnit.title)}
                              className="h-full min-h-[220px] w-full object-cover"
                            />
                          ) : (
                            <div className="flex min-h-[220px] items-center justify-center">
                              <Layers className="h-14 w-14" style={{ color: selectedUnit.color }} />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                              style={{
                                color: theme === "dark" ? "#f8fafc" : selectedUnit.color,
                                backgroundColor: theme === "dark" ? `${selectedUnit.color}20` : `${selectedUnit.color}12`,
                              }}
                            >
                              {isZh ? `单元 ${selectedUnit.sortOrder + 1}` : `Unit ${selectedUnit.sortOrder + 1}`}
                            </span>
                            <span className={pillClass}>
                              {selectedUnit.courseCount || 0} {isZh ? "个实验" : "experiments"}
                            </span>
                            <span className={pillClass}>
                              {selectedUnit.mainSlide
                                ? isZh ? "主课件已就绪" : "Slides ready"
                                : isZh ? "主课件待补充" : "Slides pending"}
                            </span>
                          </div>

                          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                            {getLabel(selectedUnit.title)}
                          </h2>
                          <p className={cn("mt-3 max-w-2xl text-sm leading-7 sm:text-[15px]", mutedTextClass)}>
                            {getLabel(selectedUnit.description)}
                          </p>

                          <div className="mt-6 flex flex-wrap items-center gap-4">
                            {primaryCourse ? (
                              <Link
                                to={`/experiments/${primaryCourse.id}`}
                                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: selectedUnit.color }}
                              >
                                {isZh ? "进入当前实验" : "Open experiment"}
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold",
                                  theme === "dark"
                                    ? "bg-slate-800 text-slate-400"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {selectedUnitCoursesLoading
                                  ? isZh ? "实验加载中" : "Loading experiment"
                                  : isZh ? "暂无实验" : "No experiment"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setActiveTab("timeline")}
                              className="text-sm font-semibold text-[#1d4ed8] transition-opacity hover:opacity-80"
                            >
                              {isZh ? "从时间线浏览" : "Browse the timeline"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>

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
                  </>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
            <section className={cn("rounded-[2rem] border px-5 py-5 sm:px-6", surfaceClass)}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1d4ed8]">
                    Timeline
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    {isZh ? "历史时间线" : "Historical timeline"}
                  </h2>
                  <p className={cn("mt-2 text-sm leading-7", mutedTextClass)}>
                    {isZh
                      ? "按单元、轨道和主题筛选关键实验与发现。"
                      : "Filter key discoveries by unit, track, and theme."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={pillClass}>{filteredEvents.length} {isZh ? "个事件" : "events"}</span>
                  <span className={pillClass}>{majorMilestoneCount} {isZh ? "个里程碑" : "milestones"}</span>
                  <span className={pillClass}>{totalCenturyCount || 0} {isZh ? "个世纪" : "centuries"}</span>
                </div>
              </div>

              <div className="mt-6">
                <ChapterSelector
                  className="rounded-[1.5rem]"
                  selectedSections={selectedSections}
                  onFilterChange={handleFilterChange}
                  matchedEventCount={filteredEvents.length}
                />
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.16em]", subtleTextClass)}>
                    {isZh ? "轨道" : "Track"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTrackFilter("all")}
                      className={cn(
                        "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                        trackFilter === "all"
                          ? "bg-[#1d4ed8] text-white"
                          : theme === "dark"
                            ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {isZh ? "全部" : "All"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackFilter("optics")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                        trackFilter === "optics"
                          ? "bg-amber-500 text-white"
                          : theme === "dark"
                            ? "bg-amber-500/12 text-amber-300 hover:bg-amber-500/20"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100",
                      )}
                    >
                      <Sun className="h-3.5 w-3.5" />
                      {isZh ? "广义光学" : "General optics"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackFilter("polarization")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                        trackFilter === "polarization"
                          ? "bg-cyan-500 text-white"
                          : theme === "dark"
                            ? "bg-cyan-500/12 text-cyan-300 hover:bg-cyan-500/20"
                            : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {isZh ? "偏振光" : "Polarization"}
                    </button>
                  </div>
                </div>

                <div>
                  <p className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.16em]", subtleTextClass)}>
                    {isZh ? "类型" : "Category"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFilter("")}
                      className={cn(
                        "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                        !filter
                          ? "bg-[#1d4ed8] text-white"
                          : theme === "dark"
                            ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {isZh ? "全部" : "All"}
                    </button>
                    {Object.entries(CATEGORY_LABELS).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key)}
                        className={cn(
                          "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                          filter === key
                            ? "bg-[#1d4ed8] text-white"
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
              </div>
            </section>

            <section className={cn("rounded-[2rem] border px-5 py-5 sm:px-6", surfaceClass)}>
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
              ) : (
                <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_140px]">
                  <div>
                    {useSingleTrack ? renderMobileTimeline() : renderDesktopTimeline()}
                  </div>

                  {!useSingleTrack && (
                    <div className="hidden 2xl:block">
                      <CenturyNavigator events={filteredEvents} isZh={isZh} variant="inline" />
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
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
