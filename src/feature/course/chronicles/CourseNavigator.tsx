/**
 * CourseNavigator - P-SRT课程大纲导航组件 (重构版 v3)
 *
 * 设计原则：
 * 1. 以P-SRT课程大纲为导航结构：单元 → 章节 → 关联事件
 * 2. 优选设计：点击课程章节自动筛选时间线事件
 * 3. 次选设计：展开查看关联历史事件列表
 * 4. 双向交互：点击时间线事件高亮相关课程模块
 */

import { useState, useCallback } from 'react'
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
  GraduationCap,
  History,
  X,
  FlaskConical,
  Play,
  Lightbulb,
  Zap,
  Sparkles,
  Target,
  Telescope,
  Star,
  Sun,
  ExternalLink,
  Filter
} from 'lucide-react'

// Import P-SRT curriculum data
import {
  PSRT_CURRICULUM,
  PSRT_EVENT_MAPPINGS,
  getDifficultyColor,
  getDifficultyIcon
} from '@/data/psrt-curriculum'
import { TIMELINE_EVENTS } from '@/data/timeline-events'

// Unit icon mapping
import type { LucideIcon } from 'lucide-react'
const UNIT_ICONS: Record<string, LucideIcon> = {
  'unit1': Lightbulb,
  'unit2': Zap,
  'unit3': Sparkles,
  'unit4': Target,
  'unit5': Telescope
}

interface CourseNavigatorProps {
  className?: string
  selectedSections: string[]  // Selected section IDs for filtering
  onFilterChange: (selectedSections: string[]) => void
  highlightedSections?: Set<string>  // Sections highlighted from timeline event click
  onEventClick?: (year: number, track: 'optics' | 'polarization') => void  // Callback to scroll to event
}

export function CourseNavigator({
  className,
  selectedSections,
  onFilterChange,
  highlightedSections,
  onEventClick
}: CourseNavigatorProps) {
  const { theme } = useTheme()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const isZh = true

  // State management
  const [isExpanded, setIsExpanded] = useState(false)          // Mobile expand/collapse
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set(['unit1'])) // Expanded units
  const [expandedSection, setExpandedSection] = useState<string | null>(null)  // Currently expanded section showing events

  // Selected sections count
  const hasFilter = selectedSections.length > 0
  const filterCount = selectedSections.length

  // Get events for a section
  const getEventsForSection = useCallback((sectionId: string) => {
    const section = PSRT_CURRICULUM
      .flatMap(unit => unit.sections)
      .find(s => s.id === sectionId)

    if (!section) return []

    return section.relatedEvents.map(ref => {
      const event = TIMELINE_EVENTS.find(
        e => e.year === ref.year && e.track === ref.track && !e.hidden
      )
      return event ? { ...ref, event } : null
    }).filter((e): e is NonNullable<typeof e> => e !== null)
  }, [])

  // Get event count for a section
  const getEventCountForSection = useCallback((sectionId: string) => {
    const section = PSRT_CURRICULUM
      .flatMap(unit => unit.sections)
      .find(s => s.id === sectionId)
    return section?.relatedEvents.length || 0
  }, [])

  // Toggle unit expand/collapse
  const toggleUnit = useCallback((unitId: string) => {
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

  // Toggle section selection for filtering (优选设计)
  const toggleSectionFilter = useCallback((sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = selectedSections.includes(sectionId)
      ? selectedSections.filter(id => id !== sectionId)
      : [...selectedSections, sectionId]
    onFilterChange(newSelected)
  }, [selectedSections, onFilterChange])

  // Toggle section expand to show events (次选设计)
  const toggleSectionExpand = useCallback((sectionId: string) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId)
  }, [])

  // Clear all filters
  const clearFilter = useCallback(() => {
    onFilterChange([])
  }, [onFilterChange])

  // Check if section is highlighted from event click
  const isSectionHighlighted = useCallback((sectionId: string) => {
    return highlightedSections?.has(sectionId) ?? false
  }, [highlightedSections])


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
        {/* Header: Title and controls */}
        <div className={cn(
          'flex items-center justify-between gap-2 mb-2 px-2 py-1.5 rounded-lg',
          theme === 'dark' ? 'bg-slate-800/90' : 'bg-white/90',
          'shadow-sm backdrop-blur-sm'
        )}>
          <div className="flex items-center gap-1.5">
            <GraduationCap className={cn(
              'w-4 h-4',
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            )} />
            <span className={cn(
              'text-xs font-semibold',
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            )}>
              {isZh ? 'P-SRT课程大纲' : 'P-SRT Outline'}
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

        {/* Highlighted from event indicator */}
        <AnimatePresence>
          {highlightedSections && highlightedSections.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                'mb-2 px-2 py-1.5 rounded-md text-xs',
                theme === 'dark' ? 'bg-cyan-900/30 text-cyan-300' : 'bg-cyan-50 text-cyan-700'
              )}
            >
              <div className="flex items-center gap-1.5">
                <History className="w-3 h-3" />
                <span>
                  {isZh
                    ? `事件关联 ${highlightedSections.size} 个章节`
                    : `${highlightedSections.size} section${highlightedSections.size > 1 ? 's' : ''} related to event`
                  }
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter status indicator */}
        <AnimatePresence>
          {hasFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                'mb-2 px-2 py-1.5 rounded-md text-xs',
                theme === 'dark' ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'
              )}
            >
              <div className="flex items-center gap-1.5">
                <Filter className="w-3 h-3" />
                <span>
                  {isZh
                    ? `筛选 ${filterCount} 个章节的事件`
                    : `Filtering events for ${filterCount} section${filterCount > 1 ? 's' : ''}`
                  }
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* P-SRT Course unit list */}
        <div className={cn(
          'flex flex-col gap-1 max-h-[60vh] overflow-y-auto pr-1',
          'scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent'
        )}>
          {PSRT_CURRICULUM.map((unit) => {
            const UnitIcon = UNIT_ICONS[unit.id] || FlaskConical
            const isUnitExpanded = expandedUnits.has(unit.id)
            const unitEventCount = PSRT_EVENT_MAPPINGS.filter(m => m.unitId === unit.id).length

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
                    <UnitIcon className="w-3 h-3" color={unit.color} />
                  </div>

                  {/* Unit title */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-[11px]">
                      {isZh ? `${unit.unitNumber}. ${unit.titleZh}` : `${unit.unitNumber}. ${unit.titleEn}`}
                    </div>
                    <div className={cn(
                      'text-[10px]',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      {unit.sections.length} {isZh ? '章节' : 'sections'} · {unitEventCount} {isZh ? '事件' : 'events'}
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

                {/* Section list */}
                <AnimatePresence>
                  {isUnitExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={cn(
                        'ml-3 mt-1 pl-2 border-l-2 space-y-0.5',
                      )}
                      style={{ borderColor: `${unit.color}40` }}
                      >
                        {unit.sections.map((section) => {
                          const isSelected = selectedSections.includes(section.id)
                          const eventCount = getEventCountForSection(section.id)
                          const isHighlighted = isSectionHighlighted(section.id)
                          const isSectionExpanded = expandedSection === section.id
                          const events = isSectionExpanded ? getEventsForSection(section.id) : []
                          const difficultyColor = getDifficultyColor(section.difficulty)

                          return (
                            <div key={section.id} className="relative">
                              {/* Section row */}
                              <div
                                className={cn(
                                  'group flex items-center gap-1.5 px-1.5 py-1.5 rounded text-[11px] transition-all cursor-pointer',
                                  isHighlighted
                                    ? theme === 'dark'
                                      ? 'bg-cyan-900/40 text-cyan-300 ring-1 ring-cyan-500/50'
                                      : 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-300'
                                    : isSelected
                                      ? theme === 'dark'
                                        ? 'bg-blue-900/30 text-blue-300'
                                        : 'bg-blue-50 text-blue-700'
                                      : theme === 'dark'
                                        ? 'hover:bg-slate-700/50 text-gray-400'
                                        : 'hover:bg-gray-100 text-gray-600'
                                )}
                                onClick={() => toggleSectionExpand(section.id)}
                              >
                                {/* Section number badge */}
                                <span
                                  className="flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${unit.color}20`,
                                    color: unit.color
                                  }}
                                >
                                  {section.id}
                                </span>

                                {/* Section title */}
                                <span className="flex-1 truncate">
                                  {isZh ? section.titleZh : section.titleEn}
                                </span>

                                {/* Difficulty badge */}
                                <span
                                  className="flex-shrink-0 text-[8px] px-1 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${difficultyColor}20`,
                                    color: difficultyColor
                                  }}
                                  title={getDifficultyIcon(section.difficulty)}
                                >
                                  {getDifficultyIcon(section.difficulty)}
                                </span>

                                {/* Event count badge */}
                                {eventCount > 0 && (
                                  <span className={cn(
                                    'flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-medium flex items-center gap-0.5',
                                    isSectionExpanded
                                      ? theme === 'dark'
                                        ? 'bg-amber-500/30 text-amber-300'
                                        : 'bg-amber-100 text-amber-700'
                                      : theme === 'dark'
                                        ? 'bg-slate-700 text-gray-400'
                                        : 'bg-gray-100 text-gray-500'
                                  )}>
                                    <History className="w-2.5 h-2.5" />
                                    {eventCount}
                                  </span>
                                )}

                                {/* Filter toggle (优选设计) */}
                                <button
                                  onClick={(e) => toggleSectionFilter(section.id, e)}
                                  className={cn(
                                    'flex-shrink-0 p-0.5 rounded transition-all',
                                    isSelected
                                      ? theme === 'dark'
                                        ? 'text-blue-400 bg-blue-500/20'
                                        : 'text-blue-600 bg-blue-100'
                                      : 'opacity-0 group-hover:opacity-100',
                                    theme === 'dark' ? 'hover:bg-slate-600' : 'hover:bg-gray-200'
                                  )}
                                  title={isZh ? '筛选此章节的事件' : 'Filter events for this section'}
                                >
                                  <Filter className="w-3 h-3" />
                                </button>

                                {/* Expand indicator */}
                                {eventCount > 0 && (
                                  <span className="flex-shrink-0">
                                    {isSectionExpanded ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Expanded event list (次选设计) */}
                              <AnimatePresence>
                                {isSectionExpanded && events.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className={cn(
                                      'ml-2 mt-1 p-2 rounded-lg space-y-1.5',
                                      theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-50'
                                    )}>
                                      {/* Event list header */}
                                      <div className={cn(
                                        'text-[10px] font-medium flex items-center gap-1 mb-1',
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                      )}>
                                        <History className="w-3 h-3" />
                                        {isZh ? '关联历史事件' : 'Related Historical Events'}
                                      </div>

                                      {/* Event items */}
                                      {events.map((eventData) => (
                                        <button
                                          key={`${eventData.year}-${eventData.track}`}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            onEventClick?.(eventData.year, eventData.track)
                                          }}
                                          className={cn(
                                            'w-full flex items-start gap-1.5 p-1.5 rounded-md text-left transition-all',
                                            theme === 'dark'
                                              ? 'hover:bg-slate-700/50'
                                              : 'hover:bg-white'
                                          )}
                                        >
                                          {/* Track indicator */}
                                          <div className={cn(
                                            'flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5',
                                            eventData.track === 'optics'
                                              ? theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'
                                              : theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-100'
                                          )}>
                                            {eventData.track === 'optics'
                                              ? <Sun className="w-2.5 h-2.5 text-amber-500" />
                                              : <Sparkles className="w-2.5 h-2.5 text-cyan-500" />
                                            }
                                          </div>

                                          {/* Event info */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                              <span className={cn(
                                                'font-mono text-[10px]',
                                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                              )}>
                                                {eventData.year}
                                              </span>
                                              {eventData.relevance === 'primary' && (
                                                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                              )}
                                            </div>
                                            <div className={cn(
                                              'text-[10px] truncate',
                                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                            )}>
                                              {isZh ? eventData.event.titleZh : eventData.event.titleEn}
                                            </div>
                                          </div>

                                          {/* Arrow */}
                                          <ExternalLink className={cn(
                                            'w-3 h-3 flex-shrink-0',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                          )} />
                                        </button>
                                      ))}

                                      {/* Quick filter button for this section */}
                                      <button
                                        onClick={(e) => toggleSectionFilter(section.id, e)}
                                        className={cn(
                                          'w-full flex items-center justify-center gap-1.5 mt-2 py-1.5 rounded-md text-[10px] font-medium transition-colors',
                                          isSelected
                                            ? theme === 'dark'
                                              ? 'bg-blue-500/30 text-blue-300 hover:bg-blue-500/40'
                                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                            : theme === 'dark'
                                              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        )}
                                      >
                                        <Filter className="w-3 h-3" />
                                        {isSelected
                                          ? (isZh ? '取消筛选' : 'Remove Filter')
                                          : (isZh ? '筛选时间线' : 'Filter Timeline')
                                        }
                                      </button>
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

        {/* Bottom: Start learning button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3"
        >
          <button
            onClick={() => navigate('/course')}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium',
              'transition-all hover:scale-105',
              theme === 'dark'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-400 hover:to-indigo-400'
            )}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isZh ? '进入完整课程' : 'Full Course'}</span>
          </button>
        </motion.div>
      </div>
    </div>
  )
}
