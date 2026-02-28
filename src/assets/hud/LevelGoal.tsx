import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { cn } from '@/lib/utils'

interface SensorStatus {
  position: { x: number; y: number; z: number }
  activated: boolean
}

export function LevelGoal() {
  const { t } = useTranslation()
  const { world, currentLevel, isLevelComplete, nextLevel } = useGameStore()
  const [sensors, setSensors] = useState<SensorStatus[]>([])

  useEffect(() => {
    if (!world || !currentLevel?.goal?.sensorPositions) return

    const sensorPositions = currentLevel.goal.sensorPositions

    const updateSensors = () => {
      const sensorStatuses = sensorPositions.map(pos => {
        const block = world.getBlock(pos.x, pos.y, pos.z)
        return {
          position: pos,
          activated: block?.type === 'sensor' && block.activated,
        }
      })
      setSensors(sensorStatuses)
    }

    updateSensors()
    world.addListener(updateSensors)

    return () => {
      world.removeListener(updateSensors)
    }
  }, [world, currentLevel])

  if (!currentLevel?.goal?.sensorPositions) return null

  const activatedCount = sensors.filter(s => s.activated).length
  const totalCount = sensors.length

  return (
    <div className="bg-black/80 p-4 rounded-lg border border-green-500/30 min-w-[180px]">
      <h4 className="text-green-400 mb-2.5 text-xs uppercase tracking-wider font-semibold">
        🎯 {t('game.levelGoal')}
      </h4>

      <div className="space-y-1.5">
        {sensors.map((sensor, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs",
              sensor.activated ? "text-green-400" : "text-gray-400"
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px]",
                sensor.activated
                  ? "bg-green-400 border-green-400 text-black"
                  : "border-current"
              )}
            >
              {sensor.activated && '✓'}
            </div>
            <span>{t('game.sensor')} {index + 1}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{t('game.progress')}</span>
          <span>{activatedCount}/{totalCount}</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 transition-all duration-300 rounded-full"
            style={{ width: `${(activatedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Completion message */}
      {isLevelComplete && (
        <div className="mt-3 pt-3 border-t border-green-500/30">
          <div className="text-green-400 text-sm font-medium mb-2">
            🎉 {t('game.levelComplete')}
          </div>
          <button
            onClick={nextLevel}
            className="w-full px-3 py-2 bg-green-500/20 border border-green-500/50
                       rounded-lg text-green-400 text-xs
                       hover:bg-green-500/30 transition-colors"
          >
            {t('game.nextLevel')} →
          </button>
        </div>
      )}
    </div>
  )
}
