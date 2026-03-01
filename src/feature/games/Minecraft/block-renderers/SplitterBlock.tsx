/**
 * Splitter Block Renderer
 * 方解石分光晶体，设计成菱形晶体样式
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line, Html } from '@react-three/drei'
import { BlockComponentProps } from '../block-helpers'

export function SplitterBlock({ position, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: BlockComponentProps) {
  const crystalRef = useRef<THREE.Group>(null)

  // 轻微闪烁动画
  useFrame(({ clock }) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y = rotationY + Math.sin(clock.getElapsedTime() * 0.3) * 0.05
    }
  })

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 底座 */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color={0x2a3a4e} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 晶体主体 */}
      <group ref={crystalRef}>
        {/* 外层菱形晶体 */}
        <mesh
          rotation={[0, rotationY, Math.PI / 8]}
          onPointerDown={onPointerDown}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          castShadow
        >
          <octahedronGeometry args={[0.48]} />
          <meshStandardMaterial
            color={0x00ddee}
            transparent
            opacity={0.7}
            roughness={0.02}
            metalness={0.7}
          />
        </mesh>

        {/* 内层晶体核心 */}
        <mesh rotation={[0, rotationY + Math.PI / 4, Math.PI / 8]}>
          <octahedronGeometry args={[0.3]} />
          <meshStandardMaterial
            color={0xffffff}
            transparent
            opacity={0.35}
            roughness={0.0}
            metalness={0.9}
          />
        </mesh>
      </group>

      {/* 分光方向指示 - o光（红色，向上偏折） */}
      <group rotation={[0, rotationY, 0]}>
        <Line
          points={[[0.1, 0.05, 0], [0.55, 0.25, 0]]}
          color={0xff4444}
          lineWidth={3}
        />
        <mesh position={[0.55, 0.25, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color={0xff4444} />
        </mesh>
      </group>

      {/* 分光方向指示 - e光（绿色，向下偏折） */}
      <group rotation={[0, rotationY, 0]}>
        <Line
          points={[[0.1, -0.05, 0], [0.55, -0.25, 0]]}
          color={0x44ff44}
          lineWidth={3}
        />
        <mesh position={[0.55, -0.25, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color={0x44ff44} />
        </mesh>
      </group>

      {/* 边缘发光 */}
      <lineSegments rotation={[0, rotationY, Math.PI / 8]}>
        <edgesGeometry args={[new THREE.OctahedronGeometry(0.48)]} />
        <lineBasicMaterial color={0x00ffff} transparent opacity={0.9} />
      </lineSegments>

      {/* 标签 */}
      <Html position={[0, 0.65, 0]} center>
        <div className="text-[10px] font-bold text-cyan-400 bg-black/70 px-1.5 py-0.5 rounded whitespace-nowrap">
          分光晶体
        </div>
      </Html>

      {/* 发光效果 */}
      <pointLight color={0x00ffff} intensity={0.4} distance={2.5} />
    </group>
  )
}
