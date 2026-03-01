/**
 * HalfWave Block Renderer
 * 二分之一波片
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line, Html } from '@react-three/drei'
import { BlockComponentProps } from '../block-helpers'

export function HalfWaveBlock({ position, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: BlockComponentProps) {
  const waveRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (waveRef.current) {
      waveRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.5) * 0.15
    }
  })

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 双层框架 */}
      <mesh rotation={[Math.PI / 2, 0, rotationY]}>
        <torusGeometry args={[0.4, 0.05, 6, 32]} />
        <meshStandardMaterial color={0x7a5a8e} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, rotationY]} position={[0, 0.08, 0]}>
        <torusGeometry args={[0.38, 0.03, 6, 32]} />
        <meshStandardMaterial color={0x6a4a7e} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* 波片主体 - 双层 */}
      <mesh
        ref={waveRef}
        rotation={[Math.PI / 2, 0, rotationY]}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <circleGeometry args={[0.36, 32]} />
        <meshStandardMaterial
          color={0xff88ff}
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 双箭头指示方向翻转 */}
      <group rotation={[0, rotationY, 0]}>
        <Line points={[[-0.25, 0.15, 0.05], [0.25, -0.15, 0.05]]} color={0xff66ff} lineWidth={3} />
        <Line points={[[-0.25, -0.15, 0.05], [0.25, 0.15, 0.05]]} color={0xff66ff} lineWidth={3} />
      </group>

      {/* 支架 */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.12, 8]} />
        <meshStandardMaterial color={0x5a4a7e} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 标签 */}
      <Html position={[0, 0.55, 0]} center>
        <div className="text-[10px] font-bold text-pink-300 bg-pink-900/80 px-2 py-0.5 rounded whitespace-nowrap">
          λ/2 波片
        </div>
      </Html>

      <pointLight color={0xff88ff} intensity={0.25} distance={2} />
    </group>
  )
}
