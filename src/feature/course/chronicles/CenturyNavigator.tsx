/**
 * CenturyNavigator - 世纪导航组件
 * 在时间线右侧提供快速跳转到不同世纪的导航条
 */

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/utils/classNames'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { TimelineEvent } from '@/data/timeline-events'

interface CenturyNavigatorProps {
  events: TimelineEvent[]
  isZh: boolean
  className?: string
}

export function CenturyNavigator({ events, isZh, className }: CenturyNavigatorProps) {
  const { theme } = useTheme()
  const [activeCentury, setActiveCentury] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate centuries from events
  const centuries = useMemo(() => {
    const centurySet = new Set<number>()
    events.forEach(e => {
      const century = Math.floor(e.year / 100) + 1
      centurySet.add(century)
    })
    return Array.from(centurySet).sort((a, b) => a - b)
  }, [events])

  // Count events per century
  const centuryCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    events.forEach(e => {
      const century = Math.floor(e.year / 100) + 1
      counts[century] = (counts[century] || 0) + 1
    })
    return counts
  }, [events])

  // Track scroll position to highlight active century
  useEffect(() => {
    const handleScroll = () => {
      // Find the first year element that's visible in the viewport
      for (const century of centuries) {
        const startYear = (century - 1) * 100
        const endYear = century * 100 - 1

        // Look for year markers in this century
        for (let year = startYear; year <= endYear; year++) {
          const element = document.getElementById(`timeline-year-${year}`)
          if (element) {
            const rect = element.getBoundingClientRect()
            if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
              setActiveCentury(century)
              return
            }
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check
    return () => window.removeEventListener('scroll', handleScroll)
  }, [centuries])

  const scrollToCentury = (century: number) => {
    // Find the first event in this century
    const firstEvent = events.find(e => Math.floor(e.year / 100) + 1 === century)
    if (firstEvent) {
      const element = document.getElementById(`timeline-year-${firstEvent.year}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const getCenturyLabel = (century: number) => {
    if (isZh) {
      return `${century}世纪`
    }
    const suffix = century === 1 ? 'st' : century === 2 ? 'nd' : century === 3 ? 'rd' : 'th'
    return `${century}${suffix}`
  }

  const getYearRange = (century: number) => {
    const start = (century - 1) * 100 + 1
    const end = century * 100
    return `${start}-${end}`
  }

  return (
    <div className={cn(
      'fixed right-4 top-1/2 -translate-y-1/2 z-30',
      'flex flex-col items-end gap-1',
      className
    )}>
      {/* Toggle button for mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'md:hidden p-2 rounded-full shadow-lg transition-all',
          theme === 'dark'
            ? 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        )}
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {/* Navigator bar */}
      <div className={cn(
        'flex flex-col gap-1 transition-all duration-300',
        'md:opacity-100 md:translate-x-0',
        isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full md:opacity-100 md:translate-x-0',
        'pointer-events-auto'
      )}>
        {centuries.map(century => (
          <button
            key={century}
            onClick={() => scrollToCentury(century)}
            className={cn(
              'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              'shadow-sm hover:shadow-md',
              activeCentury === century
                ? theme === 'dark'
                  ? 'bg-gradient-to-r from-amber-500/30 to-cyan-500/30 text-white border border-amber-500/50'
                  : 'bg-gradient-to-r from-amber-100 to-cyan-100 text-gray-900 border border-amber-300'
                : theme === 'dark'
                  ? 'bg-slate-800/90 text-gray-400 hover:text-white hover:bg-slate-700'
                  : 'bg-white/90 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            {/* Century label */}
            <span className="font-mono">{getCenturyLabel(century)}</span>

            {/* Event count indicator */}
            <span className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[10px]',
              activeCentury === century
                ? theme === 'dark'
                  ? 'bg-amber-500/50 text-amber-200'
                  : 'bg-amber-200 text-amber-800'
                : theme === 'dark'
                  ? 'bg-slate-700 text-gray-500'
                  : 'bg-gray-100 text-gray-500'
            )}>
              {centuryCounts[century]}
            </span>

            {/* Tooltip with year range */}
            <div className={cn(
              'absolute right-full mr-2 px-2 py-1 rounded text-xs whitespace-nowrap',
              'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
              theme === 'dark'
                ? 'bg-slate-900 text-gray-300'
                : 'bg-gray-900 text-white'
            )}>
              {getYearRange(century)}
            </div>
          </button>
        ))}
      </div>

      {/* Progress indicator line */}
      <div className={cn(
        'hidden md:block absolute left-0 top-0 bottom-0 w-0.5 rounded-full -translate-x-3',
        theme === 'dark'
          ? 'bg-gradient-to-b from-amber-500/30 via-gray-500/30 to-cyan-500/30'
          : 'bg-gradient-to-b from-amber-300 via-gray-300 to-cyan-300'
      )}>
        {/* Active indicator */}
        {activeCentury && (
          <div
            className={cn(
              'absolute w-2 h-2 rounded-full -translate-x-[3px] transition-all duration-300',
              theme === 'dark' ? 'bg-amber-400' : 'bg-amber-500'
            )}
            style={{
              top: `${(centuries.indexOf(activeCentury) / (centuries.length - 1)) * 100}%`,
            }}
          />
        )}
      </div>
    </div>
  )
}
