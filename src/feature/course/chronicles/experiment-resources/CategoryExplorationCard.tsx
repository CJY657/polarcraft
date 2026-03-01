import { motion } from 'framer-motion'
import { cn } from '@/utils/classNames'
import { Lightbulb } from 'lucide-react'
import type { ResourceCategory } from '@/data/resource-gallery'
import { CATEGORY_CONFIG, getColorClasses } from './config'

export interface CategoryExplorationCardProps {
  category: ResourceCategory
  theme: 'dark' | 'light'
  isZh: boolean
  resourceCount: number
  onClick: () => void
  isActive: boolean
}

export function CategoryExplorationCard({
  category,
  theme,
  isZh,
  resourceCount,
  onClick,
  isActive
}: CategoryExplorationCardProps) {
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
