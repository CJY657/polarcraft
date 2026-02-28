import { useGameStore } from '@/stores/gameStore'

export function Crosshair() {
  const cameraMode = useGameStore((state) => state.cameraMode)

  // Only show crosshair in first-person mode
  if (cameraMode !== 'first-person') return null

  return <div className="crosshair" />
}
