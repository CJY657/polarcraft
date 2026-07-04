/**
 * Timeline Page - 历史时间线独立页面
 */

import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Sparkles, Sun, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { LearningSectionNav, PersistentHeader } from "@/components/shared";
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

const CLAY_CARD_COLORS = [
  "clay-card-pink",
  "clay-card-teal",
  "clay-card-lavender",
  "clay-card-peach",
  "clay-card-ochre",
  "clay-card-cream",
];

function EmptyWorkspace({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <Icon className="mb-4 h-12 w-12 text-slate-400" />
      <p className="text-lg font-semibold text-clay-ink">{title}</p>
      <p className="mt-2 max-w-md text-sm text-clay-muted">{description}</p>
    </div>
  );
}

export function TimelinePage() {
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

  const filterSurfaceClass = "border-[#e5e5e5] bg-[#faf5e8]";
  const mutedTextClass = "text-[#6a6a6a]";
  const subtleTextClass = "text-[#9a9a9a]";
  const pillClass = "inline-flex items-center rounded-full border border-[#e5e5e5] bg-[#f5f0e0] px-3 py-1 text-xs font-semibold text-[#0a0a0a]";

  const renderMobileTimeline = () => (
    <div className="relative pl-8">
      <div className="absolute left-3 top-0 bottom-0 w-[3px] bg-clay-ink/10 rounded-full" />

      {filteredEvents.map((event, index) => {
        const cardVariant = CLAY_CARD_COLORS[index % CLAY_CARD_COLORS.length];
        
        return (
          <div
            key={`${event.year}-${event.titleEn}`}
            id={`timeline-year-${event.year}`}
            className="relative mb-8 last:mb-0 scroll-mt-32"
          >
            <div className="absolute -left-[28px] flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-clay-canvas bg-clay-ink text-white font-mono text-xs font-bold shadow-sm">
              {String(event.year).slice(-2)}
            </div>

            <div className="mb-2 pl-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-clay-ink text-white shadow-sm">
                {event.track === "optics" ? (
                  <><Sun className="w-3.5 h-3.5" /> {event.year}</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> {event.year}</>
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
              cardVariant={cardVariant}
            />
          </div>
        );
      })}
    </div>
  );

  const renderDesktopTimeline = () => (
    <div className="relative">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex-1 rounded-l-2xl border border-r-0 border-[#e5e5e5] py-4 text-center bg-[#faf5e8]">
          <div className="flex items-center justify-center gap-2">
            <Sun className="w-5 h-5 text-clay-ink" />
            <span className="font-semibold text-clay-ink text-sm tracking-wide">
              {isZh ? "广义光学" : "General Optics"}
            </span>
          </div>
        </div>

        <div className="w-28 py-4 text-center border-y border-[#e5e5e5] bg-white relative z-10 shadow-sm rounded-full mx-[-16px]">
          <span className="text-sm font-semibold tracking-widest text-clay-muted uppercase">
            {isZh ? "年份" : "Year"}
          </span>
        </div>

        <div className="flex-1 rounded-r-2xl border border-l-0 border-[#e5e5e5] py-4 text-center bg-[#faf5e8]">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-clay-ink" />
            <span className="font-semibold text-clay-ink text-sm tracking-wide">
              {isZh ? "偏振光" : "Polarization"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Central dashed line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0 border-l-[3px] border-dashed border-clay-ink/15 -translate-x-1/2" />

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
                className="relative mb-12 flex items-stretch last:mb-0 scroll-mt-32"
              >
                <div className="flex flex-1 justify-end pr-8">
                  {hasOptics && (
                    <div className="w-full max-w-md space-y-4">
                      {opticsEvents.map((event) => {
                        const eventIndex = filteredEvents.findIndex((item) => item === event);
                        const cardVariant = CLAY_CARD_COLORS[eventIndex % CLAY_CARD_COLORS.length];

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
                            cardVariant={cardVariant}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex w-24 flex-shrink-0 flex-col items-center justify-start">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-clay-canvas bg-clay-ink text-white shadow-md font-mono text-sm font-bold z-20">
                    {year}
                  </div>
                  
                  {/* Connecting lines from year to cards */}
                  {hasOptics && (
                    <div className="absolute top-7 right-[50%] h-[3px] w-12 bg-clay-ink/20 -z-10" />
                  )}
                  {hasPolarization && (
                    <div className="absolute top-7 left-[50%] h-[3px] w-12 bg-clay-ink/20 -z-10" />
                  )}
                </div>

                <div className="flex flex-1 justify-start pl-8">
                  {hasPolarization && (
                    <div className="w-full max-w-md space-y-4">
                      {polarizationEvents.map((event) => {
                        const eventIndex = filteredEvents.findIndex((item) => item === event);
                        const cardVariant = CLAY_CARD_COLORS[eventIndex % CLAY_CARD_COLORS.length];

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
                            cardVariant={cardVariant}
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
    <div className="min-h-screen clay-canvas selection:bg-[#ff4d8b] selection:text-white pb-20">
      <PersistentHeader
        moduleKey="courses"
        moduleName={isZh ? "历史时间线" : "Historical timeline"}
        variant="solid"
        className="sticky top-0 z-40 bg-[#fffaf0]/90 backdrop-blur-md border-b border-[#e5e5e5]"
      />

      <main className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        {/* ── Page header ── */}
        <section className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="max-w-3xl"
          >
            <p className="clay-caption mb-3">
              Timeline
            </p>
            <h1 className="clay-display-xl mb-4">
              {isZh ? "历史时间线" : "Historical timeline"}
            </h1>
            <p className="clay-display-sm text-[#3a3a3a] max-w-2xl leading-tight opacity-90">
              {isZh
                ? "沿着光学史筛选关键实验、理论与偏振发现。"
                : "Browse key experiments, theories, and polarization discoveries across optics history."}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center gap-2 lg:gap-3"
          >
            <span className={pillClass}>{filteredEvents.length} {isZh ? "个事件" : "events"}</span>
            <span className={pillClass}>{majorMilestoneCount} {isZh ? "个里程碑" : "milestones"}</span>
            <span className={pillClass}>{totalCenturyCount || 0} {isZh ? "个世纪" : "centuries"}</span>
          </motion.div>
        </section>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-10"
        >
          <LearningSectionNav />
        </motion.div>

        {/* ── Filter controls panel ── */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn("mb-12 rounded-[24px] border border-[#e5e5e5] px-6 py-6 sm:px-8 sm:py-8 shadow-sm", filterSurfaceClass)}
        >
          <div className="flex items-center gap-3">
            <h2 className="clay-display-sm text-2xl m-0 p-0">
              {isZh ? "筛选" : "Filters"}
            </h2>
            <span className={cn("text-sm font-medium mt-1", mutedTextClass)}>
              {isZh
                ? "按章节、轨道和类型聚焦历史片段"
                : "Focus by chapter, track, and event type"}
            </span>
          </div>

          <div className="mt-6">
            <ChapterSelector
              className="rounded-[1.5rem]"
              selectedSections={selectedSections}
              onFilterChange={handleFilterChange}
              matchedEventCount={filteredEvents.length}
            />
          </div>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:gap-10">
            <div className="min-w-0 flex-1">
              <p className="clay-caption mb-3">
                {isZh ? "轨道" : "Track"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTrackFilter("all")}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-sm font-semibold transition-all shadow-sm active:scale-95",
                    trackFilter === "all"
                      ? "bg-clay-ink text-white"
                      : "bg-white text-clay-ink hover:bg-gray-50 border border-[#e5e5e5]",
                  )}
                >
                  {isZh ? "全部" : "All"}
                </button>
                <button
                  type="button"
                  onClick={() => setTrackFilter("optics")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all shadow-sm active:scale-95",
                    trackFilter === "optics"
                      ? "bg-clay-ink text-white"
                      : "bg-white text-clay-ink hover:bg-gray-50 border border-[#e5e5e5]",
                  )}
                >
                  <Sun className="h-4 w-4" />
                  {isZh ? "广义光学" : "General optics"}
                </button>
                <button
                  type="button"
                  onClick={() => setTrackFilter("polarization")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all shadow-sm active:scale-95",
                    trackFilter === "polarization"
                      ? "bg-clay-ink text-white"
                      : "bg-white text-clay-ink hover:bg-gray-50 border border-[#e5e5e5]",
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  {isZh ? "偏振光" : "Polarization"}
                </button>
              </div>
            </div>

            <div className="hidden sm:block sm:w-[1px] sm:self-stretch bg-[#d4d4d4]" />

            <div className="min-w-0 flex-1">
              <p className="clay-caption mb-3">
                {isZh ? "类型" : "Category"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("")}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-sm font-semibold transition-all shadow-sm active:scale-95",
                    !filter
                      ? "bg-clay-ink text-white"
                      : "bg-white text-clay-ink hover:bg-gray-50 border border-[#e5e5e5]",
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
                      "rounded-full px-4 py-2.5 text-sm font-semibold transition-all shadow-sm active:scale-95",
                      filter === key
                        ? "bg-clay-ink text-white"
                        : "bg-white text-clay-ink hover:bg-gray-50 border border-[#e5e5e5]",
                    )}
                  >
                    {isZh ? value.zh : value.en}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Main timeline panel ── */}
        <section className="mt-8 px-2 sm:px-4">
          {filteredEvents.length === 0 ? (
            <EmptyWorkspace
              icon={Clock}
              title={isZh ? "没有匹配的历史事件" : "No matching events"}
              description={
                isZh
                  ? "可以清除筛选，或者换一个章节、轨道与类型组合。"
                  : "Try clearing filters or changing the chapter, track, and category combination."
              }
            />
          ) : (
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_140px]">
              <div>
                {useSingleTrack ? renderMobileTimeline() : renderDesktopTimeline()}
              </div>

              {!useSingleTrack && (
                <div className="hidden xl:block">
                  <div className="sticky top-32">
                    <CenturyNavigator events={filteredEvents} isZh={isZh} variant="inline" />
                  </div>
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
