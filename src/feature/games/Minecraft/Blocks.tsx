/**
 * Blocks Component - Enhanced 3D block rendering with unique designs
 * Each block type has distinctive visual characteristics
 * 重新设计：增强视觉效果和交互反馈
 *
 * Refactored to use a strategy pattern with a registry system.
 * Each block type is rendered by a registered renderer component.
 */
import { useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { ThreeEvent } from '@react-three/fiber'
import { World } from '@/lib/World'
import { BlockState, BlockPosition } from '@/lib/types'
import { VisionMode } from '@/stores/game/gameStore'
import { renderBlock, initializeDefaultRegistry } from './block-registry'

// Initialize the block registry on module load
initializeDefaultRegistry()

interface BlocksProps {
  world: World
  visionMode: VisionMode
  onBlockClick: (position: BlockPosition, normal: THREE.Vector3, button: number) => void
  onBlockHover: (position: BlockPosition | null, targetPos: BlockPosition | null) => void
}

export function Blocks({ world, visionMode, onBlockClick, onBlockHover }: BlocksProps) {
  const [blocks, setBlocks] = useState<Array<{ position: BlockPosition; state: BlockState }>>([])
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const updateBlocks = () => {
      setBlocks(world.getAllBlocks())
      setVersion(v => v + 1)
    }

    updateBlocks()
    world.addListener(updateBlocks)

    return () => {
      world.removeListener(updateBlocks)
    }
  }, [world])

  return (
    <group>
      {blocks.map(({ position, state }) => (
        <Block
          key={`${position.x},${position.y},${position.z}-${version}`}
          position={position}
          state={state}
          visionMode={visionMode}
          onBlockClick={onBlockClick}
          onBlockHover={onBlockHover}
        />
      ))}
    </group>
  )
}

interface BlockProps {
  position: BlockPosition
  state: BlockState
  visionMode: VisionMode
  onBlockClick: (position: BlockPosition, normal: THREE.Vector3, button: number) => void
  onBlockHover: (position: BlockPosition | null, targetPos: BlockPosition | null) => void
}

function Block({ position, state, visionMode, onBlockClick, onBlockHover }: BlockProps) {
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (e.face) {
      onBlockClick(position, e.face.normal, e.button)
    }
  }, [position, onBlockClick])

  const handlePointerEnter = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (e.face) {
      const targetPos: BlockPosition = {
        x: position.x + Math.round(e.face.normal.x),
        y: position.y + Math.round(e.face.normal.y),
        z: position.z + Math.round(e.face.normal.z),
      }
      onBlockHover(position, targetPos)
    }
  }, [position, onBlockHover])

  const handlePointerLeave = useCallback(() => {
    onBlockHover(null, null)
  }, [onBlockHover])

  // Skip air blocks
  if (state.type === 'air') return null

  const rotationY = (state.rotation * Math.PI) / 180

  // Use registry to render the specific block type
  return renderBlock(state.type, {
    position,
    state,
    rotationY,
    visionMode,
    onPointerDown: handlePointerDown,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
  })
}
