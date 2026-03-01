import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/classNames'
import {
  X, ChevronLeft, ChevronRight, Play, Pause, Film, HelpCircle
} from 'lucide-react'
import type { PolarizationResource } from '@/data/resource-gallery'
import { CATEGORY_CONFIG, getColorClasses } from './config'

export interface ResourceModalProps {
  resource: PolarizationResource
  theme: 'dark' | 'light'
  isZh: boolean
  onClose: () => void
}

export function ResourceModal({
  resource,
  theme,
  isZh,
  onClose
}: ResourceModalProps) {
  const [activeView, setActiveView] = useState<'main' | 'parallel' | 'crossed'>('main')
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  const hasViews = resource.views && (resource.views.parallel || resource.views.crossed)
  const isSequence = resource.type === 'sequence' && resource.frames && resource.frames.length > 0
  const hasVideo = resource.metadata?.hasVideo && resource.metadata?.videoUrl
  const categoryConfig = CATEGORY_CONFIG[resource.category]

  // Sequence auto-play
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // Get current image URL
  const getCurrentImageUrl = () => {
    if (isSequence && resource.frames) {
      return resource.frames[currentFrame]?.url || resource.url
    }
    if (hasViews && activeView !== 'main') {
      return resource.views?.[activeView] || resource.url
    }
    return resource.url
  }

  // Sequence playback effect
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
        {/* Close button */}
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

        {/* Main image/video area */}
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

          {/* Sequence controls */}
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

        {/* View toggle and info */}
        <div className="p-6">
          {/* View toggle buttons */}
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

          {/* Sequence frame thumbnails */}
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

          {/* Category tag */}
          {categoryConfig && (
            <div className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium mb-3',
              getColorClasses(categoryConfig.color, theme, true).active
            )}
            >
              {categoryConfig.icon}
              {isZh ? categoryConfig.labelZh : categoryConfig.labelEn}
            </div>
          )}

          {/* Title and description */}
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

          {/* Exploration question */}
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

          {/* Related modules */}
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
