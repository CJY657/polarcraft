/**
 * DemoNavigator - 光学演示馆导航组件 (Enhanced Version)
 *
 * 设计原则：
 * 1. 以光学演示馆的内容结构作为导航逻辑
 * 2. 按单元组织演示项目 (Unit 0-5)
 * 3. 点击演示项目可以筛选关联的时间线事件
 * 4. 提供直达演示页面的链接
 * 5. 显示每个演示关联的历史事件年份
 * 6. 鼠标悬停时显示事件预览
 */

import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/utils/classNames'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Atom,
  Play,
  Lightbulb,
  Zap,
  Sparkles,
  Target,
  Telescope,
  Waves,
  ExternalLink,
  Filter,
  X,
  Clock,
  Sun,
  Star,
  BookOpen,
  FlaskConical,
  Eye,
  ArrowRight
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

// Import centralized mapping data
import { getEventMappingsByDemo, COURSE_DEMOS, type CourseDemo } from '@/data/course-event-mapping'
import { TIMELINE_EVENTS } from '@/data/timeline-events'

// Get demo info from centralized data
function getDemoInfo(demoId: string): CourseDemo | undefined {
  return COURSE_DEMOS.find(d => d.id === demoId)
}

// Demo data structure matching DemosPage
interface DemoItem {
  id: string
  titleKey: string
  unit: number
  descriptionKey: string
  visualType: '2D' | '3D'
  difficulty: 'foundation' | 'application' | 'research'
  relatedEvents?: { year: number; track: 'optics' | 'polarization' }[]
}

// Extended event info for preview
interface RelatedEventInfo {
  year: number
  track: 'optics' | 'polarization'
  titleEn: string
  titleZh: string
  relevance: 'primary' | 'secondary'
  scientistEn?: string
  scientistZh?: string
}

// Unit configuration
interface UnitConfig {
  id: number
  titleEn: string
  titleZh: string
  icon: LucideIcon
  color: string
}

const UNITS: UnitConfig[] = [
  { id: 0, titleEn: 'Optical Basics', titleZh: '光学基础', icon: Waves, color: '#6366f1' },
  { id: 1, titleEn: 'Polarization States', titleZh: '偏振态', icon: Lightbulb, color: '#f59e0b' },
  { id: 2, titleEn: 'Interface Reflection', titleZh: '界面反射', icon: Zap, color: '#10b981' },
  { id: 3, titleEn: 'Transparent Media', titleZh: '透明介质', icon: Sparkles, color: '#ec4899' },
  { id: 4, titleEn: 'Scattering', titleZh: '散射', icon: Target, color: '#8b5cf6' },
  { id: 5, titleEn: 'Full Polarimetry', titleZh: '全偏振', icon: Telescope, color: '#0ea5e9' },
]

/**
 * Get detailed related events for a demo using centralized mapping
 */
function getRelatedEventsForDemo(demoId: string): RelatedEventInfo[] {
  const mappings = getEventMappingsByDemo(demoId)
  const results: RelatedEventInfo[] = []

  for (const mapping of mappings) {
    const event = TIMELINE_EVENTS.find(
      e => e.year === mapping.eventYear && e.track === mapping.eventTrack && !e.hidden
    )
    if (event) {
      results.push({
        year: event.year,
        track: event.track,
        titleEn: event.titleEn,
        titleZh: event.titleZh,
        relevance: mapping.relevance,
        scientistEn: event.scientistEn,
        scientistZh: event.scientistZh
      })
    }
  }

  return results.sort((a, b) => a.year - b.year)
}

/**
 * Build demo list dynamically from centralized data
 * This ensures consistency with COURSE_EVENT_MAPPINGS
 */
/**
 * Convert hyphenated string to camelCase
 * e.g., 'light-wave' -> 'lightWave', 'polarization-intro' -> 'polarizationIntro'
 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function buildDemoList(): DemoItem[] {
  return COURSE_DEMOS.map(demo => {
    const mappings = getEventMappingsByDemo(demo.id)
    const relatedEvents = mappings.map(m => ({
      year: m.eventYear,
      track: m.eventTrack
    }))

    // Map to titleKey format - convert hyphenated IDs to camelCase for translation keys
    const camelCaseId = toCamelCase(demo.id)
    const titleKey = demo.unit === 0
      ? `basics.demos.${camelCaseId}.title`
      : `demos.${camelCaseId}.title`

    const descriptionKey = demo.unit === 0
      ? `basics.demos.${camelCaseId}.description`
      : `demos.${camelCaseId}.description`

    return {
      id: demo.id,
      titleKey,
      unit: demo.unit,
      descriptionKey,
      visualType: getVisualType(demo.id),
      difficulty: demo.difficulty,
      relatedEvents: relatedEvents.length > 0 ? relatedEvents : undefined
    }
  })
}

// Helper to determine visual type
function getVisualType(demoId: string): '2D' | '3D' {
  const demos3D = ['polarization-state', 'birefringence', 'waveplate', 'stokes']
  return demos3D.includes(demoId) ? '3D' : '2D'
}

// Demo list - built from centralized data
const DEMOS: DemoItem[] = buildDemoList()

// Difficulty configuration
const DIFFICULTY_CONFIG = {
  foundation: { emoji: '🌱', color: '#22c55e' },
  application: { emoji: '🔬', color: '#3b82f6' },
  research: { emoji: '🚀', color: '#a855f7' },
}

interface DemoNavigatorProps {
  className?: string
  selectedDemos: string[]  // Selected demo IDs for filtering
  onFilterChange: (selectedDemos: string[]) => void
  highlightedDemos?: Set<string>  // Demos highlighted from timeline event click
  onEventClick?: (year: number, track: 'optics' | 'polarization') => void  // Callback to scroll to event
}

export function DemoNavigator({
  className,
  selectedDemos,
  onFilterChange,
  highlightedDemos,
  onEventClick
}: DemoNavigatorProps) {
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isZh = true

  // State management
  const [isExpanded, setIsExpanded] = useState(false)  // Mobile expand/collapse
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set([0, 1]))  // Expanded units
  const [hoveredDemo, setHoveredDemo] = useState<string | null>(null)  // Demo with preview visible

  // Cache related events for all demos
  const demoRelatedEvents = useMemo(() => {
    const cache = new Map<string, RelatedEventInfo[]>()
    DEMOS.forEach(demo => {
      cache.set(demo.id, getRelatedEventsForDemo(demo.id))
    })
    return cache
  }, [])

  // Selected demos count
  const hasFilter = selectedDemos.length > 0
  const filterCount = selectedDemos.length

  // Get demos for a unit
  const getDemosForUnit = useCallback((unitId: number) => {
    return DEMOS.filter(d => d.unit === unitId)
  }, [])

  // Toggle unit expand/collapse
  const toggleUnit = useCallback((unitId: number) => {
    setExpandedUnits(prev => {
      const next = new Set(prev)
      if (next.has(unitId)) {
        next.delete(unitId)
      } else {
        next.add(unitId)
      }
      return next
    })
  }, [])

  // Toggle demo selection for filtering
  const toggleDemoFilter = useCallback((demoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = selectedDemos.includes(demoId)
      ? selectedDemos.filter(id => id !== demoId)
      : [...selectedDemos, demoId]
    onFilterChange(newSelected)
  }, [selectedDemos, onFilterChange])

  // Clear all filters
  const clearFilter = useCallback(() => {
    onFilterChange([])
  }, [onFilterChange])

  // Check if demo is highlighted
  const isDemoHighlighted = useCallback((demoId: string) => {
    return highlightedDemos?.has(demoId) ?? false
  }, [highlightedDemos])

  // Navigate to demo page
  const goToDemo = useCallback((demoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/demos/${demoId}`)
  }, [navigate])

  return (
    <div className={cn(
      'fixed left-4 top-1/2 -translate-y-1/2 z-30',
      'flex flex-col items-start gap-1',
      className
    )}>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'md:hidden p-2 rounded-full shadow-lg transition-all mb-2',
          theme === 'dark'
            ? 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        )}
      >
        {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Main container */}
      <div className={cn(
        'transition-all duration-300',
        'md:opacity-100 md:translate-x-0',
        isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full md:opacity-100 md:translate-x-0',
        'pointer-events-auto'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between gap-2 mb-2 px-2 py-1.5 rounded-lg',
          theme === 'dark' ? 'bg-slate-800/90' : 'bg-white/90',
          'shadow-sm backdrop-blur-sm'
        )}>
          <div className="flex items-center gap-1.5">
            <Atom className={cn(
              'w-4 h-4',
              theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
            )} />
            <span className={cn(
              'text-xs font-semibold',
              theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
            )}>
              {isZh ? '光学演示馆' : 'Optical Demos'}
            </span>
          </div>

          {/* Clear filter button */}
          {hasFilter && (
            <button
              onClick={clearFilter}
              className={cn(
                'p-1.5 rounded-md transition-all flex items-center gap-1',
                theme === 'dark'
                  ? 'text-red-400 hover:bg-red-900/30'
                  : 'text-red-500 hover:bg-red-50'
              )}
              title={isZh ? '清除筛选' : 'Clear filter'}
            >
              <X className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">{filterCount}</span>
            </button>
          )}
        </div>

        {/* Filter status indicator */}
        <AnimatePresence>
          {hasFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                'mb-2 px-2 py-1.5 rounded-md text-xs',
                theme === 'dark' ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
              )}
            >
              <div className="flex items-center gap-1.5">
                <Filter className="w-3 h-3" />
                <span>
                  {isZh
                    ? `筛选 ${filterCount} 个演示的事件`
                    : `Filtering events for ${filterCount} demo${filterCount > 1 ? 's' : ''}`
                  }
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unit list */}
        <div className={cn(
          'flex flex-col gap-1 max-h-[60vh] overflow-y-auto pr-1',
          'scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent'
        )}>
          {UNITS.map((unit) => {
            const UnitIcon = unit.icon
            const isUnitExpanded = expandedUnits.has(unit.id)
            const demos = getDemosForUnit(unit.id)

            return (
              <div key={unit.id} className="relative">
                {/* Unit header row */}
                <div
                  className={cn(
                    'group flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer',
                    'shadow-sm hover:shadow-md',
                    theme === 'dark'
                      ? 'bg-slate-800/90 text-gray-300 hover:bg-slate-700'
                      : 'bg-white/90 text-gray-700 hover:bg-gray-50'
                  )}
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: unit.color
                  }}
                  onClick={() => toggleUnit(unit.id)}
                >
                  {/* Unit icon */}
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${unit.color}20` }}
                  >
                    <UnitIcon className="w-3 h-3" style={{ color: unit.color }} />
                  </div>

                  {/* Unit title */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-[11px]">
                      {isZh ? `${unit.id}. ${unit.titleZh}` : `${unit.id}. ${unit.titleEn}`}
                    </div>
                    <div className={cn(
                      'text-[10px]',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      {demos.length} {isZh ? '演示' : 'demos'}
                    </div>
                  </div>

                  {/* Expand/collapse button */}
                  <button
                    className={cn(
                      'flex-shrink-0 p-0.5 rounded transition-colors',
                      theme === 'dark' ? 'hover:bg-slate-600' : 'hover:bg-gray-200'
                    )}
                  >
                    {isUnitExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Demo list */}
                <AnimatePresence>
                  {isUnitExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div
                        className={cn('ml-3 mt-1 pl-2 border-l-2 space-y-0.5')}
                        style={{ borderColor: `${unit.color}40` }}
                      >
                        {demos.map((demo) => {
                          const isSelected = selectedDemos.includes(demo.id)
                          const isHighlighted = isDemoHighlighted(demo.id)
                          const diffConfig = DIFFICULTY_CONFIG[demo.difficulty]
                          const relatedEvents = demoRelatedEvents.get(demo.id) || []
                          const hasEvents = relatedEvents.length > 0
                          const isHovered = hoveredDemo === demo.id
                          const primaryEvents = relatedEvents.filter(e => e.relevance === 'primary')

                          return (
                            <div
                              key={demo.id}
                              className="relative"
                              onMouseEnter={() => setHoveredDemo(demo.id)}
                              onMouseLeave={() => setHoveredDemo(null)}
                            >
                              {/* Main demo item */}
                              <div
                                className={cn(
                                  'group flex flex-col gap-1 px-1.5 py-1.5 rounded text-[11px] transition-all cursor-pointer',
                                  isHighlighted
                                    ? theme === 'dark'
                                      ? 'bg-cyan-900/40 text-cyan-300 ring-1 ring-cyan-500/50'
                                      : 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-300'
                                    : isSelected
                                      ? theme === 'dark'
                                        ? 'bg-indigo-900/30 text-indigo-300'
                                        : 'bg-indigo-50 text-indigo-700'
                                      : theme === 'dark'
                                        ? 'hover:bg-slate-700/50 text-gray-400'
                                        : 'hover:bg-gray-100 text-gray-600'
                                )}
                                onClick={(e) => {
                                  if (hasEvents) {
                                    toggleDemoFilter(demo.id, e)
                                  }
                                }}
                              >
                                {/* Top row: badges and title */}
                                <div className="flex items-center gap-1.5">
                                  {/* Difficulty badge */}
                                  <span
                                    className="flex-shrink-0 text-[9px] px-1 py-0.5 rounded"
                                    style={{
                                      backgroundColor: `${diffConfig.color}20`,
                                    }}
                                    title={demo.difficulty}
                                  >
                                    {diffConfig.emoji}
                                  </span>

                                  {/* Demo title */}
                                  <span className="flex-1 truncate font-medium">
                                    {t(demo.titleKey)}
                                  </span>

                                  {/* Visual type badge */}
                                  <span className={cn(
                                    'flex-shrink-0 px-1 py-0.5 rounded text-[8px] font-medium',
                                    demo.visualType === '3D'
                                      ? theme === 'dark'
                                        ? 'bg-purple-500/20 text-purple-300'
                                        : 'bg-purple-100 text-purple-600'
                                      : theme === 'dark'
                                        ? 'bg-cyan-500/20 text-cyan-300'
                                        : 'bg-cyan-100 text-cyan-600'
                                  )}>
                                    {demo.visualType}
                                  </span>

                                  {/* Event count badge */}
                                  {hasEvents && (
                                    <span className={cn(
                                      'flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium',
                                      isSelected
                                        ? theme === 'dark'
                                          ? 'bg-indigo-500/30 text-indigo-300'
                                          : 'bg-indigo-100 text-indigo-600'
                                        : theme === 'dark'
                                          ? 'bg-amber-500/20 text-amber-400'
                                          : 'bg-amber-100 text-amber-700'
                                    )}>
                                      <Clock className="w-2.5 h-2.5" />
                                      {relatedEvents.length}
                                    </span>
                                  )}

                                  {/* Go to demo button */}
                                  <button
                                    onClick={(e) => goToDemo(demo.id, e)}
                                    className={cn(
                                      'flex-shrink-0 p-0.5 rounded transition-all opacity-0 group-hover:opacity-100',
                                      theme === 'dark' ? 'hover:bg-slate-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                                    )}
                                    title={isZh ? '前往演示' : 'Go to demo'}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Bottom row: related event years (always visible for demos with events) */}
                                {hasEvents && (
                                  <div className="flex flex-wrap items-center gap-1 mt-0.5 pl-5">
                                    {primaryEvents.slice(0, 3).map((event) => (
                                      <button
                                        key={`${event.year}-${event.track}`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (onEventClick) {
                                            onEventClick(event.year, event.track)
                                          }
                                        }}
                                        className={cn(
                                          'inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono transition-all',
                                          event.track === 'optics'
                                            ? theme === 'dark'
                                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                            : theme === 'dark'
                                              ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                                              : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                                        )}
                                        title={isZh ? `跳转到 ${event.year} 年 - ${event.titleZh}` : `Jump to ${event.year} - ${event.titleEn}`}
                                      >
                                        {event.track === 'optics' ? (
                                          <Sun className="w-2 h-2" />
                                        ) : (
                                          <Sparkles className="w-2 h-2" />
                                        )}
                                        {event.year}
                                        {event.relevance === 'primary' && (
                                          <Star className="w-2 h-2 fill-current" />
                                        )}
                                      </button>
                                    ))}
                                    {relatedEvents.length > 3 && (
                                      <span className={cn(
                                        'text-[9px]',
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                      )}>
                                        +{relatedEvents.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Enhanced preview popover with demo info and events */}
                              <AnimatePresence>
                                {isHovered && (
                                  <motion.div
                                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className={cn(
                                      'absolute left-full top-0 ml-2 z-50 w-72 rounded-xl shadow-xl border overflow-hidden',
                                      theme === 'dark'
                                        ? 'bg-slate-800 border-slate-700'
                                        : 'bg-white border-gray-200'
                                    )}
                                  >
                                    {/* Demo header with gradient */}
                                    <div
                                      className="px-3 py-2"
                                      style={{
                                        background: `linear-gradient(135deg, ${unit.color}20 0%, ${unit.color}10 100%)`
                                      }}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className={cn(
                                          'text-xs font-bold',
                                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )}>
                                          {getDemoInfo(demo.id)
                                            ? (isZh ? getDemoInfo(demo.id)?.titleZh : getDemoInfo(demo.id)?.titleEn)
                                            : t(demo.titleKey)
                                          }
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px]" title={demo.difficulty}>
                                            {diffConfig.emoji}
                                          </span>
                                          <span className={cn(
                                            'px-1 py-0.5 rounded text-[8px] font-medium',
                                            demo.visualType === '3D'
                                              ? 'bg-purple-500/20 text-purple-400'
                                              : 'bg-cyan-500/20 text-cyan-400'
                                          )}>
                                            {demo.visualType}
                                          </span>
                                        </div>
                                      </div>
                                      {/* Demo description preview */}
                                      <p className={cn(
                                        'text-[10px] line-clamp-2',
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                      )}>
                                        {t(demo.descriptionKey)}
                                      </p>
                                    </div>

                                    {/* Quick action buttons */}
                                    <div className={cn(
                                      'px-3 py-2 flex gap-1.5 border-b',
                                      theme === 'dark' ? 'border-slate-700' : 'border-gray-100'
                                    )}>
                                      <button
                                        onClick={(e) => goToDemo(demo.id, e)}
                                        className={cn(
                                          'flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all',
                                          theme === 'dark'
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                                            : 'bg-indigo-500 text-white hover:bg-indigo-400'
                                        )}
                                      >
                                        <Eye className="w-3 h-3" />
                                        {isZh ? '查看演示' : 'View Demo'}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          navigate('/optical-studio')
                                        }}
                                        className={cn(
                                          'flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all',
                                          theme === 'dark'
                                            ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        )}
                                        title={isZh ? '在光学工作室中实验' : 'Experiment in Optical Studio'}
                                      >
                                        <FlaskConical className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          // Navigate to P-SRT course for this unit
                                          navigate(`/chronicles`)
                                          // Could set active tab to 'psrt' via state
                                        }}
                                        className={cn(
                                          'flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all',
                                          theme === 'dark'
                                            ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        )}
                                        title={isZh ? '查看课程内容' : 'View Course Content'}
                                      >
                                        <BookOpen className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Related events section */}
                                    {hasEvents && (
                                      <div className="px-3 py-2">
                                        <div className="flex items-center gap-1.5 mb-2">
                                          <Clock className={cn(
                                            'w-3 h-3',
                                            theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                                          )} />
                                          <span className={cn(
                                            'text-[10px] font-semibold',
                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                          )}>
                                            {isZh ? '相关历史事件' : 'Related Events'}
                                          </span>
                                          <span className={cn(
                                            'text-[9px] px-1.5 py-0.5 rounded-full',
                                            theme === 'dark' ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                                          )}>
                                            {relatedEvents.length}
                                          </span>
                                        </div>
                                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                          {relatedEvents.slice(0, 4).map((event) => (
                                            <button
                                              key={`${event.year}-${event.track}`}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                if (onEventClick) {
                                                  onEventClick(event.year, event.track)
                                                }
                                              }}
                                              className={cn(
                                                'w-full text-left p-1.5 rounded-md transition-all flex items-center gap-2',
                                                theme === 'dark'
                                                  ? 'hover:bg-slate-700'
                                                  : 'hover:bg-gray-50'
                                              )}
                                            >
                                              {/* Year badge */}
                                              <span className={cn(
                                                'flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold',
                                                event.track === 'optics'
                                                  ? theme === 'dark'
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-amber-100 text-amber-700'
                                                  : theme === 'dark'
                                                    ? 'bg-cyan-500/20 text-cyan-400'
                                                    : 'bg-cyan-100 text-cyan-700'
                                              )}>
                                                {event.track === 'optics' ? (
                                                  <Sun className="w-2.5 h-2.5" />
                                                ) : (
                                                  <Sparkles className="w-2.5 h-2.5" />
                                                )}
                                                {event.year}
                                              </span>
                                              <span className={cn(
                                                'flex-1 text-[10px] truncate',
                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                              )}>
                                                {isZh ? event.titleZh : event.titleEn}
                                              </span>
                                              {event.relevance === 'primary' && (
                                                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                                              )}
                                            </button>
                                          ))}
                                          {relatedEvents.length > 4 && (
                                            <div className={cn(
                                              'text-[9px] text-center py-1',
                                              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            )}>
                                              +{relatedEvents.length - 4} {isZh ? '更多事件' : 'more events'}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Footer hint */}
                                    <div className={cn(
                                      'px-3 py-1.5 text-[9px] text-center flex items-center justify-center gap-1',
                                      theme === 'dark' ? 'bg-slate-900/50 text-gray-500' : 'bg-gray-50 text-gray-400'
                                    )}>
                                      {hasEvents ? (
                                        <>
                                          <span>{isZh ? '点击筛选时间线' : 'Click to filter timeline'}</span>
                                          <ArrowRight className="w-2.5 h-2.5" />
                                        </>
                                      ) : (
                                        <span>{isZh ? '此演示暂无关联事件' : 'No linked events yet'}</span>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Bottom: Go to demos button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3"
        >
          <button
            onClick={() => navigate('/demos')}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium',
              'transition-all hover:scale-105',
              theme === 'dark'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400'
            )}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isZh ? '进入演示馆' : 'All Demos'}</span>
          </button>
        </motion.div>
      </div>
    </div>
  )
}

// Export demos data for use in other components
export { DEMOS, UNITS }
export type { DemoItem, UnitConfig }
