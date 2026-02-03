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

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/classNames'
import {
  Camera, Film, Play, Pause, ChevronLeft, ChevronRight,
  X, Maximize2, Grid, List, Eye,
  Flame, Layers, Hexagon, Glasses, Beaker, Sun, RotateCcw,
  Compass, Sparkles, Shuffle, Search, ArrowRight, HelpCircle, Lightbulb, Map, Star
} from 'lucide-react'
import {
  POLARIZATION_RESOURCES,
  getResourcesByCategory,
  type PolarizationResource,
  type ResourceCategory
} from '@/data/resource-gallery'

interface ExperimentResourcesTabProps {
  theme: 'dark' | 'light'
  isZh: boolean
}

// 类别配置
const CATEGORY_CONFIG: Record<ResourceCategory, {
  labelEn: string
  labelZh: string
  icon: React.ReactNode
  color: string
  descriptionEn: string
  descriptionZh: string
  explorationQuestionEn: string
  explorationQuestionZh: string
}> = {
  stress: {
    labelEn: 'Stress Analysis',
    labelZh: '应力分析',
    icon: <Flame className="w-5 h-5" />,
    color: 'orange',
    descriptionEn: 'See the invisible forces inside materials',
    descriptionZh: '看见材料内部的隐形力量',
    explorationQuestionEn: 'What patterns appear in stressed plastic?',
    explorationQuestionZh: '受力的塑料会呈现什么图案？'
  },
  interference: {
    labelEn: 'Interference Effects',
    labelZh: '干涉效应',
    icon: <Layers className="w-5 h-5" />,
    color: 'cyan',
    descriptionEn: 'When light waves dance together',
    descriptionZh: '当光波共舞时',
    explorationQuestionEn: 'Why do soap bubbles show rainbow colors?',
    explorationQuestionZh: '为什么肥皂泡会呈现彩虹色？'
  },
  birefringence: {
    labelEn: 'Birefringence',
    labelZh: '双折射',
    icon: <Hexagon className="w-5 h-5" />,
    color: 'purple',
    descriptionEn: 'One ray becomes two',
    descriptionZh: '一束光变成两束',
    explorationQuestionEn: 'How does calcite create double images?',
    explorationQuestionZh: '方解石如何创造出双重影像？'
  },
  daily: {
    labelEn: 'Daily Objects',
    labelZh: '日常物品',
    icon: <Glasses className="w-5 h-5" />,
    color: 'green',
    descriptionEn: 'Polarization hidden in everyday life',
    descriptionZh: '藏在日常生活中的偏振',
    explorationQuestionEn: 'What do LCD screens and sunglasses have in common?',
    explorationQuestionZh: 'LCD屏幕和太阳镜有什么共同点？'
  },
  brewster: {
    labelEn: "Brewster's Angle",
    labelZh: '布儒斯特角',
    icon: <Sun className="w-5 h-5" />,
    color: 'yellow',
    descriptionEn: 'The magic angle of perfect polarization',
    descriptionZh: '完美偏振的神奇角度',
    explorationQuestionEn: 'At what angle does glass become a perfect polarizer?',
    explorationQuestionZh: '玻璃在什么角度会变成完美的偏振器？'
  },
  rotation: {
    labelEn: 'Optical Rotation',
    labelZh: '旋光性',
    icon: <RotateCcw className="w-5 h-5" />,
    color: 'pink',
    descriptionEn: 'Light that twists as it travels',
    descriptionZh: '边走边转的光',
    explorationQuestionEn: 'How can sugar solutions rotate polarized light?',
    explorationQuestionZh: '糖溶液如何让偏振光旋转？'
  },
  scattering: {
    labelEn: 'Scattering',
    labelZh: '散射',
    icon: <Sun className="w-5 h-5" />,
    color: 'blue',
    descriptionEn: 'Why the sky is blue and sunsets are red',
    descriptionZh: '天空为何蔚蓝，夕阳为何火红',
    explorationQuestionEn: 'Is the light from the blue sky polarized?',
    explorationQuestionZh: '蓝天的光是偏振的吗？'
  },
  art: {
    labelEn: 'Polarization Art',
    labelZh: '偏振艺术',
    icon: <Camera className="w-5 h-5" />,
    color: 'rose',
    descriptionEn: 'Beauty created by polarized light',
    descriptionZh: '偏振光创造的美',
    explorationQuestionEn: 'How can you paint with polarized light?',
    explorationQuestionZh: '如何用偏振光作画？'
  }
}

// 探索路径配置
const EXPLORATION_PATHS = [
  {
    id: 'hidden-forces',
    titleEn: 'Hidden Forces',
    titleZh: '隐形力量',
    descriptionEn: 'Discover how polarized light reveals invisible stress patterns',
    descriptionZh: '探索偏振光如何揭示看不见的应力图案',
    categories: ['stress', 'interference'] as ResourceCategory[],
    icon: <Compass className="w-6 h-6" />,
    color: 'orange'
  },
  {
    id: 'crystal-magic',
    titleEn: 'Crystal Magic',
    titleZh: '晶体魔法',
    descriptionEn: 'Explore how crystals split and twist light',
    descriptionZh: '探索晶体如何分离和扭转光',
    categories: ['birefringence', 'rotation'] as ResourceCategory[],
    icon: <Sparkles className="w-6 h-6" />,
    color: 'purple'
  },
  {
    id: 'everyday-polarization',
    titleEn: 'Polarization Around Us',
    titleZh: '身边的偏振',
    descriptionEn: 'Find polarization in daily life',
    descriptionZh: '发现日常生活中的偏振',
    categories: ['daily', 'brewster', 'scattering'] as ResourceCategory[],
    icon: <Glasses className="w-6 h-6" />,
    color: 'green'
  },
  {
    id: 'light-art',
    titleEn: 'Art of Light',
    titleZh: '光的艺术',
    descriptionEn: 'Create beauty with polarized light',
    descriptionZh: '用偏振光创造美',
    categories: ['art', 'interference'] as ResourceCategory[],
    icon: <Camera className="w-6 h-6" />,
    color: 'rose'
  }
]

// 获取颜色类名
function getColorClasses(color: string, theme: 'dark' | 'light', _isActive: boolean) {
  const colorMap: Record<string, { active: string; inactive: string; bg: string; border: string }> = {
    orange: {
      active: theme === 'dark' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-orange-100 text-orange-700 border-orange-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-orange-400 hover:bg-orange-500/10' : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50',
      bg: theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-50',
      border: theme === 'dark' ? 'border-orange-500/30' : 'border-orange-200'
    },
    cyan: {
      active: theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-cyan-100 text-cyan-700 border-cyan-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10' : 'text-gray-500 hover:text-cyan-600 hover:bg-cyan-50',
      bg: theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-50',
      border: theme === 'dark' ? 'border-cyan-500/30' : 'border-cyan-200'
    },
    purple: {
      active: theme === 'dark' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-purple-100 text-purple-700 border-purple-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-purple-400 hover:bg-purple-500/10' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50',
      bg: theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50',
      border: theme === 'dark' ? 'border-purple-500/30' : 'border-purple-200'
    },
    green: {
      active: theme === 'dark' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-green-100 text-green-700 border-green-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:text-green-600 hover:bg-green-50',
      bg: theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50',
      border: theme === 'dark' ? 'border-green-500/30' : 'border-green-200'
    },
    yellow: {
      active: theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-yellow-100 text-yellow-700 border-yellow-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10' : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50',
      bg: theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-50',
      border: theme === 'dark' ? 'border-yellow-500/30' : 'border-yellow-200'
    },
    pink: {
      active: theme === 'dark' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-pink-100 text-pink-700 border-pink-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10' : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50',
      bg: theme === 'dark' ? 'bg-pink-500/10' : 'bg-pink-50',
      border: theme === 'dark' ? 'border-pink-500/30' : 'border-pink-200'
    },
    blue: {
      active: theme === 'dark' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-blue-100 text-blue-700 border-blue-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50',
      bg: theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50',
      border: theme === 'dark' ? 'border-blue-500/30' : 'border-blue-200'
    },
    rose: {
      active: theme === 'dark' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-rose-100 text-rose-700 border-rose-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-gray-500 hover:text-rose-600 hover:bg-rose-50',
      bg: theme === 'dark' ? 'bg-rose-500/10' : 'bg-rose-50',
      border: theme === 'dark' ? 'border-rose-500/30' : 'border-rose-200'
    }
  }
  return colorMap[color] || colorMap.cyan
}

// 资源卡片组件
function ResourceCard({
  resource,
  theme,
  isZh,
  onClick,
  featured = false
}: {
  resource: PolarizationResource
  theme: 'dark' | 'light'
  isZh: boolean
  onClick: () => void
  featured?: boolean
}) {
  const hasVideo = resource.metadata?.hasVideo || resource.type === 'video'
  const isSequence = resource.type === 'sequence'
  const hasViews = resource.views && (resource.views.parallel || resource.views.crossed)

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative group rounded-xl overflow-hidden border text-left w-full',
        theme === 'dark'
          ? 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50'
          : 'bg-white border-gray-200 hover:border-cyan-400',
        'transition-all duration-200',
        featured && 'ring-2 ring-amber-500/50'
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 缩略图 */}
      <div className={cn('overflow-hidden relative', featured ? 'aspect-[16/10]' : 'aspect-[4/3]')}>
        <img
          src={resource.thumbnail || resource.url}
          alt={isZh ? resource.titleZh : resource.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {/* 渐变遮罩 */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t opacity-0 group-hover:opacity-100 transition-opacity',
          theme === 'dark'
            ? 'from-slate-900/80 via-transparent to-transparent'
            : 'from-black/50 via-transparent to-transparent'
        )} />

        {/* 类型标签 */}
        <div className="absolute top-2 left-2 flex gap-1">
          {hasVideo && (
            <span className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              theme === 'dark' ? 'bg-purple-500/80 text-white' : 'bg-purple-500 text-white'
            )}>
              <Film className="w-3 h-3" />
              {isZh ? '视频' : 'Video'}
            </span>
          )}
          {isSequence && (
            <span className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              theme === 'dark' ? 'bg-cyan-500/80 text-white' : 'bg-cyan-500 text-white'
            )}>
              <Layers className="w-3 h-3" />
              {isZh ? '序列' : 'Sequence'}
            </span>
          )}
          {hasViews && (
            <span className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              theme === 'dark' ? 'bg-amber-500/80 text-white' : 'bg-amber-500 text-white'
            )}>
              <Eye className="w-3 h-3" />
              {isZh ? '多视图' : 'Views'}
            </span>
          )}
        </div>

        {/* Featured badge */}
        {featured && (
          <div className="absolute top-2 right-2">
            <span className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              'bg-amber-500 text-white'
            )}>
              <Star className="w-3 h-3 fill-white" />
              {isZh ? '精选' : 'Featured'}
            </span>
          </div>
        )}

        {/* 放大图标 */}
        {!featured && (
          <div className={cn(
            'absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity',
            theme === 'dark' ? 'bg-black/60 text-white' : 'bg-white/80 text-gray-700'
          )}>
            <Maximize2 className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className={cn('p-3', featured && 'p-4')}>
        <h4 className={cn(
          'font-medium line-clamp-1',
          featured ? 'text-base' : 'text-sm',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {isZh ? resource.titleZh : resource.title}
        </h4>
        {resource.descriptionZh && (
          <p className={cn(
            'text-xs mt-1',
            featured ? 'line-clamp-3' : 'line-clamp-2',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {isZh ? resource.descriptionZh : resource.description}
          </p>
        )}
      </div>
    </motion.button>
  )
}

// 资源详情模态框
function ResourceModal({
  resource,
  theme,
  isZh,
  onClose
}: {
  resource: PolarizationResource
  theme: 'dark' | 'light'
  isZh: boolean
  onClose: () => void
}) {
  const [activeView, setActiveView] = useState<'main' | 'parallel' | 'crossed'>('main')
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  const hasViews = resource.views && (resource.views.parallel || resource.views.crossed)
  const isSequence = resource.type === 'sequence' && resource.frames && resource.frames.length > 0
  const hasVideo = resource.metadata?.hasVideo && resource.metadata?.videoUrl
  const categoryConfig = CATEGORY_CONFIG[resource.category]

  // 序列自动播放
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // 获取当前显示的图片URL
  const getCurrentImageUrl = () => {
    if (isSequence && resource.frames) {
      return resource.frames[currentFrame]?.url || resource.url
    }
    if (hasViews && activeView !== 'main') {
      return resource.views?.[activeView] || resource.url
    }
    return resource.url
  }

  // 序列播放效果
  useEffect(() => {
    if (!isPlaying || !isSequence || !resource.frames) return

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % (resource.frames?.length || 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, isSequence, resource.frames])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={cn(
          'relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl',
          theme === 'dark' ? 'bg-slate-900' : 'bg-white'
        )}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 z-10 p-2 rounded-full',
            theme === 'dark'
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* 主图/视频区域 */}
        <div className={cn(
          'relative flex items-center justify-center min-h-[300px]',
          theme === 'dark' ? 'bg-slate-800' : 'bg-gray-100'
        )}>
          {showVideo && hasVideo ? (
            <video
              src={resource.metadata?.videoUrl}
              className="max-w-full max-h-[60vh] w-auto h-auto"
              controls
              autoPlay
            />
          ) : (
            <img
              src={getCurrentImageUrl()}
              alt={isZh ? resource.titleZh : resource.title}
              className="max-w-full max-h-[60vh] w-auto h-auto object-contain"
            />
          )}

          {/* 序列控制 */}
          {isSequence && resource.frames && !showVideo && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button
                onClick={() => setCurrentFrame(prev => (prev - 1 + resource.frames!.length) % resource.frames!.length)}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handlePlayPause}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setCurrentFrame(prev => (prev + 1) % resource.frames!.length)}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                {currentFrame + 1} / {resource.frames.length}
              </span>
            </div>
          )}
        </div>

        {/* 视图切换和信息 */}
        <div className="p-6">
          {/* 视图切换按钮 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {hasViews && (
              <>
                <button
                  onClick={() => { setActiveView('main'); setShowVideo(false) }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeView === 'main' && !showVideo
                      ? theme === 'dark'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-cyan-100 text-cyan-700'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-slate-700'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  {isZh ? '正视图' : 'Front View'}
                </button>
                {resource.views?.parallel && (
                  <button
                    onClick={() => { setActiveView('parallel'); setShowVideo(false) }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      activeView === 'parallel' && !showVideo
                        ? theme === 'dark'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-amber-100 text-amber-700'
                        : theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-slate-700'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    {isZh ? '平行偏振' : 'Parallel'}
                  </button>
                )}
                {resource.views?.crossed && (
                  <button
                    onClick={() => { setActiveView('crossed'); setShowVideo(false) }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      activeView === 'crossed' && !showVideo
                        ? theme === 'dark'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-purple-100 text-purple-700'
                        : theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-slate-700'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    {isZh ? '正交偏振' : 'Crossed'}
                  </button>
                )}
              </>
            )}
            {hasVideo && (
              <button
                onClick={() => setShowVideo(true)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                  showVideo
                    ? theme === 'dark'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-purple-100 text-purple-700'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-slate-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <Film className="w-4 h-4" />
                {isZh ? '观看视频' : 'Watch Video'}
              </button>
            )}
          </div>

          {/* 序列帧缩略图 */}
          {isSequence && resource.frames && !showVideo && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {resource.frames.map((frame, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentFrame(i)}
                  className={cn(
                    'flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all',
                    currentFrame === i
                      ? 'border-cyan-400 ring-2 ring-cyan-400/30'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img src={frame.url} alt={frame.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* 类别标签 */}
          {categoryConfig && (
            <div className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium mb-3',
              getColorClasses(categoryConfig.color, theme, true).active
            )}>
              {categoryConfig.icon}
              {isZh ? categoryConfig.labelZh : categoryConfig.labelEn}
            </div>
          )}

          {/* 标题和描述 */}
          <h3 className={cn(
            'text-xl font-bold mb-2',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {isZh ? resource.titleZh : resource.title}
          </h3>
          {resource.description && (
            <p className={cn(
              'text-sm mb-4',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {isZh ? resource.descriptionZh : resource.description}
            </p>
          )}

          {/* 探索问题 */}
          {categoryConfig && (
            <div className={cn(
              'p-3 rounded-lg border-l-3',
              theme === 'dark'
                ? 'bg-purple-500/10 border-purple-500 text-purple-300'
                : 'bg-purple-50 border-purple-500 text-purple-700'
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-semibold">
                  {isZh ? '思考问题' : 'Think About It'}
                </span>
              </div>
              <p className="text-sm italic">
                {isZh ? categoryConfig.explorationQuestionZh : categoryConfig.explorationQuestionEn}
              </p>
            </div>
          )}

          {/* 相关模块 */}
          {resource.relatedModules && resource.relatedModules.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {resource.relatedModules.map(module => (
                <span
                  key={module}
                  className={cn(
                    'px-2 py-1 rounded-full text-xs',
                    theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {module}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// 探索路径卡片
function ExplorationPathCard({
  path,
  theme,
  isZh,
  resourceCount,
  onClick
}: {
  path: typeof EXPLORATION_PATHS[0]
  theme: 'dark' | 'light'
  isZh: boolean
  resourceCount: number
  onClick: () => void
}) {
  const colorClasses = getColorClasses(path.color, theme, false)

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative group rounded-xl border p-4 text-left w-full transition-all',
        colorClasses.bg,
        colorClasses.border,
        theme === 'dark' ? 'hover:border-white/30' : 'hover:border-gray-400'
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2.5 rounded-lg',
          theme === 'dark' ? 'bg-white/10' : 'bg-white'
        )}>
          {path.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-semibold mb-1',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {isZh ? path.titleZh : path.titleEn}
          </h4>
          <p className={cn(
            'text-sm line-clamp-2',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            {isZh ? path.descriptionZh : path.descriptionEn}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              'text-xs',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              {resourceCount} {isZh ? '个资源' : 'resources'}
            </span>
            <ArrowRight className={cn(
              'w-4 h-4 transition-transform group-hover:translate-x-1',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )} />
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// 类别探索卡片
function CategoryExplorationCard({
  category,
  theme,
  isZh,
  resourceCount,
  onClick,
  isActive
}: {
  category: ResourceCategory
  theme: 'dark' | 'light'
  isZh: boolean
  resourceCount: number
  onClick: () => void
  isActive: boolean
}) {
  const config = CATEGORY_CONFIG[category]
  const colorClasses = getColorClasses(config.color, theme, isActive)

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative group rounded-xl border p-4 text-left w-full transition-all',
        isActive ? colorClasses.active : cn(colorClasses.bg, colorClasses.border),
        'hover:shadow-lg'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          'p-2 rounded-lg',
          theme === 'dark' ? 'bg-white/10' : 'bg-white'
        )}>
          {config.icon}
        </div>
        <div>
          <h4 className={cn(
            'font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {isZh ? config.labelZh : config.labelEn}
          </h4>
          <span className={cn(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {resourceCount} {isZh ? '个资源' : 'resources'}
          </span>
        </div>
      </div>
      <p className={cn(
        'text-sm mb-2',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      )}>
        {isZh ? config.descriptionZh : config.descriptionEn}
      </p>
      <div className={cn(
        'text-xs italic flex items-center gap-1',
        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
      )}>
        <Lightbulb className="w-3 h-3" />
        {isZh ? config.explorationQuestionZh : config.explorationQuestionEn}
      </div>
    </motion.button>
  )
}

export function ExperimentResourcesTab({ theme, isZh }: ExperimentResourcesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all')
  const [viewMode, setViewMode] = useState<'explore' | 'grid' | 'list'>('explore')
  const [selectedResource, setSelectedResource] = useState<PolarizationResource | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 获取有资源的类别
  const categoriesWithResources = useMemo(() => {
    const categories = Object.keys(CATEGORY_CONFIG) as ResourceCategory[]
    return categories.filter(cat => getResourcesByCategory(cat).length > 0)
  }, [])

  // 筛选资源
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

  // 按类别分组
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

  // 精选资源（每个类别选一个代表性的）
  const featuredResources = useMemo(() => {
    return categoriesWithResources.slice(0, 4).map(cat => {
      const resources = getResourcesByCategory(cat)
      return resources[0]
    }).filter(Boolean)
  }, [categoriesWithResources])

  // 随机发现
  const handleRandomDiscovery = () => {
    const randomIndex = Math.floor(Math.random() * POLARIZATION_RESOURCES.length)
    setSelectedResource(POLARIZATION_RESOURCES[randomIndex])
  }

  // 选择探索路径
  const handleSelectPath = (path: typeof EXPLORATION_PATHS[0]) => {
    // 选择第一个类别
    if (path.categories.length > 0) {
      setSelectedCategory(path.categories[0])
      setViewMode('grid')
    }
  }

  // 计算探索路径的资源数量
  const getPathResourceCount = (path: typeof EXPLORATION_PATHS[0]) => {
    return path.categories.reduce((count, cat) => count + getResourcesByCategory(cat).length, 0)
  }

  return (
    <div className="space-y-6">
      {/* 探索式介绍 */}
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

      {/* 探索路径 */}
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

          {/* 精选发现 */}
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

          {/* 按类别探索 */}
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

      {/* 网格/列表视图 */}
      {(viewMode === 'grid' || viewMode === 'list') && (
        <>
          {/* 工具栏 */}
          <div className={cn(
            'flex flex-wrap items-center gap-3 p-4 rounded-xl border',
            theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'
          )}>
            {/* 返回探索模式 */}
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

            {/* 搜索框 */}
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

            {/* 类别筛选 */}
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

            {/* 视图切换 */}
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

          {/* 资源展示 */}
          {selectedCategory === 'all' ? (
            // 按类别分组展示
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
            // 单类别展示
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

          {/* 无结果提示 */}
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

      {/* 资源详情模态框 */}
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

export default ExperimentResourcesTab
