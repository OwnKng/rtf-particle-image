import { useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import vertex from "./shaders/vertex.glsl"
import fragment from "./shaders/fragment.glsl"

const rows = 120
const cols = 120
const numberOfCells = rows * cols

export default function Sketch({ uMouse }: { uMouse: any }) {
  const texture = useTexture("mask.png")
  let { width, height } = texture.image

  const ref = useRef<THREE.InstancedMesh>(null!)

  width *= 0.5
  height *= 0.5

  const cellWidth = width / cols
  const cellHeight = height / rows

  //_ vertices and index for the square shape
  let [imageData, angles, pindex] = useMemo(() => {
    const img = texture.image
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })

    canvas.width = width
    canvas.height = height

    //@ts-ignore
    ctx.scale(1, -1)
    //@ts-ignore
    ctx.drawImage(img, 0, 0, width, height * -1)

    const imageData = Array.from({ length: numberOfCells }, (_, i) => {
      const cx = (i % cols) * cellWidth
      const cy = Math.floor(i / rows) * cellHeight

      //@ts-ignore
      const { data } = ctx.getImageData(cx, cy, cellWidth, cellHeight)

      const colors = data.filter((_, i) => (i + 1) % 4 !== 0)

      const averageColor =
        colors.reduce((acc, cur) => acc + cur, 0) / colors.length

      return averageColor / 255
    })

    const angles = Float32Array.from(
      Array.from({ length: numberOfCells }, () => Math.random() * Math.PI)
    )

    const pindex = Float32Array.from(
      Array.from({ length: numberOfCells }, (_, i) => i)
    )

    return [imageData, angles, pindex]
  }, [texture, width, height])

  let startPositions = useMemo(
    () =>
      Array.from({ length: imageData.length }, () => ({
        x: THREE.MathUtils.randInt(0, width),
        y: THREE.MathUtils.randInt(0, height),
        z: 0,
      })),
    [imageData]
  )

  const offsets = useMemo(
    () =>
      Float32Array.from(
        new Array(imageData.length).fill(0).flatMap(() => [0, 0, 0])
      ),
    [imageData]
  )

  useFrame(({ clock }) => {
    const offsets = ref.current.geometry.attributes.offset.array

    for (let i = 0; i < imageData.length; i++) {
      let { x, y } = startPositions[i]

      const row = Math.floor(x / cellWidth)
      const col = Math.floor(y / cellHeight)

      const index = row + col * cols
      const force = imageData[index] || 0.01

      startPositions[i].y = y < 0 ? height : y - (1.0 - force)

      //@ts-ignore
      offsets[i * 3 + 0] = x
      //@ts-ignore
      offsets[i * 3 + 1] = y
      //@ts-ignore
      offsets[i * 3 + 2] = 0
    }

    ref.current.geometry.attributes.offset.needsUpdate = true

    //@ts-ignore
    ref.current.material.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <instancedMesh
      position={[-width * 0.5, -height * 0.5, 0]}
      ref={ref}
      args={[undefined, undefined, imageData.length]}
    >
      <boxGeometry args={[0.5, 1, 0.5]}>
        <instancedBufferAttribute
          attach={"attributes-offset"}
          array={offsets}
          itemSize={3}
        />
        <instancedBufferAttribute
          attach={"attributes-angle"}
          array={angles}
          itemSize={1}
        />
        <instancedBufferAttribute
          attach={"attributes-pindex"}
          array={pindex}
          itemSize={1}
        />
      </boxGeometry>
      <shaderMaterial
        uniforms={{
          uTexture: { value: texture },
          uTextureSize: { value: new THREE.Vector2(width, height) },
          uTime: { value: 0 },
          uMouseTexture: { value: uMouse.current },
        }}
        vertexShader={vertex}
        fragmentShader={fragment}
      />
    </instancedMesh>
  )
}
