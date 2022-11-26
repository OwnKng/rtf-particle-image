import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import Sketch from "./Sketch"

export default function App() {
  return (
    <div className='App'>
      <Canvas>
        <OrbitControls />
        <Sketch />
      </Canvas>
    </div>
  )
}
