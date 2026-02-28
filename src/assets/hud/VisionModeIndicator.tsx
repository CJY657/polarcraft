import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { cn } from '@/lib/utils'

export function VisionModeIndicator() {
  const { t } = useTranslation()
  const { visionMode, toggleVisionMode } = useGameStore()

  const isPolarized = visionMode === 'polarized'

  return (
    <button
      onClick={toggleVisionMode}
      aria-label={t('game.toggleVisionMode')}
      aria-pressed={isPolarized}
      className={cn(
        "px-4 py-3 rounded-lg text-sm transition-all duration-300",
        "border cursor-pointer",
        isPolarized
          ? "bg-red-900/70 border-red-500/50 text-red-200"
          : "bg-black/70 border-cyan-400/30 text-gray-300"
      )}
    >
      {isPolarized ? `🔴 ${t('game.polarizedVision')}` : `👁 ${t('game.normalVision')}`}
    </button>
  )
}
