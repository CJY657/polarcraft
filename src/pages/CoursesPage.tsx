/**
 * Chronicles Page - History of Light and Polarization
 * 光的编年史 - 双线叙事：广义光学 + 偏振光
 *
 * Interactive dual-timeline showcasing key discoveries:
 * - Left track: General optics history (核心光学发现)
 * - Right track: Polarization-specific history (偏振光专属旅程)
 */

import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/utils/classNames";
// import { Tabs, Badge, PersistentHeader } from "@/components/shared";
import { Tabs, PersistentHeader } from "@/components/shared";
import { Clock, BookOpen, Sun, Sparkles, Camera, Film } from "lucide-react";

// Data imports
import { TIMELINE_EVENTS } from "@/data/timeline-events";
import { CATEGORY_LABELS } from "@/data/chronicles-constants";
import { PSRT_CURRICULUM, getSectionsForEvent } from "@/data/psrt-curriculum";
import { COURSE_DATA } from "@/data/courses";

// Component imports
import {
  DualTrackCard,
  CenturyNavigator,
  ChapterSelector,
  DEMO_ITEMS,
  StoryModal,
} from "@/feature/course/chronicles";
import { CourseViewer } from "@/feature/course/CourseViewer";

// Visible tabs - reordered: resources (default), timeline, slides, psrt
const TABS = [
  {
    id: "slides",
    label: { "zh-CN": "课程幻灯片" },
    icon: <Film className="w-4 h-4" />,
  },
  { id: "timeline", label: { "zh-CN": "时间线" }, icon: <Clock className="w-4 h-4" /> },
];

export function CoursesPage() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { isMobile, isTablet } = useIsMobile();
  const [activeTab, setActiveTab] = useState("slides");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [trackFilter, setTrackFilter] = useState<"all" | "optics" | "polarization">("all");
  const [storyModalEvent, setStoryModalEvent] = useState<number | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]); // P-SRT章节筛选状态
  const [highlightedSections, setHighlightedSections] = useState<Set<string>>(new Set()); // 事件点击高亮的课程章节 (reserved for future use)
  const [selectedDemos, setSelectedDemos] = useState<string[]>([]); // 演示筛选状态

  const isZh = true;

  // Suppress unused variable warning (highlightedSections is set but not yet used after removing CourseNavigator)
  void highlightedSections;

  // Use single-track layout on mobile/tablet
  const useSingleTrack = isMobile || isTablet;

  // 计算被P-SRT章节筛选匹配的事件集合
  const matchedEventKeysFromSections = useMemo(() => {
    if (selectedSections.length === 0) return null;

    // Get all events related to selected sections
    const eventKeys = new Set<string>();
    selectedSections.forEach((sectionId) => {
      const section = PSRT_CURRICULUM.flatMap((unit) => unit.sections).find(
        (s) => s.id === sectionId,
      );

      if (section) {
        section.relatedEvents.forEach((ref) => {
          eventKeys.add(`${ref.year}-${ref.track}`);
        });
      }
    });

    return eventKeys;
  }, [selectedSections]);

  // 计算被演示筛选匹配的事件集合
  const matchedEventKeysFromDemos = useMemo(() => {
    if (selectedDemos.length === 0) return null;

    // Get all events related to selected demos
    const eventKeys = new Set<string>();
    selectedDemos.forEach((demoId) => {
      const demo = DEMO_ITEMS.find((d) => d.id === demoId);
      if (demo?.relatedEvents) {
        demo.relatedEvents.forEach((ref) => {
          eventKeys.add(`${ref.year}-${ref.track}`);
        });
      }
    });

    return eventKeys;
  }, [selectedDemos]);

  // 合并两种筛选的事件集合 (交集或并集)
  const matchedEventKeys = useMemo(() => {
    // If neither filter is active, return null (show all)
    if (!matchedEventKeysFromSections && !matchedEventKeysFromDemos) return null;

    // If only one filter is active, return that one
    if (!matchedEventKeysFromSections) return matchedEventKeysFromDemos;
    if (!matchedEventKeysFromDemos) return matchedEventKeysFromSections;

    // If both are active, return intersection (events that match both)
    const intersection = new Set<string>();
    matchedEventKeysFromSections.forEach((key) => {
      if (matchedEventKeysFromDemos.has(key)) {
        intersection.add(key);
      }
    });
    return intersection;
  }, [matchedEventKeysFromSections, matchedEventKeysFromDemos]);

  // Filter events by category, track, and selected course modules
  const filteredEvents = useMemo(() => {
    return TIMELINE_EVENTS.filter((e) => {
      // 首先排除隐藏的事件（与偏振光关系较远的事件）
      if (e.hidden) return false;

      const categoryMatch = !filter || e.category === filter;
      const trackMatch = trackFilter === "all" || e.track === trackFilter;

      // 课程筛选：如果有选中的课程模块，只显示匹配的事件
      const courseMatch = matchedEventKeys === null || matchedEventKeys.has(`${e.year}-${e.track}`);

      return categoryMatch && trackMatch && courseMatch;
    }).sort((a, b) => a.year - b.year);
  }, [filter, trackFilter, matchedEventKeys]);

  // 处理P-SRT章节筛选变化
  const handleFilterChange = useCallback((sections: string[]) => {
    setSelectedSections(sections);
  }, []);

  // Story modal navigation
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

  // 处理点击时间线事件，高亮相关P-SRT章节
  const handleEventClickForHighlight = useCallback(
    (year: number, track: "optics" | "polarization") => {
      // Get related sections for this event using getSectionsForEvent
      const mappings = getSectionsForEvent(year, track);
      const relatedSections = new Set(mappings.map((m) => m.sectionId));
      setHighlightedSections(relatedSections);

      // Clear after 5 seconds
      setTimeout(() => {
        setHighlightedSections(new Set());
      }, 5000);
    },
    [],
  );

  // Navigate to linked event
  const handleLinkTo = useCallback((year: number, track: "optics" | "polarization") => {
    // Reset filter to show all events
    setTrackFilter("all");
    setFilter("");

    // Find the target event in the full TIMELINE_EVENTS (sorted by year, excluding hidden)
    const allEventsSorted = [...TIMELINE_EVENTS]
      .filter((e) => !e.hidden)
      .sort((a, b) => a.year - b.year);
    const targetIndex = allEventsSorted.findIndex((e) => e.year === year && e.track === track);

    if (targetIndex !== -1) {
      // Expand the target event
      setExpandedEvent(targetIndex);

      // Scroll to the target event after a short delay to allow re-render
      setTimeout(() => {
        const targetElement = document.querySelector(`[data-event-index="${targetIndex}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, []);

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
          : "bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fffbeb]",
      )}
    >
      {/* Header with Persistent Logo */}
      <PersistentHeader
        moduleKey="courses"
        moduleName={t("page.courses.title")}
        variant="glass"
        className={cn(
          "sticky top-0 z-40",
          theme === "dark"
            ? "bg-slate-900/80 border-b border-slate-700"
            : "bg-white/80 border-b border-gray-200",
        )}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero section */}
        <div className="text-center mb-8">
          <h2
            className={cn(
              "text-2xl sm:text-3xl font-bold mb-3",
              theme === "dark" ? "text-white" : "text-gray-900",
            )}
          >
            {t("page.courses.title")}
          </h2>
          <p
            className={cn(
              "text-base max-w-3xl mx-auto mb-4",
              theme === "dark" ? "text-gray-400" : "text-gray-600",
            )}
          >
            {t("page.courses.description")}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {activeTab === "slides" && (
          <>
            {selectedCourse ? (
              <CourseViewer
                course={COURSE_DATA.find((c) => c.id === selectedCourse)!}
                onBack={() => setSelectedCourse(null)}
                theme={theme}
              />
            ) : (
              <>
                {/* Course cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {COURSE_DATA.map((course) => {
                    return (
                      <div
                        key={course.id}
                        onClick={() => setSelectedCourse(course.id)}
                        className={cn(
                          "group rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl",
                          theme === "dark"
                            ? "bg-slate-800/50 border-2 border-slate-700 hover:border-slate-500"
                            : "bg-white shadow-sm hover:shadow-lg",
                        )}
                      >
                        {/* Cover Image */}
                        <div className="relative h-40 overflow-hidden">
                          {course.coverImage ? (
                            <img
                              src={course.coverImage}
                              alt={course.title[i18n.language]}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: `linear-gradient(135deg, ${course.color}40 0%, ${course.color}10 100%)`,
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div
                                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                  style={{ backgroundColor: `${course.color}30` }}
                                >
                                  <BookOpen
                                    className="w-8 h-8"
                                    style={{ color: course.color }}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          {/* Title */}
                          <h3
                            className={cn(
                              "text-lg font-bold mb-2 line-clamp-2",
                              theme === "dark" ? "text-white" : "text-gray-900",
                            )}
                          >
                            {course.title[i18n.language]}
                          </h3>

                          {/* Description */}
                          <p
                            className={cn(
                              "text-sm mb-4 line-clamp-2",
                              theme === "dark" ? "text-gray-400" : "text-gray-600",
                            )}
                          >
                            {course.description[i18n.language]}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs">
                            <div
                              className="flex items-center gap-1.5"
                              style={{ color: course.color }}
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>
                                {course.media.length} {i18n.t("page.courses.media")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "timeline" && (
          <>
            {/* P-SRT Course Chapter Selector - 顶部课程章节选择器 */}
            <ChapterSelector
              selectedSections={selectedSections}
              onFilterChange={handleFilterChange}
              matchedEventCount={filteredEvents.length}
              className="mb-4"
            />

            {/* Track filters */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg",
                theme === "dark" ? "bg-slate-800/50" : "bg-gray-50",
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium mr-2",
                  theme === "dark" ? "text-gray-400" : "text-gray-600",
                )}
              >
                {isZh ? "轨道：" : "Track:"}
              </span>
              <button
                onClick={() => setTrackFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                  trackFilter === "all"
                    ? "bg-gray-600 text-white"
                    : theme === "dark"
                      ? "text-gray-400 hover:text-white hover:bg-slate-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200",
                )}
              >
                {isZh ? "全部" : "All"}
              </button>
              <button
                onClick={() => setTrackFilter("optics")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                  trackFilter === "optics"
                    ? "bg-amber-500 text-white"
                    : theme === "dark"
                      ? "text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/20"
                      : "text-amber-600 hover:text-amber-700 hover:bg-amber-100",
                )}
              >
                <Sun className="w-3.5 h-3.5" />
                {isZh ? "广义光学" : "Optics"}
              </button>
              <button
                onClick={() => setTrackFilter("polarization")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                  trackFilter === "polarization"
                    ? "bg-cyan-500 text-white"
                    : theme === "dark"
                      ? "text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-500/20"
                      : "text-cyan-600 hover:text-cyan-700 hover:bg-cyan-100",
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isZh ? "偏振光" : "Polarization"}
              </button>
            </div>

            {/* Category filters */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 mb-6 p-3 rounded-lg",
                theme === "dark" ? "bg-slate-800/50" : "bg-gray-50",
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium mr-2",
                  theme === "dark" ? "text-gray-400" : "text-gray-600",
                )}
              >
                {isZh ? "类型：" : "Type:"}
              </span>
              <button
                onClick={() => setFilter("")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  !filter
                    ? "bg-gray-600 text-white"
                    : theme === "dark"
                      ? "text-gray-400 hover:text-white hover:bg-slate-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200",
                )}
              >
                {isZh ? "全部" : "All"}
              </button>
              {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    filter === key
                      ? "bg-gray-600 text-white"
                      : theme === "dark"
                        ? "text-gray-400 hover:text-white hover:bg-slate-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200",
                  )}
                >
                  {isZh ? val.zh : val.en}
                </button>
              ))}
            </div>

            {/* Demo Navigator removed - 光学演示馆导航已移除，简化时间线界面 */}

            {/* Century Navigator - 世纪导航 (Desktop only, right side) */}
            {!useSingleTrack && (
              <CenturyNavigator
                events={filteredEvents}
                isZh={isZh}
              />
            )}

            {/* Mobile Single-Track Timeline - 移动端单轨时间线 */}
            {useSingleTrack ? (
              <div className="relative">
                {/* Mobile Track Tabs */}
                <div
                  className={cn(
                    "sticky top-16 z-20 flex items-center justify-center gap-2 mb-4 py-2",
                    theme === "dark" ? "bg-slate-900/95" : "bg-white/95",
                    "backdrop-blur-sm",
                  )}
                >
                  <button
                    onClick={() => setTrackFilter("all")}
                    className={cn(
                      "flex-1 max-w-[100px] py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      trackFilter === "all"
                        ? theme === "dark"
                          ? "bg-gradient-to-r from-amber-500/30 to-cyan-500/30 text-white"
                          : "bg-gradient-to-r from-amber-100 to-cyan-100 text-gray-900"
                        : theme === "dark"
                          ? "bg-slate-800 text-gray-400"
                          : "bg-gray-100 text-gray-600",
                    )}
                  >
                    {isZh ? "全部" : "All"}
                  </button>
                  <button
                    onClick={() => setTrackFilter("optics")}
                    className={cn(
                      "flex-1 max-w-[100px] py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                      trackFilter === "optics"
                        ? "bg-amber-500 text-white"
                        : theme === "dark"
                          ? "bg-slate-800 text-amber-400"
                          : "bg-amber-50 text-amber-700",
                    )}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    {isZh ? "光学" : "Optics"}
                  </button>
                  <button
                    onClick={() => setTrackFilter("polarization")}
                    className={cn(
                      "flex-1 max-w-[100px] py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                      trackFilter === "polarization"
                        ? "bg-cyan-500 text-white"
                        : theme === "dark"
                          ? "bg-slate-800 text-cyan-400"
                          : "bg-cyan-50 text-cyan-700",
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isZh ? "偏振" : "Polar"}
                  </button>
                </div>

                {/* Single-track vertical timeline */}
                <div className="relative pl-8">
                  {/* Left vertical line */}
                  <div
                    className={cn(
                      "absolute left-3 top-0 bottom-0 w-0.5",
                      theme === "dark"
                        ? "bg-gradient-to-b from-amber-500/50 via-gray-500/50 to-cyan-500/50"
                        : "bg-gradient-to-b from-amber-300 via-gray-300 to-cyan-300",
                    )}
                  />

                  {/* Events */}
                  {filteredEvents.map((event, idx) => (
                    <div
                      key={`${event.year}-${event.titleEn}`}
                      id={`timeline-year-${event.year}`}
                      className="relative mb-4 last:mb-0 scroll-mt-32"
                    >
                      {/* Year marker */}
                      <div
                        className={cn(
                          "absolute -left-5 w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2",
                          event.track === "optics"
                            ? theme === "dark"
                              ? "bg-amber-500/20 border-amber-500 text-amber-400"
                              : "bg-amber-100 border-amber-500 text-amber-700"
                            : theme === "dark"
                              ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                              : "bg-cyan-100 border-cyan-500 text-cyan-700",
                        )}
                      >
                        {String(event.year).slice(-2)}
                      </div>

                      {/* Track indicator badge */}
                      <div className="mb-1">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
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

                      {/* Event card */}
                      <DualTrackCard
                        event={event}
                        eventIndex={idx}
                        isExpanded={expandedEvent === idx}
                        onToggle={() => setExpandedEvent(expandedEvent === idx ? null : idx)}
                        onReadStory={() => handleOpenStory(idx)}
                        onLinkTo={handleLinkTo}
                        onHighlightCourses={handleEventClickForHighlight}
                        side={event.track === "optics" ? "left" : "right"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Desktop Dual Track Timeline - 桌面端双轨时间线 */
              <div className="relative">
                {/* Track Labels - 轨道标签 */}
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={cn(
                      "flex-1 text-center py-2 rounded-l-lg border-r",
                      theme === "dark"
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-amber-50 border-amber-200",
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Sun
                        className={cn(
                          "w-5 h-5",
                          theme === "dark" ? "text-amber-400" : "text-amber-600",
                        )}
                      />
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
                  <div
                    className={cn(
                      "w-20 text-center py-2",
                      theme === "dark" ? "bg-slate-800" : "bg-gray-100",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-mono",
                        theme === "dark" ? "text-gray-400" : "text-gray-500",
                      )}
                    >
                      {isZh ? "年份" : "Year"}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex-1 text-center py-2 rounded-r-lg border-l",
                      theme === "dark"
                        ? "bg-cyan-500/10 border-cyan-500/30"
                        : "bg-cyan-50 border-cyan-200",
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles
                        className={cn(
                          "w-5 h-5",
                          theme === "dark" ? "text-cyan-400" : "text-cyan-600",
                        )}
                      />
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

                {/* Timeline with center axis */}
                <div className="relative">
                  {/* Center vertical line */}
                  <div
                    className={cn(
                      "absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2",
                      theme === "dark"
                        ? "bg-gradient-to-b from-amber-500/50 via-gray-500/50 to-cyan-500/50"
                        : "bg-gradient-to-b from-amber-300 via-gray-300 to-cyan-300",
                    )}
                  />

                  {/* Events */}
                  {(() => {
                    // Get all unique years from filtered events
                    const years = [...new Set(filteredEvents.map((e) => e.year))].sort(
                      (a, b) => a - b,
                    );

                    return years.map((year) => {
                      // Get ALL events for this year per track (not just the first one)
                      const opticsEvents = filteredEvents.filter(
                        (e) => e.year === year && e.track === "optics",
                      );
                      const polarizationEvents = filteredEvents.filter(
                        (e) => e.year === year && e.track === "polarization",
                      );
                      const hasOptics = opticsEvents.length > 0;
                      const hasPolarization = polarizationEvents.length > 0;

                      return (
                        <div
                          key={year}
                          id={`timeline-year-${year}`}
                          className="relative flex items-stretch mb-6 last:mb-0 scroll-mt-24"
                        >
                          {/* Left side - Optics (can have multiple events) */}
                          <div className="flex-1 pr-4 flex justify-end">
                            {hasOptics && (
                              <div className="w-full max-w-md space-y-3">
                                {opticsEvents.map((opticsEvent) => {
                                  const opticsIndex = filteredEvents.findIndex(
                                    (e) => e === opticsEvent,
                                  );
                                  return (
                                    <DualTrackCard
                                      key={opticsEvent.titleEn}
                                      event={opticsEvent}
                                      eventIndex={opticsIndex}
                                      isExpanded={expandedEvent === opticsIndex}
                                      onToggle={() =>
                                        setExpandedEvent(
                                          expandedEvent === opticsIndex ? null : opticsIndex,
                                        )
                                      }
                                      onReadStory={() => handleOpenStory(opticsIndex)}
                                      onLinkTo={handleLinkTo}
                                      onHighlightCourses={handleEventClickForHighlight}
                                      side="left"
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Center year marker */}
                          <div className="w-20 flex flex-col items-center justify-start relative z-10 flex-shrink-0">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-sm border-2",
                                hasOptics && hasPolarization
                                  ? theme === "dark"
                                    ? "bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border-gray-500 text-white"
                                    : "bg-gradient-to-br from-amber-100 to-cyan-100 border-gray-400 text-gray-800"
                                  : hasOptics
                                    ? theme === "dark"
                                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                                      : "bg-amber-100 border-amber-500 text-amber-700"
                                    : theme === "dark"
                                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                                      : "bg-cyan-100 border-cyan-500 text-cyan-700",
                              )}
                            >
                              {year}
                            </div>
                            {/* Connector lines */}
                            {hasOptics && (
                              <div
                                className={cn(
                                  "absolute top-6 right-full w-4 h-0.5 mr-0",
                                  theme === "dark" ? "bg-amber-500/50" : "bg-amber-400",
                                )}
                              />
                            )}
                            {hasPolarization && (
                              <div
                                className={cn(
                                  "absolute top-6 left-full w-4 h-0.5 ml-0",
                                  theme === "dark" ? "bg-cyan-500/50" : "bg-cyan-400",
                                )}
                              />
                            )}
                          </div>

                          {/* Right side - Polarization (can have multiple events) */}
                          <div className="flex-1 pl-4 flex justify-start">
                            {hasPolarization && (
                              <div className="w-full max-w-md space-y-3">
                                {polarizationEvents.map((polarizationEvent) => {
                                  const polarizationIndex = filteredEvents.findIndex(
                                    (e) => e === polarizationEvent,
                                  );
                                  return (
                                    <DualTrackCard
                                      key={polarizationEvent.titleEn}
                                      event={polarizationEvent}
                                      eventIndex={polarizationIndex}
                                      isExpanded={expandedEvent === polarizationIndex}
                                      onToggle={() =>
                                        setExpandedEvent(
                                          expandedEvent === polarizationIndex
                                            ? null
                                            : polarizationIndex,
                                        )
                                      }
                                      onReadStory={() => handleOpenStory(polarizationIndex)}
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
                    });
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Story Modal */}
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
