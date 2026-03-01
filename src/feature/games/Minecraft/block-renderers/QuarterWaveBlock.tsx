/**
 * QuarterWave Block Renderer
 * 四分之一波片，薄片晶体设计
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line, Html } from '@react-three/drei'
import { BlockComponentProps } from '../block-helpers'

export function QuarterWaveBlock({ position, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: BlockComponentProps) {
  const waveRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (waveRef.current) {
      waveRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 2) * 0.1
    }
  })

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 框架 */}
      <mesh rotation={[Math.PI / 2, 0, rotationY]}>
        <torusGeometry args={[0.38, 0.06, 6, 32]} />
        <meshStandardMaterial color={0x5a4a7e} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 波片主体 */}
      <mesh
        ref={waveRef}
        rotation={[Math.PI / 2, 0, rotationY]}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <circleGeometry args={[0.35, 32]} />
        <meshStandardMaterial
          color={0xaa88ff}
          transparent
          opacity={0.5}
          roughness={0.1}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 光轴指示（快轴/慢轴） */}
      <group rotation={[0, rotationY, 0]}>
        <Line points={[[-0.3, 0, 0.05], [0.3, 0, 0.05]]} color={0xff8888} lineWidth={2} />
        <Line points={[[0, -0.3, 0.05], [0, 0.3, 0.05]]} color={0x88ff88} lineWidth={2} />
      </group>

      {/* 支架 */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.12, 8]} />
        <meshStandardMaterial color={0x4a4a6e} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 标签 */}
      <Html position={[0, 0.5, 0]} center>
        <div className="text-[10px] font-bold text-purple-300 bg-purple-900/80 px-2 py-0.5 rounded whitespace-nowrap">
          λ/4 波片
        </div>
      </Html>

      <pointLight color={0xaa88ff} intensity={0.2} distance={2} />
    </group>
  )
}
