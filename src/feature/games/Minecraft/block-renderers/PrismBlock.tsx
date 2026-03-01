/**
 * Prism Block Renderer
 * 棱镜，三角形晶体设计
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import { BlockComponentProps } from '../block-helpers'

export function PrismBlock({ position, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: BlockComponentProps) {
  const prismRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (prismRef.current) {
      prismRef.current.rotation.y = rotationY + Math.sin(clock.getElapsedTime() * 0.3) * 0.05
    }
  })

  // 彩虹色散效果的颜色
  const rainbowColors = [0xff6b6b, 0xffa94d, 0xffd93d, 0x6bcf7f, 0x4da6ff, 0x9b6bff]

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 底座 */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.08, 3]} />
        <meshStandardMaterial color={0x3d3d5c} metalness={0.7} roughness={0.3} />
      </mesh>

      <Float speed={1} rotationIntensity={0} floatIntensity={0.1}>
        <group ref={prismRef}>
          {/* 主棱镜 - 三角柱 */}
          <mesh
            rotation={[Math.PI / 2, 0, rotationY]}
            onPointerDown={onPointerDown}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            castShadow
          >
            <cylinderGeometry args={[0.4, 0.4, 0.6, 3]} />
            <meshStandardMaterial
              color={0xffffff}
              transparent
              opacity={0.85}
              roughness={0.02}
              metalness={0.3}
            />
          </mesh>

          {/* 内部彩虹折射效果 */}
          {rainbowColors.map((color, i) => (
            <mesh key={i} position={[0.15 + i * 0.08, -0.15 + i * 0.05, 0.35]} rotation={[0, rotationY, 0]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.8} />
            </mesh>
          ))}

          {/* 边缘发光 */}
          <lineSegments rotation={[Math.PI / 2, 0, rotationY]}>
            <edgesGeometry args={[new THREE.CylinderGeometry(0.4, 0.4, 0.6, 3)]} />
            <lineBasicMaterial color={0x88ffff} transparent opacity={0.8} />
          </lineSegments>
        </group>
      </Float>

      {/* 标签 */}
      <Html position={[0, 0.6, 0]} center>
        <div className="text-[10px] font-bold text-white bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 px-2 py-0.5 rounded-full whitespace-nowrap">
          棱镜
        </div>
      </Html>

      <pointLight color={0xffffff} intensity={0.3} distance={2} />
    </group>
  )
}
