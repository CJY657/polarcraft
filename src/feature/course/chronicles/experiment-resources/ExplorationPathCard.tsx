import { motion } from 'framer-motion'
import { cn } from '@/utils/classNames'
import { ArrowRight } from 'lucide-react'
import type { ExplorationPath } from './config'
import { getColorClasses } from './config'

export interface ExplorationPathCardProps {
  path: ExplorationPath
  theme: 'dark' | 'light'
  isZh: boolean
  resourceCount: number
  onClick: () => void
}

export function ExplorationPathCard({
  path,
  theme,
  isZh,
  resourceCount,
  onClick
}: ExplorationPathCardProps) {
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
