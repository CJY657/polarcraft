import { motion } from 'framer-motion'
import { cn } from '@/utils/classNames'
import { Film, Layers, Eye, Maximize2, Star } from 'lucide-react'
import type { PolarizationResource } from '@/data/resource-gallery'

export interface ResourceCardProps {
  resource: PolarizationResource
  theme: 'dark' | 'light'
  isZh: boolean
  onClick: () => void
  featured?: boolean
}

export function ResourceCard({
  resource,
  theme,
  isZh,
  onClick,
  featured = false
}: ResourceCardProps) {
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
      {/* Thumbnail */}
      <div className={cn('overflow-hidden relative', featured ? 'aspect-[16/10]' : 'aspect-[4/3]')}>
        <img
          src={resource.thumbnail || resource.url}
          alt={isZh ? resource.titleZh : resource.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {/* Gradient overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t opacity-0 group-hover:opacity-100 transition-opacity',
          theme === 'dark'
            ? 'from-slate-900/80 via-transparent to-transparent'
            : 'from-black/50 via-transparent to-transparent'
        )} />

        {/* Type badges */}
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

        {/* Maximize icon */}
        {!featured && (
          <div className={cn(
            'absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity',
            theme === 'dark' ? 'bg-black/60 text-white' : 'bg-white/80 text-gray-700'
          )}>
            <Maximize2 className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Info */}
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
