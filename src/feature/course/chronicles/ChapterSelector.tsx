/**
 * ChapterSelector - P-SRT课程章节选择器 (顶部导航)
 *
 * 设计原则：
 * 1. 放置在时间线顶部，水平排列课程章节
 * 2. 选择不同章节时，切换到对应的历史时间线
 * 3. 显示每个章节关联的历史事件数量
 * 4. 支持多选和清除筛选
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/utils/classNames'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  X,
  Filter,
  Lightbulb,
  Zap,
  Sparkles,
  Target,
  Telescope
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

// Import P-SRT curriculum data
import {
  PSRT_CURRICULUM,
  type CourseUnit,
  type CourseSection
} from '@/data/psrt-curriculum'

// Unit icon mapping
const UNIT_ICONS: Record<string, LucideIcon> = {
  'unit1': Lightbulb,
  'unit2': Zap,
  'unit3': Sparkles,
  'unit4': Target,
  'unit5': Telescope
}

interface ChapterSelectorProps {
  className?: string
  selectedSections: string[]  // Selected section IDs for filtering
  onFilterChange: (selectedSections: string[]) => void
  matchedEventCount?: number  // Number of matched events
}

export function ChapterSelector({
  className,
  selectedSections,
  onFilterChange,
  matchedEventCount = 0
}: ChapterSelectorProps) {
  const { theme } = useTheme()
  const { i18n } = useTranslation()
  const isZh = true

  const hasFilter = selectedSections.length > 0

  // Toggle entire unit selection
  const toggleUnit = useCallback((unit: CourseUnit) => {
    const unitSectionIds = unit.sections.map((s: CourseSection) => s.id)
    const allSelected = unitSectionIds.every((id: string) => selectedSections.includes(id))

    if (allSelected) {
      // Deselect all sections in this unit
      onFilterChange(selectedSections.filter(id => !unitSectionIds.includes(id)))
    } else {
      // Select all sections in this unit
      const newSelected = [...new Set([...selectedSections, ...unitSectionIds])]
      onFilterChange(newSelected)
    }
  }, [selectedSections, onFilterChange])

  // Check if unit is fully or partially selected
  const getUnitSelectionState = useCallback((unit: CourseUnit) => {
    const unitSectionIds = unit.sections.map((s: CourseSection) => s.id)
    const selectedCount = unitSectionIds.filter((id: string) => selectedSections.includes(id)).length

    if (selectedCount === 0) return 'none'
    if (selectedCount === unitSectionIds.length) return 'full'
    return 'partial'
  }, [selectedSections])

  // Get event count for a unit
  const getUnitEventCount = useCallback((unit: CourseUnit) => {
    return unit.sections.reduce((total: number, section: CourseSection) => {
      return total + section.relatedEvents.length
    }, 0)
  }, [])

  // Clear all filters
  const clearFilter = useCallback(() => {
    onFilterChange([])
  }, [onFilterChange])

  return (
    <div className={cn('w-full', className)}>
      {/* Header with title and clear button */}
      <div className={cn(
        'flex items-center justify-between mb-3 px-4 py-2 rounded-lg',
        theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-50'
      )}>
        <div className="flex items-center gap-2">
          <GraduationCap className={cn(
            'w-5 h-5',
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          )} />
          <span className={cn(
            'text-sm font-semibold',
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          )}>
            {isZh ? 'P-SRT 课程时间线' : 'P-SRT Course Timeline'}
          </span>
          <span className={cn(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {isZh ? '(选择章节筛选历史事件)' : '(Select chapters to filter events)'}
          </span>
        </div>

        {/* Filter status and clear button */}
        <AnimatePresence>
          {hasFilter && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2"
            >
              <span className={cn(
                'text-xs px-2 py-1 rounded-full flex items-center gap-1',
                theme === 'dark'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-blue-100 text-blue-700'
              )}>
                <Filter className="w-3 h-3" />
                {matchedEventCount} {isZh ? '个事件' : 'events'}
              </span>
              <button
                onClick={clearFilter}
                className={cn(
                  'px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors',
                  theme === 'dark'
                    ? 'text-red-400 hover:bg-red-900/30'
                    : 'text-red-500 hover:bg-red-50'
                )}
              >
                <X className="w-3 h-3" />
                {isZh ? '清除' : 'Clear'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chapter buttons - horizontal scrollable */}
      <div className={cn(
        'flex gap-2 overflow-x-auto pb-2 px-1',
        'scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent'
      )}>
        {PSRT_CURRICULUM.map((unit) => {
          const UnitIcon = UNIT_ICONS[unit.id] || Lightbulb
          const selectionState = getUnitSelectionState(unit)
          const eventCount = getUnitEventCount(unit)

          return (
            <motion.button
              key={unit.id}
              onClick={() => toggleUnit(unit)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                'border-2',
                selectionState === 'full'
                  ? theme === 'dark'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                    : 'border-blue-500 bg-blue-50 text-blue-700'
                  : selectionState === 'partial'
                    ? theme === 'dark'
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                      : 'border-blue-300 bg-blue-50/50 text-blue-600'
                    : theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-gray-400 hover:border-slate-600 hover:bg-slate-700/50'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              )}
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: selectionState !== 'none' ? unit.color : undefined
              }}
            >
              {/* Unit icon */}
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `${unit.color}20` }}
              >
                <UnitIcon className="w-4 h-4" style={{ color: unit.color }} />
              </div>

              {/* Unit info */}
              <div className="text-left">
                <div className="font-semibold text-xs whitespace-nowrap">
                  {isZh ? `${unit.unitNumber}. ${unit.titleZh}` : `${unit.unitNumber}. ${unit.titleEn}`}
                </div>
                <div className={cn(
                  'text-[10px]',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                  {unit.sections.length} {isZh ? '章节' : 'sections'} · {eventCount} {isZh ? '事件' : 'events'}
                </div>
              </div>

              {/* Selection indicator */}
              {selectionState !== 'none' && (
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  selectionState === 'full' ? 'bg-blue-500' : 'bg-blue-300'
                )} />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Section detail row (shows when unit is selected) */}
      <AnimatePresence>
        {hasFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={cn(
              'flex flex-wrap gap-1.5 mt-2 p-2 rounded-lg',
              theme === 'dark' ? 'bg-slate-800/30' : 'bg-gray-50/50'
            )}>
              {PSRT_CURRICULUM.map((unit) => {
                const isUnitActive = unit.sections.some(s => selectedSections.includes(s.id))
                if (!isUnitActive) return null

                return unit.sections.map((section) => {
                  const isSelected = selectedSections.includes(section.id)
                  if (!isSelected) return null

                  return (
                    <motion.span
                      key={section.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium',
                        theme === 'dark'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-blue-100 text-blue-700'
                      )}
                      style={{
                        borderLeft: `3px solid ${unit.color}`
                      }}
                    >
                      <span>{section.id}</span>
                      <span className="opacity-60">·</span>
                      <span className="truncate max-w-[100px]">
                        {isZh ? section.titleZh : section.titleEn}
                      </span>
                      <span className={cn(
                        'px-1 rounded',
                        theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
                      )}>
                        {section.relatedEvents.length}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onFilterChange(selectedSections.filter(id => id !== section.id))
                        }}
                        className="hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  )
                })
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
