/**
 * Helper components shared by multiple blocks
 */
import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { POLARIZATION_COLORS, PolarizationAngle } from '@/core/types'

interface PolarizationIndicatorProps {
  angle: number
  rotation: number
  offset?: number
}

export function PolarizationIndicator({ angle, rotation, offset = 0.06 }: PolarizationIndicatorProps) {
  const color = POLARIZATION_COLORS[angle as PolarizationAngle] || 0xffffff
  const radians = (angle * Math.PI) / 180
  const length = 0.35

  const points: [number, number, number][] = [
    [-Math.cos(radians) * length, -Math.sin(radians) * length, offset],
    [Math.cos(radians) * length, Math.sin(radians) * length, offset],
  ]

  return (
    <group rotation={[0, rotation, 0]}>
      <Line points={points} color={color} lineWidth={3} />
      {/* Arrow head */}
      <mesh position={[Math.cos(radians) * length, Math.sin(radians) * length, offset + 0.02]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

interface PolarizationGridLinesProps {
  angle: number
  rotation: number
}

export function PolarizationGridLines({ angle, rotation }: PolarizationGridLinesProps) {
  const radians = (angle * Math.PI) / 180
  const lineCount = 7

  const lines = useMemo(() => {
    const result: Array<[number, number, number][]> = []
    for (let i = 0; i < lineCount; i++) {
      const offset = (i - (lineCount - 1) / 2) * 0.12
      const perpX = -Math.sin(radians) * offset
      const perpY = Math.cos(radians) * offset

      result.push([
        [perpX - Math.cos(radians) * 0.4, perpY - Math.sin(radians) * 0.4, 0],
        [perpX + Math.cos(radians) * 0.4, perpY + Math.sin(radians) * 0.4, 0],
      ])
    }
    return result
  }, [angle, radians])

  const color = POLARIZATION_COLORS[angle as PolarizationAngle] || 0x00aaff

  return (
    <group rotation={[0, rotation, 0]}>
      {lines.map((points, i) => (
        <Line key={i} points={points} color={color} lineWidth={1} transparent opacity={0.6} />
      ))}
    </group>
  )
}

interface SpiralDecorationProps {
  rotation: number
  is90: boolean
}

export function SpiralDecoration({ rotation, is90 }: SpiralDecorationProps) {
  const spiralPoints = useMemo(() => {
    const points: [number, number, number][] = []
    const turns = is90 ? 0.5 : 0.25
    const segments = 20

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const angle = t * turns * Math.PI * 2
      const r = 0.1 + t * 0.25
      points.push([
        Math.cos(angle) * r,
        t * 0.2 - 0.1,
        Math.sin(angle) * r,
      ])
    }
    return points
  }, [is90])

  return (
    <group rotation={[0, rotation, 0]}>
      <Line
        points={spiralPoints}
        color={is90 ? 0xcc00ff : 0xff66ff}
        lineWidth={2}
      />
    </group>
  )
}
