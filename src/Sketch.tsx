import { useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import vertex from "./shaders/vertex.glsl"
import fragment from "./shaders/fragment.glsl"

type particleType = {
  acceleration: THREE.Vector3
  velocity: THREE.Vector3
  position: THREE.Vector3
  maxSpeed: number
  maxForce: number
}

const tempObject = new THREE.Object3D()

const applyForce = (particle: particleType, force: THREE.Vector3) =>
  particle.acceleration.add(force)

const updatePosition = (particle: particleType) => {
  particle.velocity.add(particle.acceleration)
  particle.velocity.clampLength(-particle.maxSpeed, particle.maxSpeed)
  particle.acceleration.multiplyScalar(0)

  particle.position.add(particle.velocity)
}

const checkEdges = (
  particle: particleType,
  dimensions: { width: number; height: number }
) => {
  if (particle.position.x > dimensions.width) {
    particle.position.setX(0)
  }

  if (particle.position.y > dimensions.height) {
    particle.position.setY(0)
  }

  if (particle.position.y < 0) {
    particle.position.setY(dimensions.height - 1)
  }
}

const rows = 150
const cols = 150
const numberOfCells = rows * cols

export default function Sketch() {
  const texture = useTexture("mask.jpeg")
  let { width, height } = texture.image

  const ref = useRef<THREE.InstancedMesh>(null!)

  width *= 0.5
  height *= 0.5

  const cellWidth = width / cols
  const cellHeight = height / rows

  //_ vertices and index for the square shape
  const [positions, colors] = useMemo(() => {
    const img = texture.image
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    canvas.width = width
    canvas.height = height

    //@ts-ignore
    ctx.scale(1, -1)
    //@ts-ignore
    ctx.drawImage(img, 0, 0, width, height * -1)

    const positions = Array.from({ length: numberOfCells }, (_, i) => ({
      x: (i % cols) * cellWidth,
      y: Math.floor(i / rows) * cellHeight,
      z: 0,
    }))

    const colors = positions.map(({ x, y }) => {
      //@ts-ignore
      const { data } = ctx.getImageData(x, y, cellWidth, cellHeight)

      const colors = data.filter((_, i) => (i + 1) % 4 !== 0)

      const averageColor =
        colors.reduce((acc, cur) => acc + cur, 0) / colors.length

      return 1.0 - averageColor / 255
    })

    return [positions, colors]
  }, [texture, width, height])

  useFrame(() => {
    tempObject.position.set(0, 0, 0)
    tempObject.updateMatrix()

    const offsets = ref.current.geometry.attributes.offset.array

    for (let i = 0; i < numberOfCells; i++) {
      const strength = colors[i]

      offsets[i * 3 + 2] = strength * 10
    }

    ref.current.geometry.attributes.offset.needsUpdate = true
  })

  const startPositions = useMemo(
    () =>
      Float32Array.from(
        new Array(numberOfCells)
          .fill(0)
          .flatMap(() => [Math.random() * width, Math.random() * height, 0])
      ),
    []
  )

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, numberOfCells]}>
      <boxGeometry>
        <instancedBufferAttribute
          attach={"attributes-offset"}
          array={startPositions}
          itemSize={3}
        />
      </boxGeometry>
      <shaderMaterial vertexShader={vertex} fragmentShader={fragment} />
    </instancedMesh>
  )
}

// const particles = useMemo(
//   () =>
//     Array.from({ length: 10000 }, () => ({
//       position: new THREE.Vector3(
//         Math.random() * width,
//         Math.random() * height,
//         0
//       ),
//       velocity: new THREE.Vector3(0, -0.1, 0),
//       acceleration: new THREE.Vector3(0, 0, 0),
//       maxSpeed: 1,
//       maxForce: 1,
//     })),
//   []
// )

const Particle = ({
  particle,
  flowField,
  width,
  height,
}: {
  particle: particleType
  flowField: THREE.Vector3[]
  width: number
  height: number
}) => {
  const ref = useRef<THREE.Mesh>(null!)

  const follow = () => {
    const x = Math.floor(particle.position.x / (width / cols))
    const y = Math.floor(particle.position.y / (height / rows))

    const index = x + y * cols

    const force = flowField[index] || new THREE.Vector3(0, 0, 0)
    force.clampLength(-particle.maxForce, particle.maxForce)
    particle.maxSpeed = force.x

    applyForce(particle, new THREE.Vector3(0, -1, 0))

    const color1 = new THREE.Color(0xffffff)
    const color2 = new THREE.Color(0x000000)

    ref.current.material.color.lerpColors(color1, color2, particle.maxSpeed)
  }

  useFrame(() => {
    follow()
    updatePosition(particle)
    checkEdges(particle, { width, height })

    ref.current.position.copy(particle.position)
  })

  return (
    <mesh ref={ref}>
      <boxGeometry />
      <meshBasicMaterial />
    </mesh>
  )
}
