import { Canvas } from '@react-three/fiber'
import { Scene } from './Scene'

export function GameCanvas() {
  return (
    <Canvas
      shadows
      camera={{
        position: [5, 8, 10],
        fov: 75,
        near: 0.1,
        far: 1000,
      }}
      gl={{
        antialias: true,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <Scene />
    </Canvas>
  )
}
