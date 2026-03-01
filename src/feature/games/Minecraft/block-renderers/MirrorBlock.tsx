/**
 * Mirror Block Renderer
 * 反射镜，设计成光学平面镜样式
 */

import * as THREE from 'three'
import { Line, Html } from '@react-three/drei'
import { BlockComponentProps } from '../block-helpers'

export function MirrorBlock({ position, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: BlockComponentProps) {
  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 支架底座 */}
      <mesh position={[0, -0.4, 0]} rotation={[0, rotationY, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.1, 8]} />
        <meshStandardMaterial color={0x2a2a3e} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 支架立柱 */}
      <mesh position={[-0.3, -0.1, 0]} rotation={[0, rotationY, 0]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color={0x3a3a4e} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* 镜面框架 */}
      <mesh rotation={[0, rotationY, 0]}>
        <boxGeometry args={[0.12, 0.7, 0.7]} />
        <meshStandardMaterial color={0x2a2a3e} roughness={0.7} metalness={0.5} />
      </mesh>

      {/* 镜面 - 高反射率 */}
      <mesh
        position={[0.04, 0, 0]}
        rotation={[0, rotationY, 0]}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <boxGeometry args={[0.02, 0.6, 0.6]} />
        <meshStandardMaterial
          color={0xeeeeee}
          roughness={0.01}
          metalness={0.99}
          envMapIntensity={2}
        />
      </mesh>

      {/* 镜面边框装饰 */}
      <mesh position={[0.05, 0, 0]} rotation={[0, rotationY, 0]}>
        <ringGeometry args={[0.28, 0.32, 4]} />
        <meshStandardMaterial color={0x5a5a7e} metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* 反射方向指示 */}
      <group rotation={[0, rotationY, 0]}>
        {/* 入射光示意 */}
        <Line
          points={[[-0.4, 0.2, 0.3], [0, 0, 0]]}
          color={0xffaa00}
          lineWidth={2}
          dashed
          dashSize={0.05}
          gapSize={0.03}
        />
        {/* 反射光示意 */}
        <Line
          points={[[0, 0, 0], [0.4, 0.2, 0.3]]}
          color={0x88ccff}
          lineWidth={2}
        />
        <mesh position={[0.4, 0.2, 0.3]}>
          <coneGeometry args={[0.04, 0.1, 8]} />
          <meshBasicMaterial color={0x88ccff} />
        </mesh>
      </group>

      {/* 标签 */}
      <Html position={[0, 0.55, 0]} center>
        <div className="text-[10px] font-bold text-gray-300 bg-black/70 px-1.5 py-0.5 rounded whitespace-nowrap">
          反射镜
        </div>
      </Html>

      {/* 边缘高光 */}
      <lineSegments rotation={[0, rotationY, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(0.12, 0.7, 0.7)]} />
        <lineBasicMaterial color={0x6a6a8e} transparent opacity={0.6} />
      </lineSegments>
    </group>
  )
}
