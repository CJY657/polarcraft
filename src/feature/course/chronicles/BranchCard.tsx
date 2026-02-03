/**
 * BranchCard - 分支卡片
 * 玻璃拟态卡片，支持选中/高亮状态
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'
import { cn } from '@/utils/classNames'
import { CATEGORY_COLORS, type CategoryColorKey } from '@/data/chronicles-constants'

export interface BranchCardProps {
  branch: {
    id: string
    nameEn: string
    nameZh: string
    descEn: string
    descZh: string
    category: CategoryColorKey
    scaleEn: string
    scaleZh: string
    isHighlight?: boolean
    topics: { en: string; zh: string }[]
    icon: React.ReactNode
  }
  isSelected: boolean
  isZh: boolean
  theme: 'dark' | 'light'
  onClick: () => void
  onHover: (isHovered: boolean) => void
  index: number
}

export function BranchCard({ branch, isSelected, isZh, theme, onClick, onHover, index }: BranchCardProps) {
  const colors = theme === 'dark' ? CATEGORY_COLORS[branch.category].dark : CATEGORY_COLORS[branch.category].light
  const isHero = branch.isHighlight

  return (
    <motion.div
      className={cn(
        'relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300',
        'backdrop-blur-sm',
        isHero ? 'col-span-full lg:col-span-1 lg:row-span-2' : '',
        theme === 'dark'
          ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80'
          : 'bg-gradient-to-br from-white/80 to-gray-50/80'
      )}
      style={{
        borderColor: isSelected ? colors.stroke : 'transparent',
        boxShadow: isSelected
          ? `0 0 20px ${colors.stroke}40, 0 4px 20px rgba(0,0,0,0.1)`
          : '0 4px 20px rgba(0,0,0,0.1)',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isSelected ? 1.02 : 1,
      }}
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Hero 卡片特殊发光效果 */}
      {isHero && (
        <motion.div
          className="absolute -inset-1 rounded-2xl opacity-50"
          style={{
            background: `linear-gradient(135deg, ${colors.stroke}20, transparent, ${colors.stroke}10)`,
          }}
          animate={{
            opacity: isSelected ? [0.3, 0.6, 0.3] : 0.2,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* 卡片内容 */}
      <div className={cn('relative z-10', isHero ? 'space-y-3' : 'space-y-2')}>
        {/* 图标和标题行 */}
        <div className="flex items-center gap-3">
          <motion.div
            className={cn(
              'p-2 rounded-xl',
              isHero ? 'p-3' : 'p-2'
            )}
            style={{ backgroundColor: `${colors.stroke}20` }}
            animate={isHero && isSelected ? {
              boxShadow: [`0 0 0px ${colors.stroke}`, `0 0 20px ${colors.stroke}`, `0 0 0px ${colors.stroke}`],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {branch.icon}
          </motion.div>
          <div>
            <h4
              className={cn('font-bold', isHero ? 'text-lg' : 'text-sm')}
              style={{ color: colors.text }}
            >
              {isZh ? branch.nameZh : branch.nameEn}
            </h4>
            <p className={cn(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              {isZh ? branch.scaleZh : branch.scaleEn}
            </p>
          </div>
        </div>

        {/* 描述 */}
        <p className={cn(
          isHero ? 'text-sm' : 'text-xs',
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        )}>
          {isZh ? branch.descZh : branch.descEn}
        </p>

        {/* 主题标签 */}
        <div className="flex flex-wrap gap-1.5">
          {branch.topics.slice(0, isHero ? 4 : 2).map((topic, i) => (
            <motion.span
              key={i}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100'
              )}
              style={{ color: colors.text }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + i * 0.05 + 0.3 }}
            >
              {isZh ? topic.zh : topic.en}
            </motion.span>
          ))}
        </div>

        {/* Hero 卡片专属标记 */}
        {isHero && (
          <motion.div
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
              theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
            )}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Star className="w-3 h-3" />
            {isZh ? '本课程核心' : 'Course Focus'}
          </motion.div>
        )}
      </div>

      {/* 选中指示器 */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute top-2 right-2 w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.stroke }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
