/**
 * Exploration Mode - Storyline and Quest-based Navigation
 * 探索模式 - 故事线与任务驱动导航
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/classNames'
import {
  BookOpen, Target, ChevronRight, ChevronDown, Play,
  CheckCircle, Circle, HelpCircle, Lightbulb, Award, Map
} from 'lucide-react'
import {
  STORYLINES,
  QUESTS,
  SCIENTISTS,
  type Storyline,
  type Quest
} from '@/data/scientist-network'

interface ExplorationModeProps {
  theme: 'dark' | 'light'
  onNavigateToEvent?: (year: number, track: 'optics' | 'polarization') => void
  onSelectScientist?: (scientistId: string) => void
}

// 故事线卡片组件
function StorylineCard({
  storyline,
  theme,
  isActive,
  currentStep,
  onStart,
  onContinue,
  onNavigateToEvent,
  onSelectScientist,
}: {
  storyline: Storyline
  theme: 'dark' | 'light'
  isActive: boolean
  currentStep: number
  onStart: () => void
  onContinue: () => void
  onNavigateToEvent?: (year: number, track: 'optics' | 'polarization') => void
  onSelectScientist?: (scientistId: string) => void
}) {
  const { i18n } = useTranslation()
  const isZh = true
  const [isExpanded, setIsExpanded] = useState(isActive)

  const waypointScientists = useMemo(() => {
    return storyline.waypoints.map(id => SCIENTISTS.find(s => s.id === id)).filter(Boolean)
  }, [storyline.waypoints])

  const progress = currentStep / storyline.waypoints.length * 100

  const colorMap: Record<string, { bg: string; border: string; text: string; bgLight: string }> = {
    cyan: {
      bg: 'bg-cyan-500/20',
      border: 'border-cyan-500',
      text: 'text-cyan-400',
      bgLight: 'bg-cyan-100'
    },
    purple: {
      bg: 'bg-purple-500/20',
      border: 'border-purple-500',
      text: 'text-purple-400',
      bgLight: 'bg-purple-100'
    },
    amber: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500',
      text: 'text-amber-400',
      bgLight: 'bg-amber-100'
    },
  }

  const colors = colorMap[storyline.color] || colorMap.cyan

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all duration-300',
      theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200',
      isActive && 'ring-2 ring-cyan-500'
    )}>
      {/* Header */}
      <div
        className={cn(
          'p-4 cursor-pointer transition-colors',
          theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{storyline.icon}</span>
            <div>
              <h4 className={cn(
                'font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {isZh ? storyline.titleZh : storyline.titleEn}
              </h4>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {isZh ? storyline.descriptionZh : storyline.descriptionEn}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              theme === 'dark' ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-600'
            )}>
              {storyline.duration}
            </span>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        {isActive && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
                {isZh ? '进度' : 'Progress'}
              </span>
              <span className={colors.text}>
                {currentStep}/{storyline.waypoints.length}
              </span>
            </div>
            <div className={cn(
              'h-1.5 rounded-full overflow-hidden',
              theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
            )}>
              <div
                className={cn('h-full rounded-full transition-all duration-500', colors.bg)}
                style={{ width: `${progress}%`, backgroundColor: storyline.color === 'cyan' ? '#06b6d4' : storyline.color === 'purple' ? '#a855f7' : '#f59e0b' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className={cn(
          'px-4 pb-4 border-t',
          theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
        )}>
          {/* Waypoints (Scientists) */}
          <div className="mt-4">
            <h5 className={cn(
              'text-sm font-semibold mb-3 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              <Map className="w-4 h-4" />
              {isZh ? '途经站点' : 'Waypoints'}
            </h5>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {waypointScientists.map((scientist, idx) => {
                const isPast = isActive && idx < currentStep
                const isCurrent = isActive && idx === currentStep
                return (
                  <div key={scientist?.id} className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (scientist && onSelectScientist) {
                          onSelectScientist(scientist.id)
                        }
                      }}
                      className={cn(
                        'flex flex-col items-center p-2 rounded-lg transition-all min-w-[60px]',
                        isCurrent
                          ? theme === 'dark' ? 'bg-cyan-500/20 ring-1 ring-cyan-500' : 'bg-cyan-50 ring-1 ring-cyan-500'
                          : isPast
                          ? theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50'
                          : theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                      )}
                    >
                      <span className="text-lg">{scientist?.emoji}</span>
                      <span className={cn(
                        'text-[10px] mt-1 text-center',
                        isPast ? 'text-green-400' : isCurrent ? 'text-cyan-400' : theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      )}>
                        {isZh ? scientist?.nameZh.split('·').pop() : scientist?.nameEn.split(' ').pop()}
                      </span>
                      {isPast && <CheckCircle className="w-3 h-3 text-green-400 mt-0.5" />}
                      {isCurrent && <Circle className="w-3 h-3 text-cyan-400 mt-0.5" />}
                    </button>
                    {idx < waypointScientists.length - 1 && (
                      <ChevronRight className={cn(
                        'w-4 h-4 flex-shrink-0',
                        isPast ? 'text-green-400' : 'text-gray-400'
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Questions */}
          <div className="mt-4">
            <h5 className={cn(
              'text-sm font-semibold mb-2 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              <HelpCircle className="w-4 h-4" />
              {isZh ? '探究问题' : 'Questions to Explore'}
            </h5>
            <ul className="space-y-1.5">
              {(isZh ? storyline.questions.zh : storyline.questions.en).map((q, idx) => (
                <li
                  key={idx}
                  className={cn(
                    'text-sm flex items-start gap-2 p-2 rounded-lg',
                    theme === 'dark' ? 'bg-slate-800/50 text-gray-400' : 'bg-gray-50 text-gray-600'
                  )}
                >
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  {q}
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            {!isActive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onStart()
                }}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2',
                  'bg-cyan-500 text-white hover:bg-cyan-600'
                )}
              >
                <Play className="w-4 h-4" />
                {isZh ? '开始探索' : 'Start Exploring'}
              </button>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onContinue()
                  }}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2',
                    'bg-cyan-500 text-white hover:bg-cyan-600'
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                  {currentStep < storyline.waypoints.length - 1
                    ? (isZh ? '继续' : 'Continue')
                    : (isZh ? '完成' : 'Complete')}
                </button>
                {/* Navigate to related event */}
                {storyline.relatedEvents[currentStep] && onNavigateToEvent && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const event = storyline.relatedEvents[currentStep]
                      if (event) {
                        onNavigateToEvent(event.year, event.track)
                      }
                    }}
                    className={cn(
                      'py-2 px-4 rounded-lg font-medium text-sm transition-colors',
                      theme === 'dark' ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {isZh ? '查看事件' : 'View Event'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// 探究任务卡片组件
function QuestCard({
  quest,
  theme,
  isActive,
  revealedClues,
  onStart,
  onRevealClue,
  onSelectScientist,
}: {
  quest: Quest
  theme: 'dark' | 'light'
  isActive: boolean
  revealedClues: number
  onStart: () => void
  onRevealClue: () => void
  onSelectScientist?: (scientistId: string) => void
}) {
  const { i18n } = useTranslation()
  const isZh = true
  const [isExpanded, setIsExpanded] = useState(false)
  const isCompleted = revealedClues >= quest.clues.length

  const difficultyColors = {
    easy: { bg: 'bg-green-500/20', text: 'text-green-400', label: isZh ? '简单' : 'Easy' },
    medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: isZh ? '中等' : 'Medium' },
    hard: { bg: 'bg-red-500/20', text: 'text-red-400', label: isZh ? '困难' : 'Hard' },
  }

  const difficulty = difficultyColors[quest.difficulty]

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all duration-300',
      theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200',
      isCompleted && 'ring-2 ring-green-500'
    )}>
      {/* Header */}
      <div
        className={cn(
          'p-4 cursor-pointer transition-colors',
          theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{quest.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  'font-bold',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {isZh ? quest.titleZh : quest.titleEn}
                </h4>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  difficulty.bg, difficulty.text
                )}>
                  {difficulty.label}
                </span>
              </div>
              <p className={cn(
                'text-sm mt-1',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {isZh ? quest.mysteryZh : quest.mysteryEn}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <span className="text-green-400">
                <CheckCircle className="w-5 h-5" />
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className={cn(
          'px-4 pb-4 border-t',
          theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
        )}>
          {/* Clues */}
          <div className="mt-4">
            <h5 className={cn(
              'text-sm font-semibold mb-3 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              <Target className="w-4 h-4" />
              {isZh ? '线索' : 'Clues'} ({revealedClues}/{quest.clues.length})
            </h5>
            <div className="space-y-2">
              {quest.clues.map((clue, idx) => {
                const scientist = SCIENTISTS.find(s => s.id === clue.scientistId)
                const isRevealed = isActive && idx < revealedClues

                return (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-lg transition-all',
                      isRevealed
                        ? theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'
                        : theme === 'dark' ? 'bg-slate-800/30' : 'bg-gray-100/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isRevealed ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-500" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (scientist && onSelectScientist) {
                            onSelectScientist(scientist.id)
                          }
                        }}
                        className={cn(
                          'flex items-center gap-1 transition-colors',
                          isRevealed ? 'text-cyan-400 hover:text-cyan-300' : 'text-gray-500'
                        )}
                      >
                        <span>{scientist?.emoji}</span>
                        <span className="text-sm font-medium">
                          {isZh ? scientist?.nameZh : scientist?.nameEn}
                        </span>
                      </button>
                    </div>
                    {isRevealed && (
                      <p className={cn(
                        'text-sm mt-2 pl-6',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        💡 {isZh ? clue.hintZh : clue.hintEn}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Insight (revealed when completed) */}
          {isCompleted && (
            <div className={cn(
              'mt-4 p-4 rounded-lg border-2 border-dashed',
              theme === 'dark' ? 'border-green-500/30 bg-green-500/10' : 'border-green-300 bg-green-50'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-green-400" />
                <span className={cn(
                  'font-semibold',
                  theme === 'dark' ? 'text-green-400' : 'text-green-700'
                )}>
                  {quest.badge}
                </span>
              </div>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-green-300' : 'text-green-800'
              )}>
                {isZh ? quest.insightZh : quest.insightEn}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4">
            {!isActive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onStart()
                }}
                className={cn(
                  'w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2',
                  'bg-amber-500 text-white hover:bg-amber-600'
                )}
              >
                <Target className="w-4 h-4" />
                {isZh ? '开始探究' : 'Start Investigation'}
              </button>
            ) : !isCompleted ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRevealClue()
                }}
                className={cn(
                  'w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2',
                  'bg-amber-500 text-white hover:bg-amber-600'
                )}
              >
                <Lightbulb className="w-4 h-4" />
                {isZh ? '揭示下一条线索' : 'Reveal Next Clue'}
              </button>
            ) : (
              <div className={cn(
                'w-full py-2 px-4 rounded-lg font-medium text-sm text-center',
                'bg-green-500/20 text-green-400'
              )}>
                ✅ {isZh ? '探究完成！' : 'Investigation Complete!'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ExplorationMode({ theme, onNavigateToEvent, onSelectScientist }: ExplorationModeProps) {
  const { i18n } = useTranslation()
  const isZh = true

  const [activeTab, setActiveTab] = useState<'storylines' | 'quests'>('storylines')
  const [activeStoryline, setActiveStoryline] = useState<string | null>(null)
  const [storylineProgress, setStorylineProgress] = useState<Record<string, number>>({})
  const [activeQuest, setActiveQuest] = useState<string | null>(null)
  const [questProgress, setQuestProgress] = useState<Record<string, number>>({})

  const handleStartStoryline = (storylineId: string) => {
    setActiveStoryline(storylineId)
    setStorylineProgress(prev => ({ ...prev, [storylineId]: 0 }))
  }

  const handleContinueStoryline = (storylineId: string) => {
    const storyline = STORYLINES.find(s => s.id === storylineId)
    if (!storyline) return

    const currentStep = storylineProgress[storylineId] || 0
    if (currentStep < storyline.waypoints.length - 1) {
      setStorylineProgress(prev => ({ ...prev, [storylineId]: currentStep + 1 }))

      // Navigate to the scientist in the network
      const nextScientistId = storyline.waypoints[currentStep + 1]
      if (nextScientistId && onSelectScientist) {
        onSelectScientist(nextScientistId)
      }
    } else {
      // Completed
      setActiveStoryline(null)
    }
  }

  const handleStartQuest = (questId: string) => {
    setActiveQuest(questId)
    setQuestProgress(prev => ({ ...prev, [questId]: 0 }))
  }

  const handleRevealClue = (questId: string) => {
    const quest = QUESTS.find(q => q.id === questId)
    if (!quest) return

    const currentClues = questProgress[questId] || 0
    if (currentClues < quest.clues.length) {
      setQuestProgress(prev => ({ ...prev, [questId]: currentClues + 1 }))

      // Navigate to the scientist in the clue
      const clue = quest.clues[currentClues]
      if (clue && onSelectScientist) {
        onSelectScientist(clue.scientistId)
      }
    }
  }

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200'
    )}>
      {/* Header */}
      <div className={cn(
        'p-4 border-b',
        theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
      )}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={cn(
              'text-lg font-bold flex items-center gap-2',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <span>🎯</span>
              {isZh ? '探索模式' : 'Exploration Mode'}
            </h3>
            <p className={cn(
              'text-sm mt-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {isZh ? '选择故事线或探究任务，沿着特定线索探索光学史' : 'Choose a storyline or quest to explore optics history'}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className={cn(
          'flex gap-1 mt-4 p-1 rounded-lg',
          theme === 'dark' ? 'bg-slate-800' : 'bg-gray-100'
        )}>
          <button
            onClick={() => setActiveTab('storylines')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2',
              activeTab === 'storylines'
                ? 'bg-cyan-500 text-white'
                : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <BookOpen className="w-4 h-4" />
            {isZh ? '故事线' : 'Storylines'}
            <span className={cn(
              'px-1.5 py-0.5 rounded text-xs',
              activeTab === 'storylines'
                ? 'bg-white/20'
                : theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
            )}>
              {STORYLINES.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2',
              activeTab === 'quests'
                ? 'bg-amber-500 text-white'
                : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Target className="w-4 h-4" />
            {isZh ? '探究任务' : 'Quests'}
            <span className={cn(
              'px-1.5 py-0.5 rounded text-xs',
              activeTab === 'quests'
                ? 'bg-white/20'
                : theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
            )}>
              {QUESTS.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {activeTab === 'storylines' ? (
          <>
            {STORYLINES.map(storyline => (
              <StorylineCard
                key={storyline.id}
                storyline={storyline}
                theme={theme}
                isActive={activeStoryline === storyline.id}
                currentStep={storylineProgress[storyline.id] || 0}
                onStart={() => handleStartStoryline(storyline.id)}
                onContinue={() => handleContinueStoryline(storyline.id)}
                onNavigateToEvent={onNavigateToEvent}
                onSelectScientist={onSelectScientist}
              />
            ))}
          </>
        ) : (
          <>
            {QUESTS.map(quest => (
              <QuestCard
                key={quest.id}
                quest={quest}
                theme={theme}
                isActive={activeQuest === quest.id}
                revealedClues={questProgress[quest.id] || 0}
                onStart={() => handleStartQuest(quest.id)}
                onRevealClue={() => handleRevealClue(quest.id)}
                onSelectScientist={onSelectScientist}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
