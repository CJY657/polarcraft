import { useMemo } from 'react'
import * as THREE from 'three'
import { BlockPosition } from '@/core/types'

interface SelectionBoxProps {
  position: BlockPosition
  valid: boolean
}

export function SelectionBox({ position, valid }: SelectionBoxProps) {
  const color = valid ? 0x64c8ff : 0xff4444

  const edgesGeometry = useMemo(() => {
    const boxGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02)
    return new THREE.EdgesGeometry(boxGeo)
  }, [])

  return (
    <lineSegments
      position={[position.x, position.y, position.z]}
      geometry={edgesGeometry}
    >
      <lineBasicMaterial color={color} linewidth={2} />
    </lineSegments>
  )
}
