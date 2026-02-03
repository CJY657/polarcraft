/**
 * SpectrumScaleBar - 电磁波谱条
 * 底部光谱可视化，支持 Hover 高亮
 */

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/classNames'
import {
  CATEGORY_COLORS,
  BRANCH_SPECTRUM_REGIONS,
  BRANCH_SPECTRUM_POSITIONS,
  type CategoryColorKey
} from '@/data/chronicles-constants'

export interface SpectrumScaleBarProps {
  activeBranch: string | null
  theme: 'dark' | 'light'
  isZh: boolean
  onHover?: (branch: string | null) => void
}

export function SpectrumScaleBar({ activeBranch, theme, isZh, onHover }: SpectrumScaleBarProps) {
  const getColor = (category: CategoryColorKey | null) => {
    if (!category) return theme === 'dark'
      ? { bg: '#374151', stroke: '#6b7280', text: '#9ca3af' }
      : { bg: '#e5e7eb', stroke: '#9ca3af', text: '#6b7280' }
    return theme === 'dark' ? CATEGORY_COLORS[category].dark : CATEGORY_COLORS[category].light
  }

  const branchOrder = ['geometric', 'wave', 'polarization', 'quantum'] as const

  return (
    <div className="mt-8 px-4">
      {/* 标题 */}
      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className={cn(
          'text-sm font-medium',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          {isZh ? '光学分支与电磁波谱对应关系' : 'Optical Branches Mapped to Electromagnetic Spectrum'}
        </span>
      </motion.div>

      {/* 光谱条容器 */}
      <div className="relative h-32">
        {/* 分支标签 - 横向排列在光谱上方 */}
        <div className="absolute left-0 right-0 top-0 h-12">
          {branchOrder.map((branchId, index) => {
            const branch = BRANCH_SPECTRUM_POSITIONS[branchId]
            const colors = getColor(branchId)
            const isActive = activeBranch === branchId

            return (
              <motion.div
                key={branchId}
                className="absolute flex flex-col items-center cursor-pointer"
                style={{ left: `${branch.center}%`, transform: 'translateX(-50%)' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onMouseEnter={() => onHover?.(branchId)}
                onMouseLeave={() => onHover?.(null)}
              >
                {/* 分支名称 */}
                <motion.span
                  className={cn(
                    'text-xs font-bold px-2 py-1 rounded-md transition-all duration-200',
                    isActive ? 'scale-110' : 'scale-100'
                  )}
                  style={{
                    color: colors.stroke,
                    backgroundColor: isActive ? `${colors.stroke}20` : 'transparent',
                  }}
                  animate={isActive ? {
                    boxShadow: [`0 0 0px ${colors.stroke}`, `0 0 8px ${colors.stroke}`, `0 0 0px ${colors.stroke}`],
                  } : {}}
                  transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                >
                  {isZh ? branch.labelZh : branch.labelEn}
                </motion.span>

                {/* 连接线到光谱 */}
                <motion.div
                  className="w-0.5 rounded-full"
                  style={{
                    backgroundColor: colors.stroke,
                    height: isActive ? 16 : 10,
                    opacity: isActive ? 1 : 0.5,
                  }}
                  animate={{ height: isActive ? 16 : 10 }}
                />
              </motion.div>
            )
          })}
        </div>

        {/* 主光谱渐变条 */}
        <motion.div
          className="absolute left-0 right-0 top-14 h-5 rounded-full overflow-hidden"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
          style={{ transformOrigin: 'left' }}
        >
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(to right,
                #dc2626 0%,
                #f97316 15%,
                #eab308 25%,
                #22c55e 40%,
                #06b6d4 55%,
                #3b82f6 70%,
                #8b5cf6 85%,
                #ec4899 100%
              )`,
            }}
          />
          {/* 暗化遮罩（非可见光区域） */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right,
                ${theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)'} 0%,
                ${theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)'} 30%,
                transparent 35%,
                transparent 55%,
                ${theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)'} 60%,
                ${theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)'} 100%
              )`,
            }}
          />
        </motion.div>

        {/* 分支高亮区域 */}
        <AnimatePresence>
          {activeBranch && BRANCH_SPECTRUM_REGIONS[activeBranch as keyof typeof BRANCH_SPECTRUM_REGIONS] && (
            <motion.div
              className="absolute top-[52px] h-7 rounded-full border-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                left: `${BRANCH_SPECTRUM_REGIONS[activeBranch as keyof typeof BRANCH_SPECTRUM_REGIONS].start}%`,
                width: `${BRANCH_SPECTRUM_REGIONS[activeBranch as keyof typeof BRANCH_SPECTRUM_REGIONS].end - BRANCH_SPECTRUM_REGIONS[activeBranch as keyof typeof BRANCH_SPECTRUM_REGIONS].start}%`,
                borderColor: getColor(activeBranch as CategoryColorKey).stroke,
                boxShadow: `0 0 15px ${getColor(activeBranch as CategoryColorKey).stroke}`,
              }}
            />
          )}
        </AnimatePresence>

        {/* 波长刻度 - 在光谱下方
            科学数据来源：标准电磁波谱分类 */}
        <div className="absolute left-0 right-0 top-[82px] flex justify-between px-4">
          {[
            { pos: 5, label: '>1m', labelZh: '无线电' },
            { pos: 20, label: '1mm-1m', labelZh: '微波' },
            { pos: 35, label: '780nm-1mm', labelZh: '红外' },
            { pos: 45, label: '380-780nm', labelZh: '可见光' },
            { pos: 60, label: '10-380nm', labelZh: '紫外' },
            { pos: 75, label: '0.01-10nm', labelZh: 'X射线' },
            { pos: 92, label: '<0.01nm', labelZh: 'γ射线' },
          ].map((scale, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 + index * 0.05 }}
            >
              <span className={cn(
                'text-[9px]',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                {scale.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 波长方向指示 */}
      <div className="flex justify-between mt-2 px-2">
        <span className={cn('text-[10px]', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
          {isZh ? '← 长波 (低能)' : '← Long λ (Low E)'}
        </span>
        <motion.span
          className={cn(
            'text-[10px] px-2 py-0.5 rounded-full',
            theme === 'dark' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {isZh ? '可见光区' : 'Visible Light'}
        </motion.span>
        <span className={cn('text-[10px]', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
          {isZh ? '短波 (高能) →' : 'Short λ (High E) →'}
        </span>
      </div>
    </div>
  )
}
