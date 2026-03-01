/**
 * Block Registry System
 *
 * A strategy pattern implementation for block rendering.
 * Each block type has a registered renderer function that knows how to render it.
 */

import { BlockState, BlockPosition } from '@/lib/types'
import { VisionMode } from '@/stores/game/gameStore'
import { ThreeEvent } from '@react-three/fiber'
import type { ReactElement, ReactNode } from 'react'

/**
 * Base props for all block renderers
 */
export interface BlockRendererBaseProps {
  position: BlockPosition
  rotationY: number
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter: (e: ThreeEvent<PointerEvent>) => void
  onPointerLeave: () => void
}

/**
 * Props for renderers that need block state
 */
export interface BlockRendererPropsWithState extends BlockRendererBaseProps {
  state: BlockState
}

/**
 * Props for renderers that need vision mode
 */
export interface BlockRendererPropsWithVision extends BlockRendererPropsWithState {
  visionMode: VisionMode
}

/**
 * Block renderer function type
 * Takes block props and returns JSX element
 */
export type BlockRenderer = (props: any) => ReactElement | ReactNode | null

/**
 * Block registry type - maps block type to renderer function
 */
export type BlockRegistry = Record<string, BlockRenderer>

/**
 * Global registry instance
 */
let registry: BlockRegistry = {}

/**
 * Register a block renderer for a specific block type
 *
 * @param blockType - The type of block to register
 * @param renderer - The renderer function
 */
export function registerBlockRenderer(blockType: string, renderer: BlockRenderer): void {
  registry[blockType] = renderer
}

/**
 * Get a block renderer for a specific block type
 *
 * @param blockType - The type of block
 * @returns The renderer function or undefined if not found
 */
export function getBlockRenderer(blockType: string): BlockRenderer | undefined {
  return registry[blockType]
}

/**
 * Get the complete block registry
 *
 * @returns The full registry object
 */
export function getBlockRegistry(): BlockRegistry {
  return { ...registry }
}

/**
 * Clear all registered renderers (useful for testing)
 */
export function clearBlockRegistry(): void {
  registry = {}
}

/**
 * Render a block using the registry system
 *
 * @param blockType - The type of block to render
 * @param props - The props to pass to the renderer
 * @returns JSX element or null if no renderer found
 */
export function renderBlock(
  blockType: string,
  props: any
): ReactElement | ReactNode | null {
  const renderer = getBlockRenderer(blockType)
  if (!renderer) {
    return null
  }
  return renderer(props)
}

/**
 * Initialize the default block registry with all standard block renderers
 * This should be called during app initialization
 */
export function initializeDefaultRegistry(): void {
  // Dynamically import and register all block renderers
  // This avoids circular dependencies
  Promise.all([
    import('./block-renderers/SolidBlock'),
    import('./block-renderers/EmitterBlock'),
    import('./block-renderers/PolarizerBlock'),
    import('./block-renderers/RotatorBlock'),
    import('./block-renderers/SplitterBlock'),
    import('./block-renderers/SensorBlock'),
    import('./block-renderers/MirrorBlock'),
    import('./block-renderers/PrismBlock'),
    import('./block-renderers/LensBlock'),
    import('./block-renderers/BeamSplitterBlock'),
    import('./block-renderers/QuarterWaveBlock'),
    import('./block-renderers/HalfWaveBlock'),
    import('./block-renderers/AbsorberBlock'),
    import('./block-renderers/PhaseShifterBlock'),
    import('./block-renderers/PortalBlock'),
  ]).then((
    [solid, emitter, polarizer, rotator, splitter, sensor, mirror, prism, lens, beamSplitter, quarterWave, halfWave, absorber, phaseShifter, portal]
  ) => {
    registerBlockRenderer('solid', solid.SolidBlock)
    registerBlockRenderer('emitter', emitter.EmitterBlock)
    registerBlockRenderer('polarizer', polarizer.PolarizerBlock)
    registerBlockRenderer('rotator', rotator.RotatorBlock)
    registerBlockRenderer('splitter', splitter.SplitterBlock)
    registerBlockRenderer('sensor', sensor.SensorBlock)
    registerBlockRenderer('mirror', mirror.MirrorBlock)
    registerBlockRenderer('prism', prism.PrismBlock)
    registerBlockRenderer('lens', lens.LensBlock)
    registerBlockRenderer('beamSplitter', beamSplitter.BeamSplitterBlock)
    registerBlockRenderer('quarterWave', quarterWave.QuarterWaveBlock)
    registerBlockRenderer('halfWave', halfWave.HalfWaveBlock)
    registerBlockRenderer('absorber', absorber.AbsorberBlock)
    registerBlockRenderer('phaseShifter', phaseShifter.PhaseShifterBlock)
    registerBlockRenderer('portal', portal.PortalBlock)
  })
}
