import { useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { World } from '@/core/World'
import { LightState, LightPacket, BlockPosition, POLARIZATION_COLORS, DIRECTION_VECTORS } from '@/core/types'
import { VisionMode } from '@/stores/gameStore'

interface LightBeamsProps {
  world: World
  visionMode: VisionMode
}

export function LightBeams({ world, visionMode }: LightBeamsProps) {
  const [lightStates, setLightStates] = useState<Array<{ position: BlockPosition; state: LightState }>>([])

  useEffect(() => {
    const updateLights = () => {
      setLightStates(world.getAllLightStates())
    }

    updateLights()
    world.addListener(updateLights)

    return () => {
      world.removeListener(updateLights)
    }
  }, [world])

  return (
    <group>
      {lightStates.map(({ position, state }) => (
        <LightAtPosition
          key={`${position.x},${position.y},${position.z}`}
          position={position}
          state={state}
          visionMode={visionMode}
        />
      ))}
    </group>
  )
}

interface LightAtPositionProps {
  position: BlockPosition
  state: LightState
  visionMode: VisionMode
}

function LightAtPosition({ position, state, visionMode }: LightAtPositionProps) {
  return (
    <group>
      {state.packets.map((packet, index) => (
        <LightPacketBeam
          key={index}
          position={position}
          packet={packet}
          visionMode={visionMode}
        />
      ))}
    </group>
  )
}

interface LightPacketBeamProps {
  position: BlockPosition
  packet: LightPacket
  visionMode: VisionMode
}

function LightPacketBeam({ position, packet, visionMode }: LightPacketBeamProps) {
  const brightness = packet.intensity / 15

  const color = useMemo(() => {
    if (visionMode === 'polarized') {
      return POLARIZATION_COLORS[packet.polarization as keyof typeof POLARIZATION_COLORS] || 0xffffaa
    }
    return 0xffffaa
  }, [visionMode, packet.polarization])

  const dir = DIRECTION_VECTORS[packet.direction]

  // Calculate beam position and orientation
  const { beamPosition, quaternion } = useMemo(() => {
    const startPoint = new THREE.Vector3(
      position.x - dir.x * 0.5,
      position.y - dir.y * 0.5,
      position.z - dir.z * 0.5
    )
    const endPoint = new THREE.Vector3(
      position.x + dir.x * 0.5,
      position.y + dir.y * 0.5,
      position.z + dir.z * 0.5
    )

    const beamPos = startPoint.clone().add(endPoint).multiplyScalar(0.5)

    const direction = new THREE.Vector3(dir.x, dir.y, dir.z)
    const quat = new THREE.Quaternion()
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)

    return { beamPosition: beamPos, quaternion: quat }
  }, [position, dir])

  const beamRadius = 0.02 + brightness * 0.03
  const glowRadius = 0.05 + brightness * 0.08

  return (
    <group position={[beamPosition.x, beamPosition.y, beamPosition.z]} quaternion={quaternion}>
      {/* Main beam */}
      <mesh>
        <cylinderGeometry args={[beamRadius, beamRadius, 1, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3 + brightness * 0.5}
        />
      </mesh>

      {/* Glow effect */}
      <mesh>
        <cylinderGeometry args={[glowRadius, glowRadius, 1, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1 + brightness * 0.2}
        />
      </mesh>

      {/* Polarization arrow in polarized vision mode */}
      {visionMode === 'polarized' && (
        <PolarizationArrow
          polarization={packet.polarization}
          direction={packet.direction}
          color={color}
        />
      )}
    </group>
  )
}

interface PolarizationArrowProps {
  polarization: number
  direction: string
  color: number
}

function PolarizationArrow({ polarization, direction, color }: PolarizationArrowProps) {
  const angle = (polarization * Math.PI) / 180
  const arrowLength = 0.2

  const points = useMemo(() => [
    new THREE.Vector3(-Math.cos(angle) * arrowLength, 0, -Math.sin(angle) * arrowLength),
    new THREE.Vector3(Math.cos(angle) * arrowLength, 0, Math.sin(angle) * arrowLength),
  ], [angle, arrowLength])

  // Rotation based on light direction
  const rotation = useMemo(() => {
    const dir = DIRECTION_VECTORS[direction as keyof typeof DIRECTION_VECTORS]
    if (dir.y !== 0) {
      return [Math.PI / 2, 0, 0] as [number, number, number]
    } else if (dir.x !== 0) {
      return [0, 0, Math.PI / 2] as [number, number, number]
    }
    return [0, 0, 0] as [number, number, number]
  }, [direction])

  return (
    <group rotation={rotation}>
      <Line
        points={points}
        color={color}
        lineWidth={1}
        transparent
        opacity={0.8}
      />
    </group>
  )
}
