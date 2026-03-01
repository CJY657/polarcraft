/**
 * Absorber Block Renderer
 * 吸收器，深色哑光设计
 */

import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { BlockState } from '@/lib/types'
import { BlockComponentProps } from '../block-helpers'

interface AbsorberBlockProps extends BlockComponentProps {
  state: BlockState
}

export function AbsorberBlock({ position, state, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: AbsorberBlockProps) {
  const absorptionRate = state.absorptionRate ?? 0.5
  const darkness = 0.1 + (1 - absorptionRate) * 0.4

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 底座 */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color={0x2a2a3e} metalness={0.3} roughness={0.9} />
      </mesh>

      {/* 吸收体主体 - 多层结构 */}
      <mesh
        rotation={[0, rotationY, 0]}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        castShadow
      >
        <boxGeometry args={[0.6, 0.5, 0.2]} />
        <meshStandardMaterial
          color={new THREE.Color(darkness, darkness, darkness + 0.1)}
          roughness={0.95}
          metalness={0.1}
        />
      </mesh>

      {/* 吸收层纹理 */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[0, -0.15 + i * 0.08, 0.12]} rotation={[0, rotationY, 0]}>
          <boxGeometry args={[0.55, 0.02, 0.01]} />
          <meshStandardMaterial color={0x1a1a2e} roughness={1} />
        </mesh>
      ))}

      {/* 吸收率指示 */}
      <Html position={[0, 0.45, 0]} center>
        <div className="text-[10px] font-bold text-gray-300 bg-gray-800/90 px-2 py-0.5 rounded whitespace-nowrap">
          吸收 {Math.round(absorptionRate * 100)}%
        </div>
      </Html>
    </group>
  )
}
