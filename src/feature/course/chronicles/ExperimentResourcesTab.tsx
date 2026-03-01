/**
 * ExperimentResourcesTab - 实验资源探索馆
 * 重新设计为探索导向的体验，而非简单罗列
 *
 * 设计目标：
 * 1. 探索式入口 - 通过问题和发现引导用户
 * 2. 主题探索路径 - 不同的探索旅程
 * 3. 随机发现功能 - 意外惊喜
 * 4. 互动式类别探索 - 类别作为探索领域
 */

import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/classNames'
import {
  ChevronLeft, Grid, List, Search, Compass, Beaker, Star, Map,
  Camera, Film, Layers, Shuffle
} from 'lucide-react'
import {
  POLARIZATION_RESOURCES,
  getResourcesByCategory,
  type PolarizationResource,
  type ResourceCategory
} from '@/data/resource-gallery'
import {
  CATEGORY_CONFIG,
  EXPLORATION_PATHS,
  getColorClasses,
  ResourceCard,
  ResourceModal,
  ExplorationPathCard,
  CategoryExplorationCard
} from './experiment-resources'

interface ExperimentResourcesTabProps {
  theme: 'dark' | 'light'
  isZh: boolean
}

export function ExperimentResourcesTab({ theme, isZh }: ExperimentResourcesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all')
  const [viewMode, setViewMode] = useState<'explore' | 'grid' | 'list'>('explore')
  const [selectedResource, setSelectedResource] = useState<PolarizationResource | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Get categories with resources
  const categoriesWithResources = useMemo(() => {
    const categories = Object.keys(CATEGORY_CONFIG) as ResourceCategory[]
    return categories.filter(cat => getResourcesByCategory(cat).length > 0)
  }, [])

  // Filter resources
  const filteredResources = useMemo(() => {
    let resources = selectedCategory === 'all'
      ? POLARIZATION_RESOURCES
      : getResourcesByCategory(selectedCategory)

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      resources = resources.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.titleZh.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.descriptionZh?.toLowerCase().includes(query)
      )
    }

    return resources
  }, [selectedCategory, searchQuery])

  // Group by category
  const resourcesByCategory = useMemo(() => {
    const grouped: Record<ResourceCategory, PolarizationResource[]> = {} as Record<ResourceCategory, PolarizationResource[]>
    filteredResources.forEach(resource => {
      if (!grouped[resource.category]) {
        grouped[resource.category] = []
      }
      grouped[resource.category].push(resource)
    })
    return grouped
  }, [filteredResources])

  // Featured resources (one representative from each category)
  const featuredResources = useMemo(() => {
    return categoriesWithResources.slice(0, 4).map(cat => {
      const resources = getResourcesByCategory(cat)
      return resources[0]
    }).filter(Boolean)
  }, [categoriesWithResources])

  // Random discovery
  const handleRandomDiscovery = () => {
    const randomIndex = Math.floor(Math.random() * POLARIZATION_RESOURCES.length)
    setSelectedResource(POLARIZATION_RESOURCES[randomIndex])
  }

  // Select exploration path
  const handleSelectPath = (path: typeof EXPLORATION_PATHS[0]) => {
    // Select first category
    if (path.categories.length > 0) {
      setSelectedCategory(path.categories[0])
      setViewMode('grid')
    }
  }

  // Calculate resource count for exploration path
  const getPathResourceCount = (path: typeof EXPLORATION_PATHS[0]) => {
    return path.categories.reduce((count, cat) => count + getResourcesByCategory(cat).length, 0)
  }

  return (
    <div className="space-y-6">
      {/* Exploration intro */}
      <div className={cn(
        'rounded-xl border p-6',
        theme === 'dark' ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
      )}>
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className={cn(
            'p-3 rounded-xl',
            theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'
          )}>
            <Compass className={cn(
              'w-10 h-10',
              theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
            )} />
          </div>
          <div className="flex-1">
            <h3 className={cn(
              'text-xl font-bold mb-2',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {isZh ? '探索偏振世界' : 'Explore the World of Polarization'}
            </h3>
            <p className={cn(
              'text-sm mb-4',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {isZh
                ? '这里收集了丰富的偏振实验资源。你可以按主题探索、随机发现，或者直接浏览全部内容。每个资源都带有思考问题，帮助你深入理解偏振光的奥秘。'
                : 'This gallery contains rich polarization experiment resources. Explore by theme, discover randomly, or browse all content. Each resource includes exploration questions to deepen your understanding of polarized light.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRandomDiscovery}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  theme === 'dark'
                    ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                )}
              >
                <Shuffle className="w-4 h-4" />
                {isZh ? '随机发现' : 'Random Discovery'}
              </button>
              <div className="flex items-center gap-4 text-sm">
                <span className={theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}>
                  <Camera className="w-4 h-4 inline mr-1" />
                  {POLARIZATION_RESOURCES.filter(r => r.type === 'image').length} {isZh ? '张图片' : 'images'}
                </span>
                <span className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}>
                  <Film className="w-4 h-4 inline mr-1" />
                  {POLARIZATION_RESOURCES.filter(r => r.type === 'video' || r.metadata?.hasVideo).length} {isZh ? '个视频' : 'videos'}
                </span>
                <span className={theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}>
                  <Layers className="w-4 h-4 inline mr-1" />
                  {POLARIZATION_RESOURCES.filter(r => r.type === 'sequence').length} {isZh ? '个序列' : 'sequences'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exploration paths */}
      {viewMode === 'explore' && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Map className={cn('w-5 h-5', theme === 'dark' ? 'text-amber-400' : 'text-amber-600')} />
              <h3 className={cn(
                'text-lg font-semibold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {isZh ? '探索路径' : 'Exploration Paths'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXPLORATION_PATHS.map(path => (
                <ExplorationPathCard
                  key={path.id}
                  path={path}
                  theme={theme}
                  isZh={isZh}
                  resourceCount={getPathResourceCount(path)}
                  onClick={() => handleSelectPath(path)}
                />
              ))}
            </div>
          </div>

          {/* Featured discoveries */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className={cn('w-5 h-5', theme === 'dark' ? 'text-amber-400' : 'text-amber-600')} />
              <h3 className={cn(
                'text-lg font-semibold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {isZh ? '精选发现' : 'Featured Discoveries'}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredResources.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  theme={theme}
                  isZh={isZh}
                  onClick={() => setSelectedResource(resource)}
                  featured
                />
              ))}
            </div>
          </div>

          {/* Explore by category */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Beaker className={cn('w-5 h-5', theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600')} />
              <h3 className={cn(
                'text-lg font-semibold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {isZh ? '按类别探索' : 'Explore by Category'}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoriesWithResources.map(category => (
                <CategoryExplorationCard
                  key={category}
                  category={category}
                  theme={theme}
                  isZh={isZh}
                  resourceCount={getResourcesByCategory(category).length}
                  onClick={() => {
                    setSelectedCategory(category)
                    setViewMode('grid')
                  }}
                  isActive={selectedCategory === category}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Grid/List view */}
      {(viewMode === 'grid' || viewMode === 'list') && (
        <>
          {/* Toolbar */}
          <div className={cn(
            'flex flex-wrap items-center gap-3 p-4 rounded-xl border',
            theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'
          )}>
            {/* Back to explore */}
            <button
              onClick={() => {
                setViewMode('explore')
                setSelectedCategory('all')
                setSearchQuery('')
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                theme === 'dark'
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              {isZh ? '返回探索' : 'Back to Explore'}
            </button>

            {/* Search box */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isZh ? '搜索资源...' : 'Search resources...'}
                className={cn(
                  'w-full pl-9 pr-4 py-2 rounded-lg border text-sm',
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-600 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                )}
              />
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                  selectedCategory === 'all'
                    ? theme === 'dark'
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-gray-900 text-white border-gray-900'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 border-transparent'
                )}
              >
                {isZh ? '全部' : 'All'}
              </button>
              {categoriesWithResources.map(category => {
                const config = CATEGORY_CONFIG[category]
                const colorClasses = getColorClasses(config.color, theme, selectedCategory === category)
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border flex items-center gap-1.5',
                      selectedCategory === category ? colorClasses.active : colorClasses.inactive,
                      selectedCategory === category ? 'border-current' : 'border-transparent'
                    )}
                  >
                    {config.icon}
                    {isZh ? config.labelZh : config.labelEn}
                  </button>
                )
              })}
            </div>

            {/* View toggle */}
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid'
                    ? theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900'
                    : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list'
                    ? theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900'
                    : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Resource display */}
          {selectedCategory === 'all' ? (
            // Group by category display
            Object.entries(resourcesByCategory).map(([category, resources]) => {
              const config = CATEGORY_CONFIG[category as ResourceCategory]
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={cn(
                      'p-2 rounded-lg',
                      theme === 'dark' ? 'bg-slate-700' : 'bg-gray-100'
                    )}>
                      {config.icon}
                    </span>
                    <h3 className={cn(
                      'text-lg font-semibold',
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {isZh ? config.labelZh : config.labelEn}
                    </h3>
                    <span className={cn(
                      'text-sm',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      ({resources.length})
                    </span>
                  </div>
                  <div className={cn(
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'
                      : 'space-y-3'
                  )}>
                    {resources.map(resource => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        theme={theme}
                        isZh={isZh}
                        onClick={() => setSelectedResource(resource)}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            // Single category display
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'
                : 'space-y-3'
            )}>
              {filteredResources.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  theme={theme}
                  isZh={isZh}
                  onClick={() => setSelectedResource(resource)}
                />
              ))}
            </div>
          )}

          {/* No results message */}
          {filteredResources.length === 0 && (
            <div className={cn(
              'text-center py-12',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">
                {isZh ? '没有找到匹配的资源' : 'No matching resources found'}
              </p>
              <p className="text-sm">
                {isZh ? '尝试调整搜索关键词或筛选条件' : 'Try adjusting your search or filters'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Resource detail modal */}
      <AnimatePresence>
        {selectedResource && (
          <ResourceModal
            resource={selectedResource}
            theme={theme}
            isZh={isZh}
            onClose={() => setSelectedResource(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
