/**
 * Emitter Block Renderer
 * 发光光源，设计感更强，像真实的激光器
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import { BlockState, POLARIZATION_COLORS } from '@/lib/types'
import { VisionMode } from '@/stores/game/gameStore'
import { PolarizationIndicator } from '../block-helpers'
import { BlockComponentProps } from '../block-helpers'

interface EmitterBlockProps extends BlockComponentProps {
  state: BlockState
  visionMode: VisionMode
}

export function EmitterBlock({ position, state, rotationY, visionMode, onPointerDown, onPointerEnter, onPointerLeave }: EmitterBlockProps) {
  const color = visionMode === 'polarized'
    ? POLARIZATION_COLORS[state.polarizationAngle as keyof typeof POLARIZATION_COLORS] || 0xffff00
    : 0xffff00

  const pulseRef = useRef<THREE.Mesh>(null)

  // 脉冲动画
  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.1
      pulseRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={[position.x, position.y, position.z]}>
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.15}>
        {/* 底座 - 金属质感 */}
        <mesh
          position={[0, -0.35, 0]}
          rotation={[0, rotationY, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.45, 0.5, 0.15, 8]} />
          <meshStandardMaterial color={0x2a2a3e} metalness={0.9} roughness={0.2} />
        </mesh>

        {/* 主体 - 圆柱形光源壳体 */}
        <mesh
          rotation={[0, rotationY, 0]}
          castShadow
          onPointerDown={onPointerDown}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        >
          <cylinderGeometry args={[0.35, 0.4, 0.6, 8]} />
          <meshStandardMaterial
            color={0x1a1a2e}
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>

        {/* 发光核心 - 动态脉冲 */}
        <mesh ref={pulseRef} rotation={[0, rotationY, 0]}>
          <sphereGeometry args={[0.25, 24, 24]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.2}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* 外发光环 */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.35, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>

        {/* 顶部透镜 */}
        <mesh position={[0, 0.35, 0]} rotation={[0, rotationY, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.1, 16]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.5}
            metalness={0.5}
            roughness={0.1}
          />
        </mesh>

        {/* 发光点光源 */}
        <pointLight color={color} intensity={0.8} distance={4} />
      </Float>

      {/* 偏振方向指示器 */}
      <PolarizationIndicator angle={state.polarizationAngle} rotation={rotationY} offset={0.5} />

      {/* 偏振角度标签 */}
      <Html position={[0, 0.7, 0]} center>
        <div className="text-[10px] font-bold text-yellow-400 bg-black/70 px-1.5 py-0.5 rounded whitespace-nowrap">
          {state.polarizationAngle}°
        </div>
      </Html>
    </group>
  )
}
