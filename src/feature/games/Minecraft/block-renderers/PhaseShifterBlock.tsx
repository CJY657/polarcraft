/**
 * PhaseShifter Block Renderer
 * 相位调制器，环形设计
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { BlockState } from '@/lib/types'
import { BlockComponentProps } from '../block-helpers'

interface PhaseShifterBlockProps extends BlockComponentProps {
  state: BlockState
}

export function PhaseShifterBlock({ position, state, rotationY: _rotationY, onPointerDown, onPointerEnter, onPointerLeave }: PhaseShifterBlockProps) {
  const phaseShift = state.phaseShift ?? 90
  const ringRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.5
    }
  })

  // 根据相位偏移选择颜色
  const phaseColors: Record<number, number> = {
    0: 0x88ff88,
    90: 0x88ffff,
    180: 0xff8888,
    270: 0xffff88,
  }
  const color = phaseColors[phaseShift] || 0x88ffff

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 底座 */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.1, 16]} />
        <meshStandardMaterial color={0x3a4a5e} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 旋转环系统 */}
      <group ref={ringRef}>
        {/* 外环 */}
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          onPointerDown={onPointerDown}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        >
          <torusGeometry args={[0.35, 0.06, 16, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>

        {/* 内环 */}
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
          <torusGeometry args={[0.25, 0.04, 12, 24]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.7}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>

        {/* 中心球 */}
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* 相位刻度 */}
      {[0, 90, 180, 270].map((deg) => (
        <mesh key={deg} position={[
          Math.cos(deg * Math.PI / 180) * 0.45,
          0,
          Math.sin(deg * Math.PI / 180) * 0.45
        ]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={deg === phaseShift ? 0xffffff : 0x666666} />
        </mesh>
      ))}

      {/* 标签 */}
      <Html position={[0, 0.5, 0]} center>
        <div className="text-[10px] font-bold bg-slate-800/90 px-2 py-0.5 rounded whitespace-nowrap"
             style={{ color: `#${color.toString(16).padStart(6, '0')}` }}>
          相位 {phaseShift}°
        </div>
      </Html>

      <pointLight color={color} intensity={0.4} distance={2.5} />
    </group>
  )
}
