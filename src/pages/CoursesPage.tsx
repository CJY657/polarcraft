/**
 * Courses Page - 实验课内容
 * 保留原有单元和时间线交互，重构为更清晰的工作台式布局
 */

import { useState, useCallback, useMemo, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/utils/classNames";
import { Tabs, PersistentHeader } from "@/components/shared";
import {
  ArrowRight,
  BookOpenText,
  Clock,
  GraduationCap,
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
import type { Unit } from "@/lib/unit.service";

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
    label: { "zh-CN": "课程单元" },
    icon: <BookOpenText className="w-4 h-4" />,
  },
  {
    id: "timeline",
    label: { "zh-CN": "历史时间线" },
    icon: <Clock className="w-4 h-4" />,
  },
];

interface UnitDirectoryRowProps {
  unit: Unit;
  theme: "dark" | "light";
  isZh: boolean;
  isActive: boolean;
  getLabel: (label: { "zh-CN"?: string; "en-US"?: string }) => string;
  onSelect: () => void;
  onOpen: () => void;
}

function UnitDirectoryRow({
  unit,
  theme,
  isZh,
  isActive,
  getLabel,
  onSelect,
  onOpen,
}: UnitDirectoryRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group grid w-full gap-4 px-5 py-4 text-left transition-all lg:grid-cols-[1.15fr_1.8fr_0.9fr]",
        theme === "dark" ? "hover:bg-slate-900/75" : "hover:bg-slate-50/85",
        isActive && "shadow-[inset_4px_0_0_0_var(--unit-accent)]",
      )}
      style={
        isActive
          ? ({
              "--unit-accent": unit.color,
              backgroundColor:
                theme === "dark" ? `${unit.color}14` : `${unit.color}10`,
              borderColor:
                theme === "dark" ? `${unit.color}38` : `${unit.color}22`,
            } as CSSProperties)
          : undefined
      }
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
          style={{
            backgroundColor: theme === "dark" ? `${unit.color}1b` : `${unit.color}12`,
            borderColor: theme === "dark" ? `${unit.color}36` : `${unit.color}24`,
          }}
        >
          {unit.coverImage ? (
            <img
              src={unit.coverImage}
              alt={getLabel(unit.title)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Layers className="h-7 w-7" style={{ color: unit.color }} />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:text-base">{getLabel(unit.title)}</p>
          <p className={cn("mt-1 text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
            {isZh ? `单元 ${unit.sortOrder + 1}` : `Unit ${unit.sortOrder + 1}`}
          </p>
        </div>
      </div>

      <p
        className={cn(
          "text-sm leading-7",
          theme === "dark" ? "text-slate-300" : "text-slate-600",
        )}
      >
        {getLabel(unit.description)}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
        <div className="flex flex-wrap gap-2">
          {unit.mainSlide && (
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                theme === "dark"
                  ? "border-slate-700 bg-slate-900/85 text-slate-300"
                  : "border-slate-200 bg-slate-50 text-slate-600",
              )}
            >
              {isZh ? "主课件" : "Slides"}
            </span>
          )}
          <span
            className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              color: theme === "dark" ? "#f8fafc" : unit.color,
              backgroundColor: theme === "dark" ? `${unit.color}20` : `${unit.color}12`,
              borderColor: theme === "dark" ? `${unit.color}38` : `${unit.color}22`,
            }}
          >
            {unit.courseCount || 0} {isZh ? "门课程" : "courses"}
          </span>
        </div>

        <span
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: unit.color }}
        >
          {isZh ? "进入单元" : "Open"}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

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
  const navigate = useNavigate();
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
        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
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
                  Experiment Course
                </span>
                <span
                  className={cn(
                    "glass-chip rounded-full border px-3 py-1 text-[var(--glass-text-muted)]",
                  )}
                >
                  实验课内容工作区
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
                  {activeTab === "slides" ? "切换到时间线" : "切换到课程单元"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <section
            className={cn(
              "glass-panel-strong rounded-[32px] border p-5",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "glass-chip flex h-10 w-10 items-center justify-center rounded-[1rem] text-[var(--paper-accent)]",
                )}
              >
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">本页概览</h3>
                <p className="mt-1 text-xs text-[var(--glass-text-muted)]">
                  单元入口和历史时间线放在同一套工作区里
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                {
                  label: "课程单元",
                  value: String(units.length),
                  helper: "从主课件进入每个单元",
                },
                {
                  label: "可见事件",
                  value: String(filteredEvents.length),
                  helper: "时间线会响应章节和轨道筛选",
                },
                {
                  label: "重要节点",
                  value: String(majorMilestoneCount),
                  helper: "标记当前筛选范围内的关键里程碑",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "glass-panel-soft rounded-2xl border p-4",
                  )}
                >
                  <p className="text-xs text-[var(--paper-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-tight">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--glass-text-muted)]">
                    {item.helper}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </section>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-[116px] xl:self-start">
            <section
              className={cn(
                "glass-panel-strong rounded-[28px] border p-5 shadow-[0_18px_60px_-46px_rgba(15,23,42,0.35)]",
              )}
            >
              <div className="mb-4">
                <h3 className="text-base font-bold">工作区切换</h3>
                <p className="mt-1 text-xs text-[var(--glass-text-muted)]">
                  左侧负责控制，右侧负责浏览内容
                </p>
              </div>

              <Tabs
                tabs={TABS}
                activeTab={activeTab}
                onChange={setActiveTab}
                className="rounded-2xl p-1.5"
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div
                  className={cn(
                    "glass-panel-soft rounded-2xl border p-4",
                  )}
                >
                  <p className="text-xs text-[var(--paper-muted)]">
                    当前视图
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {activeTab === "slides" ? "课程单元" : "时间线"}
                  </p>
                </div>
                <div
                  className={cn(
                    "glass-panel-soft rounded-2xl border p-4",
                  )}
                >
                  <p className="text-xs text-[var(--paper-muted)]">
                    涵盖世纪
                  </p>
                  <p className="mt-2 text-sm font-semibold">{totalCenturyCount || 0}</p>
                </div>
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
                  <h3 className="text-base font-bold">单元目录</h3>
                  <p className={cn("mt-1 text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                    先选单元，再进入对应课件和课程
                  </p>
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
                      <p className={cn("mt-1 text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                        用课程章节反向查看历史脉络
                      </p>
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
                    <h3 className="text-base font-bold">筛选控制</h3>
                    <p className={cn("mt-1 text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                      轨道和事件类型会直接作用于右侧时间线
                    </p>
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
                          匹配事件
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
                          涵盖世纪
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
                            {selectedUnit.mainSlide && (
                              <span
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs font-semibold",
                                  theme === "dark"
                                    ? "border-slate-700 bg-slate-900/80 text-slate-300"
                                    : "border-slate-200 bg-slate-50 text-slate-600",
                                )}
                              >
                                主课件已配置
                              </span>
                            )}
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

                          <div className="grid gap-3 sm:grid-cols-3">
                            <div
                              className={cn(
                                "rounded-2xl border p-4",
                                theme === "dark"
                                  ? "border-slate-800 bg-slate-900/65"
                                  : "border-slate-200 bg-slate-50/80",
                              )}
                            >
                              <p className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                                关联课程
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
                                主课件
                              </p>
                              <p className="mt-2 text-lg font-semibold">
                                {selectedUnit.mainSlide ? "已就绪" : "待补充"}
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
                                推荐动作
                              </p>
                              <p className="mt-2 text-lg font-semibold">
                                {isZh ? "进入学习" : "Open"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/units/${selectedUnit.id}`)}
                              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
                              style={{
                                backgroundColor: selectedUnit.color,
                                boxShadow: `0 18px 40px -24px ${selectedUnit.color}`,
                              }}
                            >
                              进入当前单元
                              <ArrowRight className="h-4 w-4" />
                            </button>
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
                              查看相关时间线
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
                          <h3 className="text-base font-bold">单元总览</h3>
                          <p className={cn("mt-1 text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                            用列表而不是散卡片组织所有实验课单元，入口更稳定
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
                          共 {units.length} 个单元
                        </div>
                      </div>

                      <div
                        className={cn(
                          "hidden grid-cols-[1.15fr_1.8fr_0.9fr] gap-4 border-b px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] lg:grid",
                          theme === "dark"
                            ? "border-slate-800 text-slate-500"
                            : "border-slate-200 text-slate-500",
                        )}
                      >
                        <span>单元</span>
                        <span>内容定位</span>
                        <span className="text-right">资源状态</span>
                      </div>

                      <div className={cn("divide-y", theme === "dark" ? "divide-slate-800" : "divide-slate-200")}>
                        {units.map((unit) => (
                          <UnitDirectoryRow
                            key={unit.id}
                            unit={unit}
                            theme={theme}
                            isZh={isZh}
                            isActive={selectedUnit.id === unit.id}
                            getLabel={getLabel}
                            onSelect={() => setSelectedUnitId(unit.id)}
                            onOpen={() => navigate(`/units/${unit.id}`)}
                          />
                        ))}
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
                      <h3 className="text-2xl font-black tracking-tight">时间线工作区</h3>
                      <p
                        className={cn(
                          "mt-2 max-w-4xl text-sm leading-7",
                          theme === "dark" ? "text-slate-300" : "text-slate-600",
                        )}
                      >
                        把课程章节、轨道和事件类型整合到同一套控制区里，右侧时间线只负责浏览与展开。
                      </p>
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
