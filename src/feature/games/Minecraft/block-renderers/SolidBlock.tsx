/**
 * Solid Block Renderer
 * Monument Valley inspired architectural blocks
 * 纪念碑谷风格的建筑方块 - 柔和色彩、优雅几何、微妙阴影
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { BlockComponentProps } from '../block-helpers'

export function SolidBlock({ position, rotationY, onPointerDown, onPointerEnter, onPointerLeave }: BlockComponentProps) {
  const isGround = position.y === 0

  // Monument Valley 风格的柔和配色
  // 根据位置生成微妙的颜色变化，增加视觉层次

  const groundColors = useMemo(() => {
    // 地面使用柔和的石板灰/米色调
    const tints = [0x3d4a5c, 0x4a5568, 0x5a6478, 0x48525e]
    return tints[Math.abs(position.x + position.z) % tints.length]
  }, [position.x, position.z])

  const buildingColors = useMemo(() => {
    // 建筑使用温暖的象牙白/浅米色调
    const palette = [
      0xf5f0e8, // 象牙白
      0xede8e0, // 暖灰
      0xe8e4dc, // 淡米色
      0xf0ebe3, // 珍珠白
      0xe5dfd7, // 浅褐
    ]
    return palette[Math.abs(position.x * 3 + position.y * 5 + position.z * 7) % palette.length]
  }, [position.x, position.y, position.z])

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 主体方块 */}
      <mesh
        rotation={[0, rotationY, 0]}
        castShadow
        receiveShadow
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={isGround ? groundColors : buildingColors}
          roughness={isGround ? 0.9 : 0.6}
          metalness={isGround ? 0.05 : 0.02}
        />
      </mesh>

      {/* 顶面高光 - 增加立体感 */}
      {!isGround && (
        <mesh position={[0, 0.501, 0]} rotation={[-Math.PI / 2, 0, rotationY]}>
          <planeGeometry args={[0.98, 0.98]} />
          <meshStandardMaterial
            color={0xffffff}
            transparent
            opacity={0.08}
            roughness={0.3}
          />
        </mesh>
      )}

      {/* 底部阴影线 - 增加层次感 */}
      {!isGround && position.y > 1 && (
        <mesh position={[0, -0.501, 0]} rotation={[Math.PI / 2, 0, rotationY]}>
          <planeGeometry args={[0.98, 0.98]} />
          <meshStandardMaterial
            color={0x000000}
            transparent
            opacity={0.06}
            roughness={0.8}
          />
        </mesh>
      )}

      {/* 地面网格 - 更优雅的线条 */}
      {isGround && (
        <lineSegments rotation={[0, rotationY, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
          <lineBasicMaterial color={0x5a6878} transparent opacity={0.25} />
        </lineSegments>
      )}

      {/* 建筑边缘 - 柔和的高光边缘 */}
      {!isGround && (
        <lineSegments rotation={[0, rotationY, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
          <lineBasicMaterial color={0xffffff} transparent opacity={0.12} />
        </lineSegments>
      )}
    </group>
  )
}
