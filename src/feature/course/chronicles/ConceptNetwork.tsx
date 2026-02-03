/**
 * Concept Network Visualization (Knowledge Graph)
 * 概念网络可视化（知识图谱）
 *
 * Visualizes the evolution of optical concepts over time,
 * showing how ideas developed, conflicted, and synthesized.
 */

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/classNames'
import { Lightbulb, X, ChevronRight, Network, List, Calendar } from 'lucide-react'
import {
  CONCEPT_NODES,
  CONCEPT_CONNECTIONS,
  CONCEPT_POSITIONS,
  CONNECTION_STYLES,
  STATUS_STYLES,
  getConceptById,
  getConceptConnections,
  type ConceptNode,
  type ConceptConnection,
  type ConnectionType
} from '@/data/concept-network'
import { NodeIcon, type ConceptStatus as NodeConceptStatus } from '@/components/icons/NodeIcons'

type ViewMode = 'network' | 'list'

interface ConceptNetworkProps {
  theme: 'dark' | 'light'
  onNavigateToEvent?: (year: number, track: 'optics' | 'polarization') => void
  onFilterByYears?: (years: number[]) => void
}

// Era colors for visual differentiation
const ERA_COLORS: Record<string, string> = {
  '1600s': '#94a3b8',  // slate
  '1700s': '#f59e0b',  // amber
  '1800s': '#22c55e',  // green
  '1900s': '#3b82f6',  // blue
  'modern': '#a855f7'  // purple
}

// Generate hexagon path for SVG
function hexagonPath(cx: number, cy: number, r: number): string {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return `M ${points.join(' L ')} Z`
}

// Generate diamond path for SVG
function diamondPath(cx: number, cy: number, r: number): string {
  return `M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`
}

export function ConceptNetwork({ theme, onNavigateToEvent, onFilterByYears }: ConceptNetworkProps) {
  const { i18n } = useTranslation()
  const isZh = true

  const [viewMode, setViewMode] = useState<ViewMode>('network')
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
  const [hoveredConcept, setHoveredConcept] = useState<string | null>(null)
  const [hoveredConnection, setHoveredConnection] = useState<ConceptConnection | null>(null)
  const [filterType, setFilterType] = useState<ConnectionType | 'all'>('all')

  // Sorted concepts by era
  const sortedConcepts = useMemo(() => {
    const eraOrder = ['1600s', '1700s', '1800s', '1900s', 'modern']
    return [...CONCEPT_NODES].sort((a, b) =>
      eraOrder.indexOf(a.era) - eraOrder.indexOf(b.era)
    )
  }, [])

  // Get selected concept's connections
  const selectedConnections = useMemo(() => {
    if (!selectedConcept) return []
    return getConceptConnections(selectedConcept)
  }, [selectedConcept])

  // Filter connections by type
  const filteredConnections = useMemo(() => {
    if (filterType === 'all') return CONCEPT_CONNECTIONS
    return CONCEPT_CONNECTIONS.filter(c => c.type === filterType)
  }, [filterType])

  // Highlighted concept IDs
  const highlightedConcepts = useMemo(() => {
    const ids = new Set<string>()
    if (selectedConcept) {
      ids.add(selectedConcept)
      selectedConnections.forEach(c => {
        ids.add(c.source)
        ids.add(c.target)
      })
    }
    if (hoveredConcept) {
      ids.add(hoveredConcept)
    }
    return ids
  }, [selectedConcept, selectedConnections, hoveredConcept])

  const handleSelectConcept = useCallback((id: string) => {
    setSelectedConcept(prev => prev === id ? null : id)
  }, [])

  // When a concept is clicked, optionally filter timeline by related events
  const handleConceptClick = useCallback((concept: ConceptNode) => {
    handleSelectConcept(concept.id)
    if (onFilterByYears && concept.relatedEventYears.length > 0) {
      onFilterByYears(concept.relatedEventYears)
    }
  }, [handleSelectConcept, onFilterByYears])

  const selectedConceptData = useMemo(() => {
    return getConceptById(selectedConcept || '')
  }, [selectedConcept])

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
                ? (viewMode === 'network' ? '概念演进图谱' : '概念索引')
                : (viewMode === 'network' ? 'Concept Evolution Map' : 'Concept Index')}
            </h3>
            <p className={cn(
              'text-sm mt-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {viewMode === 'network'
                ? (isZh ? '探索光学概念的历史演进与相互关系' : 'Explore how optical concepts evolved and connected')
                : (isZh ? `共 ${CONCEPT_NODES.length} 个核心概念，按时代排序` : `${CONCEPT_NODES.length} core concepts, sorted by era`)}
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
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-500 text-white'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-slate-700'
                    : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Network className="w-4 h-4" />
              <span className="hidden sm:inline">{isZh ? '图谱' : 'Graph'}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? theme === 'dark'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-500 text-white'
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

        {/* Connection type filter (network view only) */}
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
            {(['evolution', 'foundation', 'conflict', 'synthesis', 'application'] as ConnectionType[]).map(type => {
              const style = CONNECTION_STYLES[type]
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1',
                    filterType === type
                      ? 'text-white'
                      : theme === 'dark' ? 'text-gray-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
                  )}
                  style={filterType === type ? { backgroundColor: style.color } : undefined}
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
            {sortedConcepts.map((concept) => {
              const connections = getConceptConnections(concept.id)
              const statusStyle = STATUS_STYLES[concept.status]

              return (
                <div
                  key={concept.id}
                  onClick={() => handleConceptClick(concept)}
                  className={cn(
                    'p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg',
                    selectedConcept === concept.id
                      ? theme === 'dark'
                        ? 'bg-purple-900/30 border-purple-500'
                        : 'bg-purple-50 border-purple-400'
                      : theme === 'dark'
                        ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                        : 'bg-white border-gray-200 hover:border-gray-400'
                  )}
                >
                  {/* Concept header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0">
                      <NodeIcon
                        type="concept"
                        status={concept.status as NodeConceptStatus}
                        size={40}
                        isSelected={selectedConcept === concept.id}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        'font-bold truncate',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {isZh ? concept.labelZh : concept.labelEn}
                      </h4>
                      <div className={cn(
                        'flex items-center gap-2 text-sm',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        <Calendar className="w-3 h-3" />
                        <span>{concept.era}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex gap-1 flex-wrap mb-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${statusStyle.color}20`,
                        color: statusStyle.color
                      }}
                    >
                      {isZh ? statusStyle.labelZh : statusStyle.labelEn}
                    </span>
                  </div>

                  {/* Description */}
                  <p className={cn(
                    'text-sm line-clamp-2 mb-3',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {isZh ? concept.descriptionZh : concept.descriptionEn}
                  </p>

                  {/* Related events and connections count */}
                  <div className="flex items-center justify-between text-xs">
                    <div className={cn(
                      'flex items-center gap-1',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      <Network className="w-3 h-3" />
                      <span>{connections.length} {isZh ? '个关联' : 'connections'}</span>
                    </div>
                    {concept.relatedEventYears.length > 0 && onNavigateToEvent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onNavigateToEvent(concept.relatedEventYears[0], 'polarization')
                        }}
                        className={cn(
                          'flex items-center gap-1 transition-colors',
                          theme === 'dark'
                            ? 'text-purple-400 hover:text-purple-300'
                            : 'text-purple-600 hover:text-purple-500'
                        )}
                      >
                        {concept.relatedEventYears[0]}
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
            <svg viewBox="0 0 100 80" className="w-full h-[400px] lg:h-[500px]">
              <defs>
                {/* Arrow markers for different connection types */}
                {Object.entries(CONNECTION_STYLES).map(([type, style]) => (
                  <marker
                    key={type}
                    id={`arrow-concept-${type}`}
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path
                      d="M0,0 L6,3 L0,6 Z"
                      fill={style.color}
                    />
                  </marker>
                ))}

                {/* Glow filter */}
                <filter id="concept-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Gradient backgrounds for nodes */}
                {Object.entries(STATUS_STYLES).map(([status, style]) => (
                  <radialGradient key={status} id={`gradient-${status}`}>
                    <stop offset="0%" stopColor={style.color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={style.color} stopOpacity="0.1" />
                  </radialGradient>
                ))}
              </defs>

              {/* Era labels (vertical timeline indicator) */}
              <text x="3" y="15" className="text-[2.5px]" fill={theme === 'dark' ? '#64748b' : '#94a3b8'}>
                1600s
              </text>
              <text x="3" y="35" className="text-[2.5px]" fill={theme === 'dark' ? '#64748b' : '#94a3b8'}>
                1700s
              </text>
              <text x="3" y="55" className="text-[2.5px]" fill={theme === 'dark' ? '#64748b' : '#94a3b8'}>
                1800s
              </text>
              <text x="3" y="75" className="text-[2.5px]" fill={theme === 'dark' ? '#64748b' : '#94a3b8'}>
                Modern
              </text>

              {/* Era flow labels */}
              <text x="12" y="5" className="text-[2.5px]" fill="#94a3b8" textAnchor="start">
                {isZh ? '起源' : 'Origins'}
              </text>
              <text x="38" y="5" className="text-[2.5px]" fill="#94a3b8" textAnchor="middle">
                {isZh ? '发现' : 'Discoveries'}
              </text>
              <text x="65" y="5" className="text-[2.5px]" fill="#94a3b8" textAnchor="middle">
                {isZh ? '统一' : 'Unification'}
              </text>
              <text x="88" y="5" className="text-[2.5px]" fill="#94a3b8" textAnchor="middle">
                {isZh ? '应用' : 'Applications'}
              </text>

              {/* Connection lines */}
              {filteredConnections.map((connection, idx) => {
                const fromPos = CONCEPT_POSITIONS[connection.source]
                const toPos = CONCEPT_POSITIONS[connection.target]
                if (!fromPos || !toPos) return null

                const style = CONNECTION_STYLES[connection.type]
                const isHighlighted = selectedConcept &&
                  (connection.source === selectedConcept || connection.target === selectedConcept)
                const isHovered = hoveredConnection === connection

                // Calculate control point for curved line
                const midX = (fromPos.x + toPos.x) / 2
                const midY = (fromPos.y + toPos.y) / 2
                const dx = toPos.x - fromPos.x
                const dy = toPos.y - fromPos.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const offset = Math.min(5, dist * 0.2)
                const ctrlX = midX - dy * offset / dist
                const ctrlY = midY + dx * offset / dist

                return (
                  <g key={idx}>
                    <path
                      d={`M ${fromPos.x} ${fromPos.y} Q ${ctrlX} ${ctrlY} ${toPos.x} ${toPos.y}`}
                      fill="none"
                      stroke={style.color}
                      strokeWidth={isHighlighted || isHovered ? 0.6 : 0.25}
                      strokeOpacity={isHighlighted ? 1 : selectedConcept ? 0.15 : 0.5}
                      strokeDasharray={style.strokeStyle === 'dashed' ? '1,1' : undefined}
                      markerEnd={`url(#arrow-concept-${connection.type})`}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredConnection(connection)}
                      onMouseLeave={() => setHoveredConnection(null)}
                    />
                  </g>
                )
              })}

              {/* Concept nodes */}
              {CONCEPT_NODES.map((concept) => {
                const pos = CONCEPT_POSITIONS[concept.id]
                if (!pos) return null

                const isSelected = selectedConcept === concept.id
                const isHighlighted = highlightedConcepts.has(concept.id)
                const isHovered = hoveredConcept === concept.id
                const statusStyle = STATUS_STYLES[concept.status]

                // Use hexagon for theories/principles, diamond for phenomena/laws
                const useHexagon = concept.status === 'theory' || concept.status === 'principle'
                const nodeSize = isSelected ? 3.5 : isHovered ? 3 : 2.5

                return (
                  <g
                    key={concept.id}
                    className="cursor-pointer transition-all duration-300"
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => handleConceptClick(concept)}
                    onMouseEnter={() => setHoveredConcept(concept.id)}
                    onMouseLeave={() => setHoveredConcept(null)}
                    style={{
                      opacity: selectedConcept && !isHighlighted ? 0.3 : 1
                    }}
                  >
                    {/* Glow effect for selected */}
                    {isSelected && (
                      <path
                        d={useHexagon ? hexagonPath(0, 0, 5) : diamondPath(0, 0, 5)}
                        fill={statusStyle.color}
                        opacity="0.3"
                        className="animate-pulse"
                      />
                    )}

                    {/* Node shape */}
                    <path
                      d={useHexagon ? hexagonPath(0, 0, nodeSize) : diamondPath(0, 0, nodeSize)}
                      fill={theme === 'dark' ? '#1e293b' : '#f8fafc'}
                      stroke={statusStyle.color}
                      strokeWidth={isSelected || isHovered ? 0.5 : 0.3}
                      filter={isSelected ? 'url(#concept-glow)' : undefined}
                    />

                    {/* Status-based icon using foreignObject */}
                    <foreignObject
                      x="-1.5"
                      y="-1.5"
                      width="3"
                      height="3"
                      style={{ overflow: 'visible' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                        <NodeIcon
                          type="concept"
                          status={concept.status as NodeConceptStatus}
                          size={3}
                          isSelected={isSelected}
                        />
                      </div>
                    </foreignObject>

                    {/* Label */}
                    <text
                      y="5.5"
                      textAnchor="middle"
                      className="text-[1.8px] font-medium"
                      fill={theme === 'dark' ? '#e2e8f0' : '#1e293b'}
                    >
                      {isZh
                        ? (concept.labelZh.length > 5 ? concept.labelZh.slice(0, 4) + '…' : concept.labelZh)
                        : (concept.labelEn.length > 12 ? concept.labelEn.slice(0, 10) + '…' : concept.labelEn)}
                    </text>

                    {/* Era indicator */}
                    <circle
                      cx="0"
                      cy="7.5"
                      r="0.8"
                      fill={ERA_COLORS[concept.era]}
                    />
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
            {selectedConceptData ? (
              <div className="space-y-4">
                {/* Concept header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedConceptData.icon || '💡'}</span>
                    <div>
                      <h4 className={cn(
                        'font-bold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {isZh ? selectedConceptData.labelZh : selectedConceptData.labelEn}
                      </h4>
                      <p className={cn(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {selectedConceptData.era}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedConcept(null)}
                    className={cn(
                      'p-1 rounded hover:bg-gray-200',
                      theme === 'dark' ? 'hover:bg-slate-700 text-gray-400' : 'text-gray-500'
                    )}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status badge */}
                <div className="flex gap-1 flex-wrap">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${STATUS_STYLES[selectedConceptData.status].color}20`,
                      color: STATUS_STYLES[selectedConceptData.status].color
                    }}
                  >
                    {isZh
                      ? STATUS_STYLES[selectedConceptData.status].labelZh
                      : STATUS_STYLES[selectedConceptData.status].labelEn}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${ERA_COLORS[selectedConceptData.era]}20`,
                      color: ERA_COLORS[selectedConceptData.era]
                    }}
                  >
                    {selectedConceptData.era}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <h5 className={cn(
                    'text-sm font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    {isZh ? '概述' : 'Description'}
                  </h5>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {isZh ? selectedConceptData.descriptionZh : selectedConceptData.descriptionEn}
                  </p>
                </div>

                {/* Connections */}
                <div>
                  <h5 className={cn(
                    'text-sm font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    {isZh ? '概念关联' : 'Connections'}
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedConnections.map((connection, idx) => {
                      const style = CONNECTION_STYLES[connection.type]
                      const otherConceptId = connection.source === selectedConcept
                        ? connection.target
                        : connection.source
                      const otherConcept = getConceptById(otherConceptId)
                      const isFrom = connection.source === selectedConcept

                      return (
                        <div
                          key={idx}
                          className={cn(
                            'p-2 rounded-lg text-sm cursor-pointer transition-colors',
                            theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'
                          )}
                          onClick={() => otherConcept && handleSelectConcept(otherConcept.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span>{style.icon}</span>
                            <span className={cn(
                              'font-medium',
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            )}>
                              {isFrom ? '→' : '←'} {otherConcept?.icon} {isZh ? otherConcept?.labelZh : otherConcept?.labelEn}
                            </span>
                          </div>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          )}>
                            {isZh ? connection.descriptionZh : connection.descriptionEn}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Navigate to events */}
                {selectedConceptData.relatedEventYears.length > 0 && onNavigateToEvent && (
                  <div>
                    <h5 className={cn(
                      'text-sm font-semibold mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      {isZh ? '相关事件' : 'Related Events'}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedConceptData.relatedEventYears.map(year => (
                        <button
                          key={year}
                          onClick={() => onNavigateToEvent(year, 'polarization')}
                          className={cn(
                            'px-3 py-1 rounded-full text-sm font-mono transition-colors flex items-center gap-1',
                            theme === 'dark'
                              ? 'bg-slate-700 text-purple-400 hover:bg-slate-600'
                              : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
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
                <Lightbulb className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">
                  {isZh ? '点击节点探索光学概念' : 'Click a node to explore optical concepts'}
                </p>
                <p className="text-xs mt-2">
                  {isZh ? '连线表示概念间的演进与关联' : 'Lines show evolution and connections between concepts'}
                </p>
                <div className="mt-4 space-y-1 text-left">
                  <p className="text-xs flex items-center gap-2">
                    <span className="inline-block w-3 h-3" style={{ backgroundColor: '#8b5cf6' }} /> {isZh ? '六边形 = 理论/原理' : 'Hexagon = Theory/Principle'}
                  </p>
                  <p className="text-xs flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rotate-45" style={{ backgroundColor: '#06b6d4' }} /> {isZh ? '菱形 = 现象/定律/应用' : 'Diamond = Phenomenon/Law/Application'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection tooltip (network view only) */}
      {viewMode === 'network' && hoveredConnection && (
        <div
          className={cn(
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
            <span>{CONNECTION_STYLES[hoveredConnection.type].icon}</span>
            <span className="font-medium">
              {isZh ? CONNECTION_STYLES[hoveredConnection.type].labelZh : CONNECTION_STYLES[hoveredConnection.type].labelEn}
            </span>
            {hoveredConnection.year && (
              <span className="text-xs opacity-70">({hoveredConnection.year})</span>
            )}
          </div>
          <p className="text-xs opacity-80">
            {isZh ? hoveredConnection.descriptionZh : hoveredConnection.descriptionEn}
          </p>
        </div>
      )}

      {/* Hover tooltip for concepts */}
      {viewMode === 'network' && hoveredConcept && !selectedConcept && (
        <div
          className={cn(
            'fixed z-50 px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs pointer-events-none',
            theme === 'dark' ? 'bg-slate-800 text-white border border-slate-600' : 'bg-white text-gray-900 border border-gray-200'
          )}
          style={{
            left: '50%',
            top: '20%',
            transform: 'translateX(-50%)'
          }}
        >
          {(() => {
            const concept = getConceptById(hoveredConcept)
            if (!concept) return null
            return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <NodeIcon
                    type="concept"
                    status={concept.status as NodeConceptStatus}
                    size={20}
                  />
                  <span className="font-medium">
                    {isZh ? concept.labelZh : concept.labelEn}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: `${STATUS_STYLES[concept.status].color}20`,
                      color: STATUS_STYLES[concept.status].color
                    }}
                  >
                    {isZh ? STATUS_STYLES[concept.status].labelZh : STATUS_STYLES[concept.status].labelEn}
                  </span>
                </div>
                <p className="text-xs opacity-80">
                  {isZh ? concept.descriptionZh : concept.descriptionEn}
                </p>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
