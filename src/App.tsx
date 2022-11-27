import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useCanvas } from "./hooks/useCanavs"
import Sketch from "./Sketch"

export default function App() {
  const { canvasRef, texture, canvasHeight, canvasWidth, onMouseMove } =
    useCanvas()

  return (
    <div className='App'>
      <div className='canvas-wrapper'>
        <canvas
          className='interaction'
          onMouseMove={(event) => onMouseMove(event)}
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
        />
      </div>
      <Canvas
        orthographic
        camera={{
          position: [0, 0, 125],
          zoom: 4,
        }}
      >
        <Sketch uMouse={texture} />
      </Canvas>
    </div>
  )
}
