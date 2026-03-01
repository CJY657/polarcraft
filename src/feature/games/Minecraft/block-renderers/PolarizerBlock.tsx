/**
 * Polarizer Block Renderer
 * 偏振片，设计成圆形镜框样式
 */

import * as THREE from 'three'
import { Line, Html } from '@react-three/drei'
import { BlockState, POLARIZATION_COLORS } from '@/lib/types'
import { PolarizationGridLines } from '../block-helpers'
import { BlockComponentProps } from '../block-helpers'

interface PolarizerBlockProps extends BlockComponentProps {
  state: BlockState
}

export function PolarizerBlock({ position, state, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: PolarizerBlockProps) {
  const color = POLARIZATION_COLORS[state.polarizationAngle as keyof typeof POLARIZATION_COLORS] || 0x00aaff

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 外框架 - 圆形金属边框 */}
      <mesh rotation={[Math.PI / 2, 0, rotationY]}>
        <torusGeometry args={[0.42, 0.08, 8, 32]} />
        <meshStandardMaterial color={0x3a3a5e} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 支架 */}
      <mesh position={[0, -0.4, 0]} rotation={[0, rotationY, 0]}>
        <boxGeometry args={[0.15, 0.2, 0.15]} />
        <meshStandardMaterial color={0x2a2a4e} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* 透明偏振片玻璃 */}
      <mesh
        rotation={[Math.PI / 2, 0, rotationY]}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <circleGeometry args={[0.4, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.4}
          roughness={0.05}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 偏振格栅线 - 更细腻 */}
      <PolarizationGridLines angle={state.polarizationAngle} rotation={rotationY} />

      {/* 偏振方向箭头指示 */}
      <group rotation={[0, rotationY, 0]}>
        <Line
          points={[
            [Math.cos(state.polarizationAngle * Math.PI / 180) * -0.35, Math.sin(state.polarizationAngle * Math.PI / 180) * -0.35, 0.06],
            [Math.cos(state.polarizationAngle * Math.PI / 180) * 0.35, Math.sin(state.polarizationAngle * Math.PI / 180) * 0.35, 0.06]
          ]}
          color={color}
          lineWidth={3}
        />
      </group>

      {/* 角度标签 */}
      <Html position={[0, 0.6, 0]} center>
        <div className="text-[10px] font-bold bg-black/70 px-1.5 py-0.5 rounded whitespace-nowrap" style={{ color: `#${color.toString(16).padStart(6, '0')}` }}>
          偏振 {state.polarizationAngle}°
        </div>
      </Html>
    </group>
  )
}
