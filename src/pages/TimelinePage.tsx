/**
 * Timeline Page - 历史时间线独立页面
 */

import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Sparkles, Sun, type LucideIcon } from "lucide-react";

import { LearningSectionNav, PersistentHeader } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { TIMELINE_EVENTS } from "@/data/timeline-events";
import { CATEGORY_LABELS } from "@/data/chronicles-constants";
import { PSRT_CURRICULUM } from "@/data/psrt-curriculum";
import {
  CenturyNavigator,
  ChapterSelector,
  DualTrackCard,
  StoryModal,
} from "@/feature/course/chronicles";
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

export function TimelinePage() {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const { isMobile, isTablet } = useIsMobile();

  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [trackFilter, setTrackFilter] = useState<"all" | "optics" | "polarization">("all");
  const [storyModalEvent, setStoryModalEvent] = useState<number | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const isZh = i18n.language !== "en-US";
  const useSingleTrack = isMobile || isTablet;

  const matchedEventKeys = useMemo(() => {
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

  const filteredEvents = useMemo(() => {
    return TIMELINE_EVENTS.filter((event) => {
      if (event.hidden) {
        return false;
      }

      const categoryMatch = !filter || event.category === filter;
      const trackMatch = trackFilter === "all" || event.track === trackFilter;
      const sectionMatch =
        matchedEventKeys === null || matchedEventKeys.has(`${event.year}-${event.track}`);

      return categoryMatch && trackMatch && sectionMatch;
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

  const handleOpenStory = useCallback((index: number) => {
    setStoryModalEvent(index);
  }, []);

  const handleCloseStory = useCallback(() => {
    setStoryModalEvent(null);
  }, []);

  const handleNextStory = useCallback(() => {
    setStoryModalEvent((current) => {
      if (current === null || current >= filteredEvents.length - 1) {
        return current;
      }

      return current + 1;
    });
  }, [filteredEvents.length]);

  const handlePrevStory = useCallback(() => {
    setStoryModalEvent((current) => {
      if (current === null || current <= 0) {
        return current;
      }

      return current - 1;
    });
  }, []);

  const handleLinkTo = useCallback((year: number, track: "optics" | "polarization") => {
    setTrackFilter("all");
    setFilter("");
    setSelectedSections([]);

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
        moduleName={isZh ? "历史时间线" : "Historical timeline"}
        variant="solid"
        className="sticky top-0 z-40"
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1d4ed8]">
              Timeline
            </p>
            <h1
              className="mt-2 text-3xl font-semibold tracking-tight sm:text-[2.35rem]"
              style={{ fontFamily: "var(--font-ui-display)" }}
            >
              {isZh ? "历史时间线" : "Historical timeline"}
            </h1>
            <p className={cn("mt-2 text-sm leading-7 sm:text-[15px]", mutedTextClass)}>
              {isZh
                ? "沿着光学史筛选关键实验、理论与偏振发现。"
                : "Browse key experiments, theories, and polarization discoveries across optics history."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={pillClass}>{filteredEvents.length} {isZh ? "个事件" : "events"}</span>
            <span className={pillClass}>{majorMilestoneCount} {isZh ? "个里程碑" : "milestones"}</span>
            <span className={pillClass}>{totalCenturyCount || 0} {isZh ? "个世纪" : "centuries"}</span>
          </div>
        </section>

        <LearningSectionNav />

        <section className={cn("rounded-[2rem] border px-5 py-5 sm:px-6", surfaceClass)}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1d4ed8]">
                Chronicle Filters
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {isZh ? "筛选历史脉络" : "Filter the historical thread"}
              </h2>
              <p className={cn("mt-2 text-sm leading-7", mutedTextClass)}>
                {isZh
                  ? "按章节、轨道和类型聚焦你要看的历史片段。"
                  : "Focus the story by chapter, track, and event type."}
              </p>
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

export default TimelinePage;
