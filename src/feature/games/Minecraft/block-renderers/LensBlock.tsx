/**
 * Lens Block Renderer
 * 透镜，优雅的双凸/双凹设计
 */

import * as THREE from 'three'
import { Line, Html } from '@react-three/drei'
import { BlockState } from '@/lib/types'
import { BlockComponentProps } from '../block-helpers'

interface LensBlockProps extends BlockComponentProps {
  state: BlockState
}

export function LensBlock({ position, state, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: LensBlockProps) {
  const isConverging = (state.focalLength ?? 2) > 0

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 支架 */}
      <mesh position={[0, -0.38, 0]} rotation={[0, rotationY, 0]}>
        <boxGeometry args={[0.12, 0.15, 0.5]} />
        <meshStandardMaterial color={0x4a4a6e} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 透镜主体 */}
      <mesh
        rotation={[0, rotationY, 0]}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        castShadow
      >
        <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={isConverging ? 0x88ddff : 0xffdd88}
          transparent
          opacity={0.6}
          roughness={0.05}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[Math.PI, rotationY, 0]}>
        <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={isConverging ? 0x88ddff : 0xffdd88}
          transparent
          opacity={0.6}
          roughness={0.05}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 边框环 */}
      <mesh rotation={[Math.PI / 2, 0, rotationY]}>
        <torusGeometry args={[0.42, 0.04, 8, 32]} />
        <meshStandardMaterial color={0x6a6a8e} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 聚焦/发散指示线 */}
      <group rotation={[0, rotationY, 0]}>
        {isConverging ? (
          // 聚焦线
          <>
            <Line points={[[-0.5, 0.2, 0], [0, 0, 0], [0.5, 0, 0]]} color={0x88ddff} lineWidth={2} />
            <Line points={[[-0.5, -0.2, 0], [0, 0, 0], [0.5, 0, 0]]} color={0x88ddff} lineWidth={2} />
          </>
        ) : (
          // 发散线
          <>
            <Line points={[[0, 0, 0], [0.5, 0.2, 0]]} color={0xffdd88} lineWidth={2} />
            <Line points={[[0, 0, 0], [0.5, -0.2, 0]]} color={0xffdd88} lineWidth={2} />
          </>
        )}
      </group>

      {/* 标签 */}
      <Html position={[0, 0.55, 0]} center>
        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
          isConverging ? 'bg-blue-500/80 text-white' : 'bg-amber-500/80 text-white'
        }`}>
          {isConverging ? '凸透镜' : '凹透镜'}
        </div>
      </Html>

      <pointLight color={isConverging ? 0x88ddff : 0xffdd88} intensity={0.2} distance={2} />
    </group>
  )
}
