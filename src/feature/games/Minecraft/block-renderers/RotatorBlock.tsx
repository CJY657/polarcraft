/**
 * Rotator Block Renderer
 * 波片/旋转器，设计成晶体光学元件样式
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { BlockState } from '@/lib/types'
import { SpiralDecoration } from '../block-helpers'
import { BlockComponentProps } from '../block-helpers'

interface RotatorBlockProps extends BlockComponentProps {
  state: BlockState
}

export function RotatorBlock({ position, state, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: RotatorBlockProps) {
  const is90 = state.rotationAmount === 90
  const rotatorRef = useRef<THREE.Group>(null)

  // 缓慢旋转动画
  useFrame(({ clock }) => {
    if (rotatorRef.current) {
      rotatorRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1
    }
  })

  const primaryColor = is90 ? 0x9900ff : 0xff00ff
  const secondaryColor = is90 ? 0x6600cc : 0xcc00cc

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 底座 */}
      <mesh position={[0, -0.38, 0]} rotation={[0, rotationY, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.12, 6]} />
        <meshStandardMaterial color={0x2a2a4e} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 晶体主体 - 六棱柱 */}
      <group ref={rotatorRef}>
        <mesh
          rotation={[0, rotationY, 0]}
          onPointerDown={onPointerDown}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          castShadow
        >
          <cylinderGeometry args={[0.35, 0.35, 0.55, 6]} />
          <meshStandardMaterial
            color={primaryColor}
            transparent
            opacity={0.65}
            roughness={0.1}
            metalness={0.5}
          />
        </mesh>

        {/* 内层晶体 */}
        <mesh rotation={[0, rotationY + Math.PI / 6, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.5, 6]} />
          <meshStandardMaterial
            color={secondaryColor}
            transparent
            opacity={0.4}
            roughness={0.05}
          />
        </mesh>

        {/* 旋转螺旋线 */}
        <SpiralDecoration rotation={rotationY} is90={is90} />
      </group>

      {/* 顶部装饰环 */}
      <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.36, 6]} />
        <meshStandardMaterial color={0x4a4a6e} metalness={0.7} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* 旋转角度标签 */}
      <Html position={[0, 0.55, 0]} center>
        <div className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
          is90 ? 'bg-purple-600/80 text-white' : 'bg-pink-500/80 text-white'
        }`}>
          旋转 {is90 ? '90°' : '45°'}
        </div>
      </Html>

      {/* 发光效果 */}
      <pointLight color={primaryColor} intensity={0.3} distance={2} />
    </group>
  )
}
