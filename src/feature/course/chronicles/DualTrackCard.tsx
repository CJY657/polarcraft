/**
 * DualTrackCard - 双轨时间线卡片
 * 展示时间线事件的简要信息，支持展开查看详情
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/classNames'
import {
  ChevronDown, ChevronUp, BookOpen,
  ArrowRight, Lightbulb, Star, Camera, Film, HelpCircle,
  Play, FlaskConical, GraduationCap
} from 'lucide-react'
import { CATEGORY_LABELS, ILLUSTRATION_TO_DEMO_MAP, ILLUSTRATION_TO_BENCH_MAP } from '@/data/chronicles-constants'
import type { TimelineEvent } from '@/data/timeline-events'
import { getDemosByEvent, UNIT_INFO } from '@/data/course-event-mapping'

export interface DualTrackCardProps {
  event: TimelineEvent
  eventIndex: number
  isExpanded: boolean
  onToggle: () => void
  onReadStory: () => void
  onLinkTo?: (year: number, track: 'optics' | 'polarization') => void
  onHighlightCourses?: (year: number, track: 'optics' | 'polarization') => void
  side: 'left' | 'right'
  cardVariant: string
}

export function DualTrackCard({ event, eventIndex, isExpanded, onToggle, onReadStory, onLinkTo, onHighlightCourses, side: _side, cardVariant }: DualTrackCardProps) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const isZh = i18n.language !== "en-US" || true // Fallback for now based on original file
  const category = CATEGORY_LABELS[event.category]

  // Get demo and bench links based on illustration type
  const demoLink = event.illustrationType ? ILLUSTRATION_TO_DEMO_MAP[event.illustrationType] : null
  const benchLink = event.illustrationType ? ILLUSTRATION_TO_BENCH_MAP[event.illustrationType] : null

  // 获取关联的课程模块
  const relatedDemos = useMemo(() => {
    return getDemosByEvent(event.year, event.track)
  }, [event.year, event.track])

  // Custom button styling inside the colored card
  // If the card is dark (pink/teal), buttons should be white with ink text.
  // If the card is light (lavender/peach/ochre/cream), buttons should be ink with white text.
  const isDarkCard = cardVariant === 'clay-card-pink' || cardVariant === 'clay-card-teal'
  
  const actionButtonClass = isDarkCard 
    ? 'bg-white text-clay-ink hover:bg-white/90 active:scale-95'
    : 'bg-clay-ink text-white hover:bg-clay-ink/90 active:scale-95'

  const secondaryBadgeClass = isDarkCard
    ? 'bg-white/20 text-white border-white/20'
    : 'bg-clay-ink/10 text-clay-ink border-clay-ink/10'
    
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      data-event-index={eventIndex}
      className={cn(
        'clay-card cursor-pointer shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative z-10',
        cardVariant
      )}
      onClick={() => {
        onToggle()
        if (onHighlightCourses) {
          onHighlightCourses(event.year, event.track)
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
              secondaryBadgeClass
            )}>
              {isZh ? category.zh : category.en}
            </span>
            
            {event.experimentalResources && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border',
                secondaryBadgeClass
              )} title={isZh ? '含实验资源' : 'Has experiment resources'}>
                <Camera className="w-3.5 h-3.5" />
                <Film className="w-3.5 h-3.5" />
              </span>
            )}
            {event.importance === 1 && (
              <span className={cn("inline-flex p-1 rounded-full", secondaryBadgeClass)}>
                <Star className="w-3.5 h-3.5 fill-current" />
              </span>
            )}
            {/* 关联学习模块标记 */}
            {relatedDemos.length > 0 && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border',
                secondaryBadgeClass
              )} title={isZh ? `关联 ${relatedDemos.length} 个学习模块` : `Related to ${relatedDemos.length} learning module${relatedDemos.length > 1 ? 's' : ''}`}>
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{relatedDemos.length}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-['Inter'] font-semibold text-xl sm:text-2xl mb-2 leading-tight">
            {isZh ? event.titleZh : event.titleEn}
          </h3>

          {/* Scientist */}
          {event.scientistEn && (
            <p className="text-sm font-semibold opacity-90 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
              {event.scientistBio?.portraitEmoji && (
                <span className="text-base">{event.scientistBio.portraitEmoji}</span>
              )}
              {isZh ? event.scientistZh : event.scientistEn}
            </p>
          )}

          {/* Description (collapsed) */}
          {!isExpanded && (
            <p className="text-[15px] leading-relaxed opacity-80 line-clamp-2 mt-2">
              {isZh ? event.descriptionZh : event.descriptionEn}
            </p>
          )}
        </div>

        {/* Expand icon */}
        <div className={cn(
          'flex-shrink-0 p-2 rounded-full transition-colors',
          isDarkCard ? 'hover:bg-white/10' : 'hover:bg-clay-ink/5'
        )}>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 opacity-70" />
          ) : (
            <ChevronDown className="w-5 h-5 opacity-70" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={cn(
              "pt-4 border-t",
              isDarkCard ? "border-white/20" : "border-clay-ink/10"
            )}>
              {/* Full description */}
              <p className="text-[15px] leading-relaxed opacity-90 mb-5">
                {isZh ? event.descriptionZh : event.descriptionEn}
              </p>

              {/* Details */}
              {event.details && (
                <div className="mb-5">
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                    <Lightbulb className="w-4 h-4" />
                    {isZh ? '深入了解' : 'Learn More'}
                  </h4>
                  <ul className="text-[14px] space-y-2 opacity-85 list-none pl-1">
                    {(isZh ? event.details.zh : event.details.en).slice(0, 3).map((detail, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Thinking Question */}
              {event.thinkingQuestion && (
                <div className={cn(
                  'mb-5 p-4 rounded-xl border',
                  isDarkCard ? 'bg-white/10 border-white/20' : 'bg-clay-ink/5 border-clay-ink/10'
                )}>
                  <h4 className="text-sm font-bold mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    {isZh ? '思考问题' : 'Think About It'}
                  </h4>
                  <p className="text-[14px] italic opacity-90">
                    {isZh ? event.thinkingQuestion.zh : event.thinkingQuestion.en}
                  </p>
                </div>
              )}

              {/* 关联学习模块 */}
              {relatedDemos.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                    <GraduationCap className="w-4 h-4" />
                    {isZh ? '相关学习模块' : 'Related Learning Modules'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {relatedDemos.map((demo) => {
                      const unitInfo = UNIT_INFO.find(u => u.id === demo.unit)
                      return (
                        <button
                          key={demo.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(demo.route)
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]',
                            isDarkCard ? 'bg-white text-clay-ink shadow-md' : 'bg-clay-ink text-white shadow-md'
                          )}
                          style={isDarkCard ? {} : { borderBottom: `2px solid ${unitInfo?.color || '#fff'}` }}
                        >
                          <span className="truncate max-w-[160px]">
                            {isZh ? demo.titleZh : demo.titleEn}
                          </span>
                          {demo.relevance === 'primary' && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {event.story && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onReadStory()
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm',
                      actionButtonClass
                    )}
                  >
                    <BookOpen className="w-4 h-4" />
                    {isZh ? '阅读故事' : 'Read Story'}
                  </button>
                )}

                {/* Go to Demo button - 去演示馆 */}
                {demoLink && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(demoLink.route)
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm',
                      actionButtonClass
                    )}
                    title={isZh ? demoLink.labelZh : demoLink.labelEn}
                  >
                    <Play className="w-4 h-4" />
                    {isZh ? '去演示馆' : 'View Demo'}
                  </button>
                )}

                {/* Recreate in Lab button - 在实验室复现 */}
                {benchLink && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(benchLink.route)
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm',
                      actionButtonClass
                    )}
                    title={isZh ? benchLink.labelZh : benchLink.labelEn}
                  >
                    <FlaskConical className="w-4 h-4" />
                    {isZh ? '复现实验' : 'Lab'}
                  </button>
                )}

                {event.linkTo && onLinkTo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onLinkTo(event.linkTo!.year, event.linkTo!.trackTarget)
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm',
                      secondaryBadgeClass,
                      isDarkCard ? 'hover:bg-white/30' : 'hover:bg-clay-ink/20'
                    )}
                    title={isZh ? event.linkTo.descriptionZh : event.linkTo.descriptionEn}
                  >
                    <ArrowRight className="w-4 h-4" />
                    {isZh ? `跳转 ${event.linkTo.year}` : `Go to ${event.linkTo.year}`}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
