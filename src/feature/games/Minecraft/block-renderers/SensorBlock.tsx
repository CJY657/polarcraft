/**
 * Sensor Block Renderer
 * 光电探测器，设计成专业探测仪器样式
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { BlockState } from '@/lib/types'
import { BlockComponentProps } from '../block-helpers'

interface SensorBlockProps extends BlockComponentProps {
  state: BlockState
}

export function SensorBlock({ position, state, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: SensorBlockProps) {
  const activated = state.activated
  const pulseRef = useRef<THREE.Mesh>(null)

  // 激活时的脉冲动画
  useFrame(({ clock }) => {
    if (pulseRef.current && activated) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 5) * 0.15
      pulseRef.current.scale.setScalar(scale)
    }
  })

  const baseColor = activated ? 0x00dd44 : 0x334455
  const lensColor = activated ? 0x44ff88 : 0x556677

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 底座壳体 */}
      <mesh
        rotation={[0, rotationY, 0]}
        castShadow
        receiveShadow
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <boxGeometry args={[0.75, 0.75, 0.5]} />
        <meshStandardMaterial
          color={0x2a2a3e}
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>

      {/* 探测器前面板 */}
      <mesh position={[0, 0, 0.26]} rotation={[0, rotationY, 0]}>
        <boxGeometry args={[0.7, 0.7, 0.03]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={activated ? 0x00ff00 : 0x000000}
          emissiveIntensity={activated ? 0.5 : 0}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* 传感器镜头外圈 */}
      <mesh position={[0, 0, 0.28]} rotation={[0, rotationY, 0]}>
        <ringGeometry args={[0.22, 0.3, 32]} />
        <meshStandardMaterial color={0x4a4a6e} metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* 传感器镜头 */}
      <mesh ref={pulseRef} position={[0, 0, 0.29]} rotation={[0, rotationY, 0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshStandardMaterial
          color={lensColor}
          emissive={activated ? 0x00ff44 : 0x000000}
          emissiveIntensity={activated ? 1.5 : 0}
          transparent
          opacity={0.85}
          roughness={0.1}
        />
      </mesh>

      {/* 状态指示灯 */}
      <mesh position={[0.28, 0.28, 0.26]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={activated ? 0x00ff00 : 0xff4444}
          emissive={activated ? 0x00ff00 : 0xff4444}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* 需求强度标签 */}
      <Html position={[0, 0.55, 0]} center>
        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
          activated ? 'bg-green-600/80 text-white' : 'bg-slate-700/80 text-gray-300'
        }`}>
          {activated ? '✓ 已激活' : `需要 ≥${state.requiredIntensity}`}
        </div>
      </Html>

      {/* 偏振需求标签 */}
      <Html position={[0, -0.55, 0]} center>
        <div className="text-[9px] bg-black/60 px-1 py-0.5 rounded text-gray-400">
          偏振 {state.polarizationAngle}°
        </div>
      </Html>

      {/* 激活时的发光效果 */}
      {activated && (
        <>
          <pointLight color={0x00ff00} intensity={0.8} distance={4} />
          <mesh position={[0, 0, 0.3]}>
            <ringGeometry args={[0.25, 0.4, 32]} />
            <meshBasicMaterial color={0x00ff44} transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  )
}
