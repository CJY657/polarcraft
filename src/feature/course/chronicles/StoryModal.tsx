/**
 * StoryModal - 故事模态框
 * 展示时间线事件的详细故事和历史背景
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/utils/classNames'
import {
  X, User, MapPin, Lightbulb, Star,
  ChevronLeft, ChevronRight, Calendar, Play, FlaskConical
} from 'lucide-react'
import { Badge } from '@/components/shared'
import { CATEGORY_LABELS, ILLUSTRATION_TO_DEMO_MAP, ILLUSTRATION_TO_BENCH_MAP } from '@/data/chronicles-constants'
import type { TimelineEvent } from '@/data/timeline-events'
import { ResourceGallery } from './ResourceGallery'

export interface StoryModalProps {
  event: TimelineEvent
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
  hasNext: boolean
  hasPrev: boolean
}

export function StoryModal({ event, onClose, onNext, onPrev, hasNext, hasPrev }: StoryModalProps) {
  const { theme } = useTheme()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const isZh = true
  const category = CATEGORY_LABELS[event.category]

  // Get demo and bench links based on illustration type
  const demoLink = event.illustrationType ? ILLUSTRATION_TO_DEMO_MAP[event.illustrationType] : null
  const benchLink = event.illustrationType ? ILLUSTRATION_TO_BENCH_MAP[event.illustrationType] : null

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight' && hasNext && onNext) onNext()
    if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0',
          theme === 'dark' ? 'bg-black/90' : 'bg-black/80'
        )}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={cn(
        'relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl',
        theme === 'dark'
          ? 'bg-slate-900 border-slate-700'
          : 'bg-white border-gray-200'
      )}>
        {/* Header with scene info */}
        <div className={cn(
          'sticky top-0 z-10 px-6 py-4 border-b backdrop-blur-md',
          theme === 'dark'
            ? 'bg-slate-900/90 border-slate-700'
            : 'bg-white/90 border-gray-200'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold font-mono text-amber-500">
                {event.year}
              </span>
              <Badge color={category.color}>
                {isZh ? category.zh : category.en}
              </Badge>
              {event.importance === 1 && (
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              )}
            </div>
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-full transition-colors',
                theme === 'dark'
                  ? 'hover:bg-slate-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scene metadata */}
          {event.scene && (
            <div className={cn(
              'flex items-center gap-4 mt-2 text-xs',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              {event.scene.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.scene.location}
                </span>
              )}
              {event.scene.season && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {event.scene.season}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Story Content */}
        <div className="px-6 py-6">
          <h2 className={cn(
            'text-2xl font-bold mb-2',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {isZh ? event.titleZh : event.titleEn}
          </h2>

          {event.scientistEn && (
            <p className={cn(
              'text-base mb-6 flex items-center gap-2',
              theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
            )}>
              {event.scientistBio?.portraitEmoji && (
                <span className="text-2xl">{event.scientistBio.portraitEmoji}</span>
              )}
              <User className="w-4 h-4" />
              {isZh ? event.scientistZh : event.scientistEn}
              {event.scientistBio?.birthYear && event.scientistBio?.deathYear && (
                <span className={cn(
                  'text-sm',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                  ({event.scientistBio.birthYear} - {event.scientistBio.deathYear})
                </span>
              )}
            </p>
          )}

          {/* The Story */}
          {event.story && (
            <div className={cn(
              'prose prose-lg max-w-none mb-8',
              theme === 'dark' ? 'prose-invert' : ''
            )}>
              <div className={cn(
                'text-base leading-relaxed whitespace-pre-line font-serif',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                {isZh ? event.story.zh : event.story.en}
              </div>
            </div>
          )}

          {/* Scientist Bio Card */}
          {event.scientistBio?.bioEn && (
            <div className={cn(
              'rounded-xl p-4 mb-6 border',
              theme === 'dark'
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-amber-50 border-amber-200'
            )}>
              <h4 className={cn(
                'text-sm font-semibold mb-2 flex items-center gap-2',
                theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
              )}>
                <User className="w-4 h-4" />
                {isZh ? '科学家简介' : 'About the Scientist'}
              </h4>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {isZh ? event.scientistBio.bioZh : event.scientistBio.bioEn}
              </p>
              {event.scientistBio.nationality && (
                <p className={cn(
                  'text-xs mt-2',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                  {isZh ? '国籍' : 'Nationality'}: {event.scientistBio.nationality}
                </p>
              )}
            </div>
          )}

          {/* Key Facts */}
          {event.details && (
            <div className={cn(
              'rounded-xl p-4 border',
              theme === 'dark'
                ? 'bg-cyan-900/20 border-cyan-800/50'
                : 'bg-cyan-50 border-cyan-200'
            )}>
              <h4 className={cn(
                'text-sm font-semibold mb-3 flex items-center gap-2',
                theme === 'dark' ? 'text-cyan-400' : 'text-cyan-700'
              )}>
                <Lightbulb className="w-4 h-4" />
                {isZh ? '关键事实' : 'Key Facts'}
              </h4>
              <ul className={cn(
                'text-sm space-y-2',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              )}>
                {(isZh ? event.details.zh : event.details.en).map((detail, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-1">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Experimental Resources Gallery - 实验资源画廊 */}
          {event.experimentalResources && (
            <div className="mt-6">
              <ResourceGallery
                resources={event.experimentalResources}
                isZh={isZh}
                theme={theme}
              />
            </div>
          )}

          {/* Action Buttons - 去演示馆 / 复现实验 */}
          {(demoLink || benchLink) && (
            <div className={cn(
              'mt-6 p-4 rounded-xl border',
              theme === 'dark'
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-gray-50 border-gray-200'
            )}>
              <h4 className={cn(
                'text-sm font-semibold mb-3',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                {isZh ? '互动体验' : 'Interactive Experience'}
              </h4>
              <div className="flex flex-wrap gap-3">
                {demoLink && (
                  <button
                    onClick={() => {
                      onClose()
                      navigate(demoLink.route)
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                      theme === 'dark'
                        ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                    )}
                  >
                    <Play className="w-4 h-4" />
                    <span>{isZh ? '去演示馆体验' : 'View Interactive Demo'}</span>
                  </button>
                )}
                {benchLink && (
                  <button
                    onClick={() => {
                      onClose()
                      navigate(benchLink.route)
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                      theme === 'dark'
                        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                    )}
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>{isZh ? '在实验室复现' : 'Recreate in Lab'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className={cn(
          'sticky bottom-0 px-6 py-4 border-t backdrop-blur-md flex items-center justify-between',
          theme === 'dark'
            ? 'bg-slate-900/90 border-slate-700'
            : 'bg-white/90 border-gray-200'
        )}>
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              hasPrev
                ? theme === 'dark'
                  ? 'text-gray-300 hover:bg-slate-700'
                  : 'text-gray-700 hover:bg-gray-100'
                : 'opacity-30 cursor-not-allowed text-gray-500'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            {isZh ? '上一个' : 'Previous'}
          </button>

          <span className={cn(
            'text-sm',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {isZh ? '按 ← → 键导航 · ESC 关闭' : 'Press ← → to navigate · ESC to close'}
          </span>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              hasNext
                ? theme === 'dark'
                  ? 'text-gray-300 hover:bg-slate-700'
                  : 'text-gray-700 hover:bg-gray-100'
                : 'opacity-30 cursor-not-allowed text-gray-500'
            )}
          >
            {isZh ? '下一个' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

