/**
 * Scientist Network Visualization
 * 科学家关系网络可视化
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/classNames'
import { User, X, ChevronRight, Network, List, Globe, Calendar } from 'lucide-react'
import {
  SCIENTISTS,
  SCIENTIST_RELATIONS,
  RELATION_STYLES,
  getScientistRelations,
  type ScientistRelation,
  type RelationType
} from '@/data/scientist-network'
import { NodeIcon, getPrimaryField, getEraFromYear } from '@/components/icons/NodeIcons'

type ViewMode = 'network' | 'list'

interface ScientistNetworkProps {
  theme: 'dark' | 'light'
  onNavigateToEvent?: (year: number, track: 'optics' | 'polarization') => void
  externalSelectedScientist?: string | null
}

// 预计算节点位置 - 按时代和领域布局
// x: 左侧(15-40)=光学, 中间(40-60)=混合, 右侧(60-85)=偏振
// y: 按时代从上到下 (1500s→1900s)
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  // 1500s-1600s 早期
  galileo: { x: 15, y: 6 },
  snell: { x: 30, y: 8 },
  fermat: { x: 45, y: 10 },
  bartholin: { x: 72, y: 12 },

  // 1600s-1700s
  huygens: { x: 50, y: 18 },
  hooke: { x: 35, y: 20 },
  romer: { x: 20, y: 22 },
  newton: { x: 28, y: 28 },

  // 1700s-1800s 早期
  young: { x: 32, y: 40 },
  malus: { x: 68, y: 42 },
  fraunhofer: { x: 18, y: 48 },
  arago: { x: 50, y: 48 },
  brewster: { x: 82, y: 45 },
  biot: { x: 75, y: 52 },
  fresnel: { x: 42, y: 55 },
  nicol: { x: 88, y: 58 },

  // 1800s 中后期
  faraday: { x: 55, y: 62 },
  stokes: { x: 70, y: 68 },
  maxwell: { x: 28, y: 72 },
  michelson: { x: 18, y: 78 },
  hertz: { x: 38, y: 80 },

  // 1900s
  jones: { x: 68, y: 88 },
  mueller: { x: 80, y: 90 },
  gabor: { x: 25, y: 92 },
  land: { x: 55, y: 94 },
}

export function ScientistNetwork({ theme, onNavigateToEvent, externalSelectedScientist }: ScientistNetworkProps) {
  const { i18n } = useTranslation()
  const isZh = true

  const [viewMode, setViewMode] = useState<ViewMode>('network')
  const [selectedScientist, setSelectedScientist] = useState<string | null>(null)

  // Sync with external selection from ExplorationMode
  useEffect(() => {
    if (externalSelectedScientist) {
      setSelectedScientist(externalSelectedScientist)
    }
  }, [externalSelectedScientist])
  const [hoveredScientist, setHoveredScientist] = useState<string | null>(null)
  const [hoveredRelation, setHoveredRelation] = useState<ScientistRelation | null>(null)
  const [filterType, setFilterType] = useState<RelationType | 'all'>('all')

  // 按出生年份排序的科学家列表
  const sortedScientists = useMemo(() => {
    return [...SCIENTISTS].sort((a, b) => a.birthYear - b.birthYear)
  }, [])

  // 获取选中科学家的关系
  const selectedRelations = useMemo(() => {
    if (!selectedScientist) return []
    return getScientistRelations(selectedScientist)
  }, [selectedScientist])

  // 过滤后的关系
  const filteredRelations = useMemo(() => {
    if (filterType === 'all') return SCIENTIST_RELATIONS
    return SCIENTIST_RELATIONS.filter(r => r.type === filterType)
  }, [filterType])

  // 高亮的科学家ID集合
  const highlightedScientists = useMemo(() => {
    const ids = new Set<string>()
    if (selectedScientist) {
      ids.add(selectedScientist)
      selectedRelations.forEach(r => {
        ids.add(r.from)
        ids.add(r.to)
      })
    }
    if (hoveredScientist) {
      ids.add(hoveredScientist)
    }
    return ids
  }, [selectedScientist, selectedRelations, hoveredScientist])

  const handleSelectScientist = useCallback((id: string) => {
    setSelectedScientist(prev => prev === id ? null : id)
  }, [])

  const selectedScientistData = useMemo(() => {
    return SCIENTISTS.find(s => s.id === selectedScientist)
  }, [selectedScientist])

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200'
    )}>
      {/* Header */}
      <div className={cn(
        'p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
        theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-4">
          <div>
            <h3 className={cn(
              'text-lg font-bold flex items-center gap-2',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <span>{viewMode === 'network' ? '🕸️' : '📋'}</span>
              {isZh
                ? (viewMode === 'network' ? '科学家关系网络' : '科学家名录')
                : (viewMode === 'network' ? 'Scientist Network' : 'Scientist Directory')}
            </h3>
            <p className={cn(
              'text-sm mt-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {viewMode === 'network'
                ? (isZh ? '点击节点查看科学家详情和关系' : 'Click nodes to explore scientists and their relationships')
                : (isZh ? `共 ${SCIENTISTS.length} 位光学先驱，按时间排序` : `${SCIENTISTS.length} optical pioneers, sorted by era`)}
            </p>
          </div>

          {/* View mode toggle */}
          <div className={cn(
            'flex rounded-lg overflow-hidden border',
            theme === 'dark' ? 'border-slate-600' : 'border-gray-300'
          )}>
            <button
              onClick={() => setViewMode('network')}
              className={cn(
                'px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors',
                viewMode === 'network'
                  ? theme === 'dark'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-cyan-500 text-white'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-slate-700'
                    : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Network className="w-4 h-4" />
              <span className="hidden sm:inline">{isZh ? '网络' : 'Network'}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? theme === 'dark'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-cyan-500 text-white'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-slate-700'
                    : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">{isZh ? '列表' : 'List'}</span>
            </button>
          </div>
        </div>

        {/* Relation type filter (only show in network view) */}
        {viewMode === 'network' && (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium transition-colors',
              filterType === 'all'
                ? 'bg-gray-600 text-white'
                : theme === 'dark' ? 'text-gray-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {isZh ? '全部' : 'All'}
          </button>
          {(['influenced', 'built-upon', 'rival', 'teacher-student'] as RelationType[]).map(type => {
            const style = RELATION_STYLES[type]
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1',
                  filterType === type
                    ? `bg-${style.color}-500 text-white`
                    : theme === 'dark' ? 'text-gray-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
                )}
                style={filterType === type ? {
                  backgroundColor: style.color === 'green' ? '#22c55e' :
                    style.color === 'blue' ? '#3b82f6' :
                    style.color === 'red' ? '#ef4444' :
                    style.color === 'purple' ? '#a855f7' :
                    style.color === 'cyan' ? '#06b6d4' :
                    style.color === 'orange' ? '#f97316' : '#6b7280'
                } : undefined}
              >
                <span>{style.icon}</span>
                <span className="hidden sm:inline">{isZh ? style.labelZh : style.labelEn}</span>
              </button>
            )
          })}
        </div>
        )}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedScientists.map((scientist) => {
              const relations = getScientistRelations(scientist.id)
              const isPolarization = scientist.fields.includes('polarization')

              return (
                <div
                  key={scientist.id}
                  onClick={() => handleSelectScientist(scientist.id)}
                  className={cn(
                    'p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg',
                    selectedScientist === scientist.id
                      ? theme === 'dark'
                        ? 'bg-cyan-900/30 border-cyan-500'
                        : 'bg-cyan-50 border-cyan-400'
                      : theme === 'dark'
                        ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                        : 'bg-white border-gray-200 hover:border-gray-400'
                  )}
                >
                  {/* Scientist header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0">
                      <NodeIcon
                        type="scientist"
                        field={getPrimaryField(scientist.fields)}
                        era={getEraFromYear(scientist.birthYear)}
                        size={40}
                        isSelected={selectedScientist === scientist.id}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        'font-bold truncate',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {isZh ? scientist.nameZh : scientist.nameEn}
                      </h4>
                      <div className={cn(
                        'flex items-center gap-2 text-sm',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        <Calendar className="w-3 h-3" />
                        <span>{scientist.birthYear}{scientist.deathYear ? `-${scientist.deathYear}` : ''}</span>
                      </div>
                      <div className={cn(
                        'flex items-center gap-2 text-sm',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        <Globe className="w-3 h-3" />
                        <span>{scientist.nationality}</span>
                      </div>
                    </div>
                  </div>

                  {/* Field badges */}
                  <div className="flex gap-1 flex-wrap mb-3">
                    {scientist.fields.map(field => (
                      <span
                        key={field}
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          field === 'polarization'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : field === 'wave'
                            ? 'bg-green-500/20 text-green-400'
                            : field === 'quantum'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-amber-500/20 text-amber-400'
                        )}
                      >
                        {field === 'polarization' ? (isZh ? '偏振' : 'Polarization') :
                         field === 'wave' ? (isZh ? '波动' : 'Wave') :
                         field === 'quantum' ? (isZh ? '量子' : 'Quantum') :
                         (isZh ? '光学' : 'Optics')}
                      </span>
                    ))}
                  </div>

                  {/* Key contributions */}
                  <ul className="space-y-1 mb-3">
                    {(isZh ? scientist.keyContributions.zh : scientist.keyContributions.en).slice(0, 2).map((contribution, idx) => (
                      <li
                        key={idx}
                        className={cn(
                          'text-xs flex items-start gap-1.5',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}
                      >
                        <span className={cn(
                          'mt-0.5',
                          isPolarization ? 'text-cyan-400' : 'text-amber-400'
                        )}>•</span>
                        <span className="line-clamp-1">{contribution}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Related events and relations count */}
                  <div className="flex items-center justify-between text-xs">
                    <div className={cn(
                      'flex items-center gap-1',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      <Network className="w-3 h-3" />
                      <span>{relations.length} {isZh ? '个关系' : 'relations'}</span>
                    </div>
                    {scientist.eventYears.length > 0 && onNavigateToEvent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onNavigateToEvent(scientist.eventYears[0], isPolarization ? 'polarization' : 'optics')
                        }}
                        className={cn(
                          'flex items-center gap-1 transition-colors',
                          theme === 'dark'
                            ? 'text-cyan-400 hover:text-cyan-300'
                            : 'text-cyan-600 hover:text-cyan-500'
                        )}
                      >
                        {scientist.eventYears[0]}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Network View */}
      {viewMode === 'network' && (
      <div className="flex flex-col lg:flex-row">
        {/* Network Visualization */}
        <div className="flex-1 p-4">
          <svg viewBox="0 0 100 100" className="w-full h-[400px] lg:h-[500px]">
            <defs>
              {/* Arrow markers for different relation types */}
              {Object.entries(RELATION_STYLES).map(([type, style]) => (
                <marker
                  key={type}
                  id={`arrow-${type}`}
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path
                    d="M0,0 L6,3 L0,6 Z"
                    fill={style.color === 'green' ? '#22c55e' :
                      style.color === 'blue' ? '#3b82f6' :
                      style.color === 'red' ? '#ef4444' :
                      style.color === 'purple' ? '#a855f7' :
                      style.color === 'cyan' ? '#06b6d4' :
                      style.color === 'orange' ? '#f97316' : '#6b7280'}
                  />
                </marker>
              ))}

              {/* Glow filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Era labels */}
            <text x="3" y="10" className="text-[2.5px]" fill={theme === 'dark' ? '#64748b' : '#94a3b8'}>
              1500s
            </text>
            <text x="3" y="25" className="text-[2.5px]" fill={theme === 'dark' ? '#64748b' : '#94a3b8'}>
              1600s
            </text>
            <text x="3" y="45" className="text-[2.5px]" fill={theme === 'dark' ? '#64748b' : '#94a3b8'}>
              1700s
            </text>
            <text x="3" y="65" className="text-[2.5px]" fill={theme === 'dark' ? '#64748b' : '#94a3b8'}>
              1800s
            </text>
            <text x="3" y="90" className="text-[2.5px]" fill={theme === 'dark' ? '#64748b' : '#94a3b8'}>
              1900s
            </text>

            {/* Field labels */}
            <text x="25" y="5" className="text-[2.5px]" fill="#f59e0b" textAnchor="middle">
              {isZh ? '光学' : 'Optics'}
            </text>
            <text x="55" y="5" className="text-[2.5px]" fill="#22d3ee" textAnchor="middle">
              {isZh ? '偏振' : 'Polarization'}
            </text>

            {/* Relation lines */}
            {filteredRelations.map((relation, idx) => {
              const fromPos = NODE_POSITIONS[relation.from]
              const toPos = NODE_POSITIONS[relation.to]
              if (!fromPos || !toPos) return null

              const style = RELATION_STYLES[relation.type]
              const isHighlighted = selectedScientist && (relation.from === selectedScientist || relation.to === selectedScientist)
              const isHovered = hoveredRelation === relation

              // Calculate control point for curved line
              const midX = (fromPos.x + toPos.x) / 2
              const midY = (fromPos.y + toPos.y) / 2
              const dx = toPos.x - fromPos.x
              const dy = toPos.y - fromPos.y
              // Offset perpendicular to the line
              const offset = 3
              const ctrlX = midX - dy * offset / Math.sqrt(dx * dx + dy * dy)
              const ctrlY = midY + dx * offset / Math.sqrt(dx * dx + dy * dy)

              const color = style.color === 'green' ? '#22c55e' :
                style.color === 'blue' ? '#3b82f6' :
                style.color === 'red' ? '#ef4444' :
                style.color === 'purple' ? '#a855f7' :
                style.color === 'cyan' ? '#06b6d4' :
                style.color === 'orange' ? '#f97316' : '#6b7280'

              return (
                <g key={idx}>
                  <path
                    d={`M ${fromPos.x} ${fromPos.y} Q ${ctrlX} ${ctrlY} ${toPos.x} ${toPos.y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHighlighted || isHovered ? 0.5 : 0.2}
                    strokeOpacity={isHighlighted ? 1 : selectedScientist ? 0.1 : 0.4}
                    markerEnd={`url(#arrow-${relation.type})`}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredRelation(relation)}
                    onMouseLeave={() => setHoveredRelation(null)}
                  />
                </g>
              )
            })}

            {/* Scientist nodes */}
            {SCIENTISTS.map((scientist) => {
              const pos = NODE_POSITIONS[scientist.id]
              if (!pos) return null

              const isSelected = selectedScientist === scientist.id
              const isHighlighted = highlightedScientists.has(scientist.id)
              const isHovered = hoveredScientist === scientist.id
              const isPolarization = scientist.fields.includes('polarization')

              return (
                <g
                  key={scientist.id}
                  className="cursor-pointer transition-all duration-300"
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => handleSelectScientist(scientist.id)}
                  onMouseEnter={() => setHoveredScientist(scientist.id)}
                  onMouseLeave={() => setHoveredScientist(null)}
                  style={{
                    opacity: selectedScientist && !isHighlighted ? 0.3 : 1
                  }}
                >
                  {/* Glow effect for selected */}
                  {isSelected && (
                    <circle
                      r="4"
                      fill={isPolarization ? '#22d3ee' : '#f59e0b'}
                      opacity="0.3"
                      className="animate-pulse"
                    />
                  )}

                  {/* Node circle */}
                  <circle
                    r={isSelected ? 3 : isHovered ? 2.5 : 2}
                    fill={theme === 'dark' ? '#1e293b' : '#f8fafc'}
                    stroke={isPolarization ? '#22d3ee' : '#f59e0b'}
                    strokeWidth={isSelected || isHovered ? 0.6 : 0.4}
                    filter={isSelected ? 'url(#glow)' : undefined}
                  />

                  {/* Field-based icon using foreignObject */}
                  <foreignObject
                    x="-1.5"
                    y="-1.5"
                    width="3"
                    height="3"
                    style={{ overflow: 'visible' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                      <NodeIcon
                        type="scientist"
                        field={getPrimaryField(scientist.fields)}
                        size={3}
                        isSelected={isSelected}
                      />
                    </div>
                  </foreignObject>

                  {/* Name label */}
                  <text
                    y="5"
                    textAnchor="middle"
                    className="text-[2px] font-medium"
                    fill={theme === 'dark' ? '#e2e8f0' : '#1e293b'}
                  >
                    {isZh ? scientist.nameZh.split('·').pop() : scientist.nameEn.split(' ').pop()}
                  </text>

                  {/* Birth year */}
                  <text
                    y="7"
                    textAnchor="middle"
                    className="text-[1.5px]"
                    fill={theme === 'dark' ? '#64748b' : '#94a3b8'}
                  >
                    {scientist.birthYear}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Details Panel */}
        <div className={cn(
          'w-full lg:w-80 border-t lg:border-t-0 lg:border-l p-4',
          theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
        )}>
          {selectedScientistData ? (
            <div className="space-y-4">
              {/* Scientist header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <NodeIcon
                      type="scientist"
                      field={getPrimaryField(selectedScientistData.fields)}
                      era={getEraFromYear(selectedScientistData.birthYear)}
                      size={40}
                      isSelected={true}
                    />
                  </div>
                  <div>
                    <h4 className={cn(
                      'font-bold',
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {isZh ? selectedScientistData.nameZh : selectedScientistData.nameEn}
                    </h4>
                    <p className={cn(
                      'text-sm',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {selectedScientistData.birthYear}
                      {selectedScientistData.deathYear ? `-${selectedScientistData.deathYear}` : ''}
                      {' · '}{selectedScientistData.nationality}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedScientist(null)}
                  className={cn(
                    'p-1 rounded hover:bg-gray-200',
                    theme === 'dark' ? 'hover:bg-slate-700 text-gray-400' : 'text-gray-500'
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Field badges */}
              <div className="flex gap-1 flex-wrap">
                {selectedScientistData.fields.map(field => (
                  <span
                    key={field}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      field === 'polarization'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : field === 'wave'
                        ? 'bg-green-500/20 text-green-400'
                        : field === 'quantum'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-amber-500/20 text-amber-400'
                    )}
                  >
                    {field === 'polarization' ? (isZh ? '偏振' : 'Polarization') :
                     field === 'wave' ? (isZh ? '波动' : 'Wave') :
                     field === 'quantum' ? (isZh ? '量子' : 'Quantum') :
                     (isZh ? '光学' : 'Optics')}
                  </span>
                ))}
              </div>

              {/* Key contributions */}
              <div>
                <h5 className={cn(
                  'text-sm font-semibold mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  {isZh ? '主要贡献' : 'Key Contributions'}
                </h5>
                <ul className="space-y-1">
                  {(isZh ? selectedScientistData.keyContributions.zh : selectedScientistData.keyContributions.en).map((contribution, idx) => (
                    <li
                      key={idx}
                      className={cn(
                        'text-sm flex items-start gap-2',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}
                    >
                      <span className="text-cyan-400 mt-1">•</span>
                      {contribution}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Relations */}
              <div>
                <h5 className={cn(
                  'text-sm font-semibold mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  {isZh ? '学术关系' : 'Academic Relations'}
                </h5>
                <div className="space-y-2">
                  {selectedRelations.map((relation, idx) => {
                    const style = RELATION_STYLES[relation.type]
                    const otherScientistId = relation.from === selectedScientist ? relation.to : relation.from
                    const otherScientist = SCIENTISTS.find(s => s.id === otherScientistId)
                    const isFrom = relation.from === selectedScientist

                    return (
                      <div
                        key={idx}
                        className={cn(
                          'p-2 rounded-lg text-sm cursor-pointer transition-colors',
                          theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'
                        )}
                        onClick={() => otherScientist && handleSelectScientist(otherScientist.id)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{style.icon}</span>
                          <span className={cn(
                            'font-medium flex items-center gap-1',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            {isFrom ? '→' : '←'}
                            {otherScientist && (
                              <NodeIcon
                                type="scientist"
                                field={getPrimaryField(otherScientist.fields)}
                                size={18}
                              />
                            )}
                            {isZh ? otherScientist?.nameZh : otherScientist?.nameEn}
                          </span>
                        </div>
                        <p className={cn(
                          'text-xs mt-1',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        )}>
                          {isZh ? relation.descriptionZh : relation.descriptionEn}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Navigate to events */}
              {selectedScientistData.eventYears.length > 0 && onNavigateToEvent && (
                <div>
                  <h5 className={cn(
                    'text-sm font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    {isZh ? '相关事件' : 'Related Events'}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedScientistData.eventYears.map(year => (
                      <button
                        key={year}
                        onClick={() => onNavigateToEvent(year, selectedScientistData.fields.includes('polarization') ? 'polarization' : 'optics')}
                        className={cn(
                          'px-3 py-1 rounded-full text-sm font-mono transition-colors flex items-center gap-1',
                          theme === 'dark'
                            ? 'bg-slate-700 text-cyan-400 hover:bg-slate-600'
                            : 'bg-gray-100 text-cyan-600 hover:bg-gray-200'
                        )}
                      >
                        {year}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              'h-full flex flex-col items-center justify-center text-center p-4',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              <User className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">
                {isZh ? '点击网络中的科学家节点查看详情' : 'Click a scientist node to view details'}
              </p>
              <p className="text-xs mt-2">
                {isZh ? '节点之间的连线表示学术关系' : 'Lines between nodes show academic relationships'}
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Relation tooltip (only in network view) */}
      {viewMode === 'network' && hoveredRelation && (
        <div className={cn(
          'fixed z-50 px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs pointer-events-none',
          theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'
        )}
        style={{
          left: '50%',
          bottom: '20%',
          transform: 'translateX(-50%)'
        }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span>{RELATION_STYLES[hoveredRelation.type].icon}</span>
            <span className="font-medium">
              {isZh ? RELATION_STYLES[hoveredRelation.type].labelZh : RELATION_STYLES[hoveredRelation.type].labelEn}
            </span>
            {hoveredRelation.year && (
              <span className="text-xs opacity-70">({hoveredRelation.year})</span>
            )}
          </div>
          <p className="text-xs opacity-80">
            {isZh ? hoveredRelation.descriptionZh : hoveredRelation.descriptionEn}
          </p>
        </div>
      )}
    </div>
  )
}
