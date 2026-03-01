/**
 * Portal Block Renderer
 * 传送门，神秘的环形设计
 */

import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import { BlockState } from '@/lib/types'
import { BlockComponentProps } from '../block-helpers'

interface PortalBlockProps extends BlockComponentProps {
  state: BlockState
}

export function PortalBlock({ position, state, rotationY: _rotationY, onPointerDown, onPointerEnter, onPointerLeave }: PortalBlockProps) {
  const portalRef = useRef<THREE.Group>(null)
  const isLinked = !!state.linkedPortalId

  useFrame(({ clock }) => {
    if (portalRef.current) {
      portalRef.current.rotation.z = clock.getElapsedTime() * 0.8
    }
  })

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 底座支柱 */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.35, 8]} />
        <meshStandardMaterial color={0x4a3a6e} metalness={0.6} roughness={0.4} />
      </mesh>

      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <group ref={portalRef}>
          {/* 外环 */}
          <mesh
            rotation={[Math.PI / 2, 0, 0]}
            onPointerDown={onPointerDown}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
          >
            <torusGeometry args={[0.4, 0.08, 16, 32]} />
            <meshStandardMaterial
              color={isLinked ? 0x44ff88 : 0xff8844}
              emissive={isLinked ? 0x22aa44 : 0xaa4422}
              emissiveIntensity={0.5}
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>

          {/* 内部漩涡 */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.1, 0.35, 32, 3]} />
            <meshStandardMaterial
              color={isLinked ? 0x88ffaa : 0xffaa88}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* 符文环 */}
          {[...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2
            return (
              <mesh key={i} position={[
                Math.cos(angle) * 0.32,
                Math.sin(angle) * 0.32,
                0.05
              ]}>
                <boxGeometry args={[0.06, 0.06, 0.02]} />
                <meshStandardMaterial
                  color={isLinked ? 0x88ffcc : 0xffcc88}
                  emissive={isLinked ? 0x44aa66 : 0xaa6644}
                  emissiveIntensity={0.8}
                />
              </mesh>
            )
          })}
        </group>
      </Float>

      {/* 标签 */}
      <Html position={[0, 0.6, 0]} center>
        <div className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
          isLinked
            ? 'bg-green-500/80 text-white'
            : 'bg-orange-500/80 text-white'
        }`}>
          {isLinked ? '传送门 ✓' : '传送门 ○'}
        </div>
      </Html>

      <pointLight
        color={isLinked ? 0x44ff88 : 0xff8844}
        intensity={0.6}
        distance={3}
      />
    </group>
  )
}
