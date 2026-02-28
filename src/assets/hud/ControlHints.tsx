/**
 * ControlHints - Shows contextual control hints based on camera mode and device
 * Monument Valley-inspired minimal design with mobile touch support
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore, CameraMode } from '@/stores/gameStore'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'

interface ControlHint {
  key: string
  action: string
}

// Desktop control hints
const DESKTOP_HINTS: Record<CameraMode, { en: ControlHint[]; zh: ControlHint[] }> = {
  'first-person': {
    en: [
      { key: 'WASD', action: 'Move' },
      { key: 'Mouse', action: 'Look around' },
      { key: 'Click', action: 'Place/Remove' },
      { key: 'ESC', action: 'Exit view' },
    ],
    zh: [
      { key: 'WASD', action: '移动' },
      { key: '鼠标', action: '环顾' },
      { key: '点击', action: '放置/删除' },
      { key: 'ESC', action: '退出视角' },
    ],
  },
  'isometric': {
    en: [
      { key: 'Drag', action: 'Rotate view' },
      { key: 'Right drag', action: 'Pan' },
      { key: 'Scroll', action: 'Zoom' },
      { key: 'Click', action: 'Place/Remove' },
    ],
    zh: [
      { key: '拖动', action: '旋转视角' },
      { key: '右键拖动', action: '平移' },
      { key: '滚轮', action: '缩放' },
      { key: '点击', action: '放置/删除' },
    ],
  },
  'top-down': {
    en: [
      { key: 'Right drag', action: 'Pan' },
      { key: 'Scroll', action: 'Zoom' },
      { key: 'Click', action: 'Place/Remove' },
      { key: 'R', action: 'Rotate block' },
    ],
    zh: [
      { key: '右键拖动', action: '平移' },
      { key: '滚轮', action: '缩放' },
      { key: '点击', action: '放置/删除' },
      { key: 'R', action: '旋转方块' },
    ],
  },
}

// Mobile/Touch control hints
const TOUCH_HINTS: Record<CameraMode, { en: ControlHint[]; zh: ControlHint[] }> = {
  'first-person': {
    en: [
      { key: '1 finger', action: 'Rotate view' },
      { key: 'Tap', action: 'Place/Remove' },
      { key: '2 fingers', action: 'Zoom' },
    ],
    zh: [
      { key: '单指', action: '旋转视角' },
      { key: '点击', action: '放置/删除' },
      { key: '双指', action: '缩放' },
    ],
  },
  'isometric': {
    en: [
      { key: '1 finger', action: 'Rotate view' },
      { key: '2 fingers', action: 'Zoom/Pan' },
      { key: 'Tap', action: 'Place/Remove' },
    ],
    zh: [
      { key: '单指', action: '旋转视角' },
      { key: '双指', action: '缩放/平移' },
      { key: '点击', action: '放置/删除' },
    ],
  },
  'top-down': {
    en: [
      { key: '2 fingers', action: 'Zoom/Pan' },
      { key: 'Tap', action: 'Place/Remove' },
      { key: 'Long press', action: 'Rotate block' },
    ],
    zh: [
      { key: '双指', action: '缩放/平移' },
      { key: '点击', action: '放置/删除' },
      { key: '长按', action: '旋转方块' },
    ],
  },
}

export function ControlHints() {
  const { t, i18n } = useTranslation()
  void t
  const { cameraMode } = useGameStore()
  const { isMobile, isTablet, isTouchDevice } = useIsMobile()
  const [isVisible, setIsVisible] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)

  const isZh = i18n.language === 'zh'
  const isCompact = isMobile || isTablet

  // Choose hints based on device type
  const hintSource = isTouchDevice ? TOUCH_HINTS : DESKTOP_HINTS
  const hints = hintSource[cameraMode][isZh ? 'zh' : 'en']

  // Hide hints after user starts interacting
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true)
    }

    window.addEventListener('mousedown', handleInteraction)
    window.addEventListener('keydown', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)

    return () => {
      window.removeEventListener('mousedown', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
    }
  }, [])

  // Auto-hide after interaction, but show again when mode changes
  useEffect(() => {
    setIsVisible(true)
    setHasInteracted(false)

    const timer = setTimeout(() => {
      if (hasInteracted) {
        setIsVisible(false)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [cameraMode])

  // Hide after some time if user has interacted
  useEffect(() => {
    if (hasInteracted) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [hasInteracted])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'absolute left-1/2 -translate-x-1/2 transition-all duration-500',
        'rounded-xl bg-black/60 backdrop-blur-sm border border-cyan-400/20',
        hasInteracted && 'opacity-50',
        isCompact
          ? 'bottom-20 flex flex-wrap justify-center gap-2 px-3 py-2 max-w-[90vw]'
          : 'bottom-28 flex items-center gap-3 px-4 py-2'
      )}
    >
      {hints.map((hint, i) => (
        <div key={i} className={cn(
          "flex items-center gap-1.5",
          isCompact ? "text-[10px]" : "text-xs"
        )}>
          <span className={cn(
            "rounded bg-cyan-400/20 text-cyan-400 font-mono",
            isCompact ? "px-1 py-0.5 text-[9px]" : "px-1.5 py-0.5 text-[10px]"
          )}>
            {hint.key}
          </span>
          <span className="text-gray-400">{hint.action}</span>
          {!isCompact && i < hints.length - 1 && <span className="text-gray-600 ml-2">•</span>}
        </div>
      ))}
    </div>
  )
}
