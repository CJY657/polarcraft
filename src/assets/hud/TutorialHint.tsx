import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { cn } from '@/lib/utils'

export function TutorialHint() {
  const { tutorialHints, currentHintIndex, showHint, showNextHint, hideHint } = useGameStore()

  const currentHint = tutorialHints[currentHintIndex]

  // Auto-advance hints after a delay
  useEffect(() => {
    if (!showHint || !currentHint) return

    const timer = setTimeout(() => {
      showNextHint()
    }, 8000) // 8 seconds per hint

    return () => clearTimeout(timer)
  }, [showHint, currentHintIndex, currentHint, showNextHint])

  if (!showHint || !currentHint) return null

  // Parse hint text for keyboard keys
  const renderHintText = (text: string) => {
    // Simple parsing for key hints like "按 R 旋转"
    return text.split(/(\s[A-Z]\s)/).map((part, index) => {
      if (/^\s[A-Z]\s$/.test(part)) {
        const key = part.trim()
        return (
          <span
            key={index}
            className="mx-1 px-2 py-0.5 bg-cyan-400/20 rounded text-cyan-400 font-mono"
          >
            {key}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div
      className={cn(
        "absolute bottom-[120px] left-1/2 -translate-x-1/2",
        "bg-black/90 px-6 py-4 rounded-xl border border-orange-400/50",
        "text-sm text-center max-w-[500px]",
        "animate-fade-in-up"
      )}
    >
      <span className="text-orange-400 mr-2">💡</span>
      <span className="text-gray-300">{renderHintText(currentHint)}</span>

      {/* Hint progress dots */}
      {tutorialHints.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {tutorialHints.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                index === currentHintIndex
                  ? "bg-orange-400"
                  : index < currentHintIndex
                  ? "bg-orange-400/50"
                  : "bg-gray-600"
              )}
            />
          ))}
        </div>
      )}

      {/* Skip button */}
      <button
        onClick={hideHint}
        className="absolute top-1 right-2 text-gray-500 hover:text-gray-300 text-xs"
      >
        ✕
      </button>
    </div>
  )
}
