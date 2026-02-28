import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { BlockType } from '@/core/types'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

// 方块分类
const BASIC_BLOCKS: Array<{
  type: BlockType
  key: string
  icon: string
  labelKey: string
  color: string
}> = [
  { type: 'emitter', key: '1', icon: '💡', labelKey: 'game.blocks.emitter', color: 'orange' },
  { type: 'polarizer', key: '2', icon: '▤', labelKey: 'game.blocks.polarizer', color: 'cyan' },
  { type: 'rotator', key: '3', icon: '↻', labelKey: 'game.blocks.rotator', color: 'purple' },
  { type: 'splitter', key: '4', icon: '◇', labelKey: 'game.blocks.splitter', color: 'cyan' },
  { type: 'sensor', key: '5', icon: '◎', labelKey: 'game.blocks.sensor', color: 'green' },
  { type: 'mirror', key: '6', icon: '▯', labelKey: 'game.blocks.mirror', color: 'blue' },
  { type: 'solid', key: '7', icon: '■', labelKey: 'game.blocks.solid', color: 'slate' },
]

const ADVANCED_BLOCKS: Array<{
  type: BlockType
  key: string
  icon: string
  labelKey: string
  color: string
}> = [
  { type: 'prism', key: '8', icon: '△', labelKey: 'game.blocks.prism', color: 'rainbow' },
  { type: 'lens', key: '9', icon: '⬭', labelKey: 'game.blocks.lens', color: 'blue' },
  { type: 'beamSplitter', key: '0', icon: '⊠', labelKey: 'game.blocks.beamSplitter', color: 'cyan' },
  { type: 'quarterWave', key: 'Q', icon: '¼', labelKey: 'game.blocks.quarterWave', color: 'purple' },
  { type: 'halfWave', key: 'W', icon: '½', labelKey: 'game.blocks.halfWave', color: 'pink' },
  { type: 'absorber', key: 'E', icon: '▣', labelKey: 'game.blocks.absorber', color: 'gray' },
  { type: 'phaseShifter', key: 'F', icon: '◉', labelKey: 'game.blocks.phaseShifter', color: 'teal' },
  { type: 'portal', key: 'P', icon: '⊛', labelKey: 'game.blocks.portal', color: 'emerald' },
]

// 颜色映射
const COLOR_CLASSES: Record<string, { border: string; shadow: string }> = {
  orange: { border: 'border-orange-400', shadow: 'shadow-[0_0_15px_rgba(255,180,100,0.5)]' },
  cyan: { border: 'border-cyan-400', shadow: 'shadow-[0_0_15px_rgba(100,200,255,0.5)]' },
  purple: { border: 'border-purple-400', shadow: 'shadow-[0_0_15px_rgba(180,100,255,0.5)]' },
  green: { border: 'border-green-400', shadow: 'shadow-[0_0_15px_rgba(100,255,150,0.5)]' },
  blue: { border: 'border-blue-400', shadow: 'shadow-[0_0_15px_rgba(100,150,255,0.5)]' },
  slate: { border: 'border-slate-400', shadow: 'shadow-[0_0_10px_rgba(150,150,180,0.3)]' },
  rainbow: { border: 'border-red-400', shadow: 'shadow-[0_0_15px_rgba(255,100,100,0.5)]' },
  pink: { border: 'border-pink-400', shadow: 'shadow-[0_0_15px_rgba(255,100,200,0.5)]' },
  gray: { border: 'border-gray-400', shadow: 'shadow-[0_0_10px_rgba(150,150,150,0.3)]' },
  teal: { border: 'border-teal-400', shadow: 'shadow-[0_0_15px_rgba(100,220,200,0.5)]' },
  emerald: { border: 'border-emerald-400', shadow: 'shadow-[0_0_15px_rgba(100,255,180,0.5)]' },
}

export function BlockSelector() {
  const { t } = useTranslation()
  const { selectedBlockType, setSelectedBlockType } = useGameStore()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { isMobile, isTablet } = useIsMobile()

  const currentBlocks = showAdvanced ? ADVANCED_BLOCKS : BASIC_BLOCKS

  // On mobile, show fewer blocks per row with scrolling
  const isCompact = isMobile || isTablet

  return (
    <div className={cn(
      "absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2",
      isCompact ? "bottom-2 w-[calc(100%-16px)] max-w-md" : "bottom-5"
    )}>
      {/* 展开/收起按钮 */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        aria-label={showAdvanced ? t('game.showBasicBlocks') : t('game.showAdvancedBlocks')}
        aria-expanded={showAdvanced}
        className={cn(
          "px-3 py-1 rounded-lg text-xs font-bold transition-all",
          "bg-slate-800/80 border border-slate-600/50",
          "hover:bg-slate-700/80 hover:border-cyan-400/50",
          "flex items-center gap-1",
          isCompact && "text-[10px] px-2"
        )}
      >
        {showAdvanced ? (
          <>
            <ChevronDown className="w-3 h-3" />
            <span>{t('common.back')}: 1-7</span>
          </>
        ) : (
          <>
            <ChevronUp className="w-3 h-3" />
            <span>More: 8-0,Q,W,E,F,P</span>
          </>
        )}
      </button>

      {/* 方块选择器 - 移动端可横向滚动 */}
      <div className={cn(
        "bg-black/80 rounded-xl border border-cyan-400/30",
        isCompact
          ? "flex gap-1 p-1.5 overflow-x-auto max-w-full scrollbar-hide"
          : "flex gap-1.5 p-2.5"
      )}>
        {currentBlocks.map(({ type, key, icon, labelKey, color }) => {
          const colors = COLOR_CLASSES[color] || COLOR_CLASSES.cyan
          return (
            <button
              key={type}
              onClick={() => setSelectedBlockType(type)}
              aria-label={`${t(labelKey)} (${key})`}
              aria-pressed={selectedBlockType === type}
              className={cn(
                "relative flex flex-col items-center justify-center flex-shrink-0",
                "bg-slate-700/60 border-2 border-slate-600/50 rounded-lg",
                "transition-all duration-200 cursor-pointer active:scale-95",
                "hover:border-cyan-400/80 hover:bg-slate-600/80",
                selectedBlockType === type && [colors.border, colors.shadow],
                isCompact ? "w-10 h-10" : "w-12 h-12"
              )}
            >
              {!isCompact && (
                <span className="absolute top-0.5 left-1 text-[8px] text-gray-500">
                  {key}
                </span>
              )}
              <span className={cn("mb-0.5", isCompact ? "text-base" : "text-lg")}>{icon}</span>
              {!isCompact && (
                <span className="text-[7px] text-gray-400 truncate max-w-[40px]">
                  {t(labelKey)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 移动端显示选中方块名称 */}
      {isCompact && selectedBlockType && (
        <div className="text-[10px] text-cyan-400 bg-black/60 px-2 py-0.5 rounded">
          {t(`game.blocks.${selectedBlockType}`)}
        </div>
      )}
    </div>
  )
}
