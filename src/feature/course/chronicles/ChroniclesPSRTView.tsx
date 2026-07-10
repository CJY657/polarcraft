/**
 * ChroniclesPSRTView - 光学编年史P-SRT课程双线叙事视图
 *
 * 左侧：课程单元与历史时间线事件
 * 右侧：对应的光学展示馆演示模块
 *
 * 实现双轨叙事：光学发展史 + 偏振光学专题
 */

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  FlaskConical,
  Lightbulb,
  Zap,
  Sparkles,
  Target,
  Telescope,
  Calendar,
  User,
  Play,
  Info,
  Beaker,
  GraduationCap,
  History,
  Clock
} from 'lucide-react'
import {
  PSRT_CURRICULUM,
  PSRT_EVENT_MAPPINGS,
  getDemosForUnit,
  getDifficultyColor,
  getDifficultyIcon,
  type CourseUnit,
  type CourseSection
} from '@/data/psrt-curriculum'
import { TIMELINE_EVENTS, type TimelineEvent } from '@/data/timeline-events'
import { COURSE_DEMOS } from '@/data/course-event-mapping'

interface ChroniclesPSRTViewProps {
  theme: 'dark' | 'light'
  onNavigateToEvent?: (year: number, track: 'optics' | 'polarization') => void
}

// 单元图标映射
const UNIT_ICONS: Record<string, React.ReactNode> = {
  'unit1': <Lightbulb className="w-5 h-5" />,
  'unit2': <Zap className="w-5 h-5" />,
  'unit3': <Sparkles className="w-5 h-5" />,
  'unit4': <Target className="w-5 h-5" />,
  'unit5': <Telescope className="w-5 h-5" />
}

// 历史事件卡片组件
function TimelineEventCard({
  event,
  theme,
  relevance,
  connectionDescription,
  onNavigate
}: {
  event: TimelineEvent
  theme: 'dark' | 'light'
  relevance: 'primary' | 'secondary'
  connectionDescription: string
  onNavigate?: () => void
}) {
  const isZh = true

  const categoryColors: Record<string, string> = {
    discovery: '#22c55e',
    theory: '#6366f1',
    experiment: '#f59e0b',
    application: '#ec4899'
  }

  return (
    <div
      className={`rounded-lg p-3 border-l-4 transition-all ${
        theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-50'
      } ${relevance === 'primary' ? 'opacity-100' : 'opacity-70'} ${
        onNavigate ? 'cursor-pointer hover:ring-2 hover:ring-cyan-500/50' : ''
      }`}
      style={{ borderLeftColor: categoryColors[event.category] }}
      onClick={onNavigate}
    >
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {event.year}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: `${categoryColors[event.category]}20`,
            color: categoryColors[event.category]
          }}
        >
          {event.track === 'polarization' ? '偏振' : '光学'}
        </span>
        {relevance === 'primary' && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">
            核心
          </span>
        )}
        {onNavigate && (
          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
            theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
          }`}>
            <Clock className="w-3 h-3" />
            {isZh ? '时间线' : 'Timeline'}
          </span>
        )}
      </div>

      <h4 className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        {isZh ? event.titleZh : event.titleEn}
      </h4>

      {event.scientistEn && (
        <div className="flex items-center gap-1 mb-1">
          <User className="w-3 h-3 text-gray-400" />
          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {isZh ? event.scientistZh : event.scientistEn}
          </span>
        </div>
      )}

      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        {connectionDescription}
      </p>
    </div>
  )
}

// 演示卡片组件
function DemoCard({
  demoId,
  theme
}: {
  demoId: string
  theme: 'dark' | 'light'
}) {
  const isZh = true

  const demo = COURSE_DEMOS.find(d => d.id === demoId)
  if (!demo) return null

  const difficultyColors: Record<string, string> = {
    foundation: '#22c55e',
    application: '#06b6d4',
    research: '#a855f7'
  }

  return (
    <Link
      to={demo.route}
      className={`block rounded-lg p-3 border transition-all hover:scale-[1.02] ${
        theme === 'dark'
          ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
          : 'bg-white border-gray-200 hover:border-gray-400'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="p-1.5 rounded"
          style={{ backgroundColor: `${difficultyColors[demo.difficulty]}20` }}
        >
          <FlaskConical className="w-4 h-4" style={{ color: difficultyColors[demo.difficulty] }} />
        </div>
        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {isZh ? demo.titleZh : demo.titleEn}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: `${difficultyColors[demo.difficulty]}20`,
            color: difficultyColors[demo.difficulty]
          }}
        >
          {getDifficultyIcon(demo.difficulty)} {
            demo.difficulty === 'foundation' ? (isZh ? '基础' : 'Basic') :
            demo.difficulty === 'application' ? (isZh ? '应用' : 'Applied') :
            (isZh ? '研究' : 'Research')
          }
        </span>
        <Play className="w-4 h-4 text-cyan-500" />
      </div>
    </Link>
  )
}

// 章节展开组件
function SectionContent({
  section,
  unitColor,
  theme,
  onNavigateToEvent
}: {
  section: CourseSection
  unitColor: string
  theme: 'dark' | 'light'
  onNavigateToEvent?: (year: number, track: 'optics' | 'polarization') => void
}) {
  const isZh = true

  // 获取关联的历史事件（排除隐藏的事件）
  const relatedEvents = useMemo(() => {
    return section.relatedEvents
      .map(ref => {
        const event = TIMELINE_EVENTS.find(e => e.year === ref.year && e.track === ref.track && !e.hidden)
        const mapping = PSRT_EVENT_MAPPINGS.find(
          m => m.eventYear === ref.year && m.eventTrack === ref.track
        )
        return event ? {
          event,
          relevance: ref.relevance,
          connectionDescription: isZh
            ? (mapping?.connectionDescriptionZh || event.descriptionZh)
            : (mapping?.connectionDescriptionEn || event.descriptionEn)
        } : null
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
  }, [section.relatedEvents, isZh])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 左侧：历史时间线 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4" style={{ color: unitColor }} />
          <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {isZh ? '历史发现' : 'Historical Discoveries'}
          </h4>
          {onNavigateToEvent && (
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              ({isZh ? '点击跳转时间线' : 'Click to view in timeline'})
            </span>
          )}
        </div>
        <div className="space-y-3">
          {relatedEvents.map(({ event, relevance, connectionDescription }) => (
            <TimelineEventCard
              key={`${event.year}-${event.track}`}
              event={event}
              theme={theme}
              relevance={relevance}
              connectionDescription={connectionDescription}
              onNavigate={onNavigateToEvent ? () => onNavigateToEvent(event.year, event.track) : undefined}
            />
          ))}
        </div>

        {/* 关键概念 */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4" style={{ color: unitColor }} />
            <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {isZh ? '关键概念' : 'Key Concepts'}
            </h4>
          </div>
          <ul className="space-y-1">
            {(isZh ? section.keyConcepts.zh : section.keyConcepts.en).map((concept, i) => (
              <li key={i} className={`text-xs flex items-start gap-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span style={{ color: unitColor }}>•</span>
                {concept}
              </li>
            ))}
          </ul>
        </div>

        {/* 公式（如有） */}
        {section.formulas && section.formulas.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4" style={{ color: unitColor }} />
              <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {isZh ? '核心公式' : 'Key Formulas'}
              </h4>
            </div>
            <div className="space-y-2">
              {section.formulas.map((formula, i) => (
                <div
                  key={i}
                  className={`p-2 rounded text-center font-mono text-sm ${
                    theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100'
                  }`}
                >
                  <code className={theme === 'dark' ? 'text-cyan-300' : 'text-cyan-700'}>
                    {formula.latex}
                  </code>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isZh ? formula.descriptionZh : formula.descriptionEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 右侧：光学展示馆 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4" style={{ color: unitColor }} />
          <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {isZh ? '光学展示馆' : 'Optical Exhibition'}
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {section.relatedDemos.map(demoId => (
            <DemoCard key={demoId} demoId={demoId} theme={theme} />
          ))}
        </div>

        {/* 实验步骤（如有） */}
        {section.experiments && section.experiments.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Beaker className="w-4 h-4" style={{ color: unitColor }} />
              <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {isZh ? '动手实验' : 'Hands-on Experiments'}
              </h4>
            </div>
            {section.experiments.map((exp, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-slate-700/30' : 'bg-gray-50'
                }`}
              >
                <h5 className={`text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {isZh ? exp.titleZh : exp.titleEn}
                </h5>
                <ol className="space-y-2">
                  {exp.steps.map((step, j) => (
                    <li key={j} className="text-xs">
                      <div className={`flex items-start gap-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                          style={{ backgroundColor: unitColor }}
                        >
                          {j + 1}
                        </span>
                        <span>{isZh ? step.zh : step.en}</span>
                      </div>
                      {step.observation && (
                        <div className={`ml-7 mt-1 text-xs italic ${
                          theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
                        }`}>
                          → {isZh ? step.observation.zh : step.observation.en}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}

        {/* 思考问题（如有） */}
        {section.thinkingQuestions && section.thinkingQuestions.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4" style={{ color: unitColor }} />
              <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {isZh ? '思考问题' : 'Thinking Questions'}
              </h4>
            </div>
            <div className="space-y-2">
              {section.thinkingQuestions.map((q, i) => (
                <div
                  key={i}
                  className={`p-2 rounded border-l-2 ${
                    theme === 'dark' ? 'bg-slate-700/30' : 'bg-amber-50'
                  }`}
                  style={{ borderLeftColor: unitColor }}
                >
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {isZh ? q.zh : q.en}
                  </p>
                  {q.hint && (
                    <p className={`text-xs mt-1 italic ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      💡 {isZh ? q.hint.zh : q.hint.en}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 章节卡片组件
function SectionCard({
  section,
  unitColor,
  theme,
  isExpanded,
  onToggle,
  onNavigateToEvent
}: {
  section: CourseSection
  unitColor: string
  theme: 'dark' | 'light'
  isExpanded: boolean
  onToggle: () => void
  onNavigateToEvent?: (year: number, track: 'optics' | 'polarization') => void
}) {
  const isZh = true

  return (
    <div
      className={`rounded-lg border transition-all ${
        isExpanded
          ? theme === 'dark' ? 'bg-slate-800/70 border-slate-600' : 'bg-white border-gray-300'
          : theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-gray-50 border-gray-200'
      }`}
    >
      {/* 章节标题 */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <span
          className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded"
          style={{ backgroundColor: `${unitColor}20`, color: unitColor }}
        >
          {section.id}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {isZh ? section.titleZh : section.titleEn}
          </h3>
          <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {isZh ? section.descriptionZh : section.descriptionEn}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: `${getDifficultyColor(section.difficulty)}20`,
              color: getDifficultyColor(section.difficulty)
            }}
          >
            {getDifficultyIcon(section.difficulty)}
          </span>
          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {section.relatedEvents.length} {isZh ? '事件' : 'events'} · {section.relatedDemos.length} {isZh ? '演示' : 'demos'}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 border-t ${
              theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div className="pt-4">
                <SectionContent section={section} unitColor={unitColor} theme={theme} onNavigateToEvent={onNavigateToEvent} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 单元卡片组件
function UnitCard({
  unit,
  theme,
  isExpanded,
  onToggle,
  expandedSectionId,
  onSectionToggle,
  onNavigateToEvent
}: {
  unit: CourseUnit
  theme: 'dark' | 'light'
  isExpanded: boolean
  onToggle: () => void
  expandedSectionId: string | null
  onSectionToggle: (sectionId: string) => void
  onNavigateToEvent?: (year: number, track: 'optics' | 'polarization') => void
}) {
  const { t } = useTranslation()
  const isZh = true

  const demos = getDemosForUnit(unit.id)
  const eventCount = PSRT_EVENT_MAPPINGS.filter(m => m.unitId === unit.id).length

  return (
    <div
      className={`rounded-2xl border-2 transition-all overflow-hidden ${
        isExpanded
          ? 'shadow-lg'
          : 'hover:-translate-y-1'
      } ${
        theme === 'dark'
          ? 'bg-slate-800/50 border-slate-700'
          : 'bg-white border-gray-200'
      }`}
      style={{
        borderColor: isExpanded ? unit.color : undefined,
        boxShadow: isExpanded ? `0 0 30px ${unit.color}20` : undefined
      }}
    >
      {/* 单元头部 */}
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-start gap-4 text-left"
      >
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${unit.color}20` }}
        >
          <span style={{ color: unit.color }}>{UNIT_ICONS[unit.id]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              theme === 'dark' ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}>
              {t('course.unit')} {unit.unitNumber}
            </span>
          </div>
          <h2 className={`text-lg font-bold mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {isZh ? unit.titleZh : unit.titleEn}
          </h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {isZh ? unit.subtitleZh : unit.subtitleEn}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <span className={`text-xs flex items-center gap-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <History className="w-3 h-3" /> {eventCount}
            </span>
            <span className={`text-xs flex items-center gap-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <FlaskConical className="w-3 h-3" /> {demos.length}
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`px-5 pb-5 border-t ${
              theme === 'dark' ? 'border-slate-700' : 'border-gray-100'
            }`}>
              {/* 单元描述 */}
              <p className={`text-sm mt-4 mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {isZh ? unit.descriptionZh : unit.descriptionEn}
              </p>

              {/* 学习目标 */}
              <div className="mb-4">
                <h3 className={`text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {isZh ? '学习目标' : 'Learning Objectives'}
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(isZh ? unit.learningObjectives.zh : unit.learningObjectives.en).map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span
                        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs mt-0.5"
                        style={{ backgroundColor: unit.color }}
                      >
                        ✓
                      </span>
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {obj}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 章节列表 */}
              <div className="space-y-3">
                <h3 className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {isZh ? '课程章节' : 'Course Sections'}
                </h3>
                {unit.sections.map(section => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    unitColor={unit.color}
                    theme={theme}
                    isExpanded={expandedSectionId === section.id}
                    onToggle={() => onSectionToggle(section.id)}
                    onNavigateToEvent={onNavigateToEvent}
                  />
                ))}
              </div>

              {/* 家庭实验（如有） */}
              {unit.homeExperiments && unit.homeExperiments.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🏠</span>
                    <h3 className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {isZh ? '家庭小实验' : 'Home Experiments'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unit.homeExperiments.map((exp, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl ${
                          theme === 'dark' ? 'bg-gradient-to-br from-pink-900/20 to-purple-900/20' : 'bg-gradient-to-br from-pink-50 to-purple-50'
                        }`}
                      >
                        <h4 className={`text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {isZh ? exp.titleZh : exp.titleEn}
                        </h4>
                        <div className="mb-2">
                          <span className={`text-xs font-medium ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {isZh ? '材料：' : 'Materials: '}
                          </span>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {(isZh ? exp.materials.zh : exp.materials.en).join('、')}
                          </span>
                        </div>
                        <p className={`text-xs italic ${
                          theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
                        }`}>
                          ✨ {isZh ? exp.observation.zh : exp.observation.en}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 应用领域 */}
              <div className="mt-4">
                <h3 className={`text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {isZh ? '应用领域' : 'Applications'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(isZh ? unit.applications.zh : unit.applications.en).map((app, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-1 rounded-full ${
                        theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 主组件
export function ChroniclesPSRTView({ theme, onNavigateToEvent }: ChroniclesPSRTViewProps) {
  const isZh = true

  const [expandedUnitId, setExpandedUnitId] = useState<string | null>('unit1')
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null)

  const handleUnitToggle = (unitId: string) => {
    setExpandedUnitId(expandedUnitId === unitId ? null : unitId)
    setExpandedSectionId(null)
  }

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSectionId(expandedSectionId === sectionId ? null : sectionId)
  }

  return (
    <div className="space-y-6">
      {/* 课程头部介绍 */}
      <div className={`rounded-2xl p-6 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-violet-900/30'
          : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/20 text-blue-700'
          }`}>
            P-SRT
          </span>
        </div>
        <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {isZh ? '偏振光下新世界' : 'A New World Under Polarized Light'}
        </h1>
        <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {isZh
            ? '从冰洲石实验（1669年）到现代偏振成像，探索400年偏振光学发展历程。每个课程章节左侧展示历史发现，右侧连接光学展示馆的交互演示。'
            : 'From the Iceland spar experiment (1669) to modern polarimetric imaging, explore 400 years of polarization optics. Each section shows historical discoveries on the left and links to interactive demos in the Optical Exhibition on the right.'
          }
        </p>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              📚 5 {isZh ? '单元' : 'Units'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              📅 {PSRT_EVENT_MAPPINGS.length} {isZh ? '历史事件' : 'Events'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              🔬 20+ {isZh ? '交互演示' : 'Demos'}
            </span>
          </div>
        </div>
      </div>

      {/* 难度图例 */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {isZh ? '难度级别：' : 'Difficulty: '}
        </span>
        {[
          { level: 'foundation', label: isZh ? '🌱 基础层 (PSRT入门)' : '🌱 Foundation (PSRT)' },
          { level: 'application', label: isZh ? '🔬 应用层 (ESRT轮转)' : '🔬 Application (ESRT)' },
          { level: 'research', label: isZh ? '🚀 研究层 (ORIC/SURF)' : '🚀 Research (ORIC/SURF)' }
        ].map(({ level, label }) => (
          <span
            key={level}
            className="text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: `${getDifficultyColor(level as 'foundation' | 'application' | 'research')}20`,
              color: getDifficultyColor(level as 'foundation' | 'application' | 'research')
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* 单元列表 */}
      <div className="space-y-4">
        {PSRT_CURRICULUM.map(unit => (
          <UnitCard
            key={unit.id}
            unit={unit}
            theme={theme}
            isExpanded={expandedUnitId === unit.id}
            onToggle={() => handleUnitToggle(unit.id)}
            expandedSectionId={expandedSectionId}
            onSectionToggle={handleSectionToggle}
            onNavigateToEvent={onNavigateToEvent}
          />
        ))}
      </div>
    </div>
  )
}

export default ChroniclesPSRTView
