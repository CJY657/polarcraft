/**
 * Shared types for block components
 */
import { ThreeEvent } from '@react-three/fiber'
import { BlockState, BlockPosition } from '@/core/types'
import { VisionMode } from '@/stores/gameStore'

// Shared props for all block components
export interface BlockComponentProps {
  position: BlockPosition
  rotationY: number
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter: (e: ThreeEvent<PointerEvent>) => void
  onPointerLeave: () => void
}

// Props that include block state
export interface StatefulBlockProps extends BlockComponentProps {
  state: BlockState
}

// Props that include vision mode
export interface VisionBlockProps extends StatefulBlockProps {
  visionMode: VisionMode
}
