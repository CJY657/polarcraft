/**
 * BeamSplitter Block Renderer
 * 分束器，立方体设计
 */

import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { BlockState } from '@/lib/types'
import { BlockComponentProps } from '../block-helpers'

interface BeamSplitterBlockProps extends BlockComponentProps {
  state: BlockState
}

export function BeamSplitterBlock({ position, state, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: BeamSplitterBlockProps) {
  const ratio = state.splitRatio ?? 0.5

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 底座 */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color={0x3a3a5e} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 立方体分束器 */}
      <mesh
        rotation={[0, rotationY + Math.PI / 4, 0]}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        castShadow
      >
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        <meshStandardMaterial
          color={0xaaddff}
          transparent
          opacity={0.7}
          roughness={0.05}
          metalness={0.4}
        />
      </mesh>

      {/* 内部分光面（对角线） */}
      <mesh rotation={[0, rotationY + Math.PI / 4, Math.PI / 4]} position={[0, 0, 0]}>
        <planeGeometry args={[0.75, 0.75]} />
        <meshStandardMaterial
          color={0x66aaff}
          transparent
          opacity={0.4}
          roughness={0.0}
          metalness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 边缘 */}
      <lineSegments rotation={[0, rotationY + Math.PI / 4, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(0.55, 0.55, 0.55)]} />
        <lineBasicMaterial color={0x88ccff} transparent opacity={0.9} />
      </lineSegments>

      {/* 分光比例指示 */}
      <Html position={[0, 0.55, 0]} center>
        <div className="text-[10px] font-bold text-cyan-300 bg-slate-800/80 px-2 py-0.5 rounded whitespace-nowrap">
          分束器 {Math.round(ratio * 100)}:{Math.round((1 - ratio) * 100)}
        </div>
      </Html>

      <pointLight color={0x88ccff} intensity={0.3} distance={2} />
    </group>
  )
}
