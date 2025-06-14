<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${size} ${size}`" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="alogorithm2-clip">
        <path :d="interpolatedBlobPath" />
      </clipPath>
    </defs>
    <g clip-path="url(#alogorithm2-clip)">
      <polygon
        v-for="(triangle, index) in interpolatedTriangles"
        :key="index"
        :points="triangle.points.map((p) => `${p.x},${p.y}`).join(' ')"
        :fill="triangle.color"
        :opacity="triangle.opacity || 1"
      />
    </g>
  </svg>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { PropType } from 'vue'
import {
  MorphState,
  Triangle,
  Point,
  generateRandomSeed,
  generateTriangles,
  generateBlobPath,
  extractVertices,
  matchVertices,
  easeInOutSine,
  interpolateNumber,
  interpolateColor,
  interpolatePath,
} from '../animation'

export default defineComponent({
  name: 'Alogorithm2Animation',
  props: {
    width: {
      type: Number,
      default: 400,
    },
    height: {
      type: Number,
      default: 400,
    },
    seed: {
      type: String,
      default: undefined,
    },
    mode: {
      type: String as PropType<'fly' | 'morph'>,
      default: 'morph',
    },
    duration: {
      type: Number,
      default: 2000,
    },
    interval: {
      type: Number,
      default: 4000,
    },
  },
  setup(props) {
    const morphState = ref<MorphState | null>(null)
    const isLoading = ref(true)
    let animationFrameId: number | null = null
    let lastTime = 0
    let intervalId: number | null = null

    const size = computed(() => Math.min(props.width, props.height))

    // Initialize morph state
    const initializeMorph = () => {
      const initialSeed = props.seed || generateRandomSeed()
      const triangles = generateTriangles(initialSeed, size.value, props.mode)
      const blobPath = generateBlobPath(initialSeed, size.value)

      if (props.mode === 'morph') {
        const { vertices, triangles: trianglesWithVertices } = extractVertices(triangles)
        morphState.value = {
          fromTriangles: trianglesWithVertices,
          toTriangles: trianglesWithVertices,
          fromVertices: vertices,
          toVertices: vertices,
          fromBlobPath: blobPath,
          toBlobPath: blobPath,
          progress: 1,
          currentSeed: initialSeed,
          nextSeed: initialSeed,
        }
      } else {
        morphState.value = {
          fromTriangles: triangles,
          toTriangles: triangles,
          fromBlobPath: blobPath,
          toBlobPath: blobPath,
          progress: 1,
          currentSeed: initialSeed,
          nextSeed: initialSeed,
        }
      }
      isLoading.value = false
    }

    // Start new morph
    const startNewMorph = () => {
      if (!morphState.value) return

      const newSeed = generateRandomSeed()
      const newTriangles = generateTriangles(newSeed, size.value, props.mode)
      const newBlobPath = generateBlobPath(newSeed, size.value)

      if (props.mode === 'morph' && morphState.value.toVertices && morphState.value.toTriangles) {
        const updatedFromTriangles = morphState.value.toTriangles.map((triangle) => {
          if (triangle.vertexIndices && triangle.vertexIndices.length === 3) {
            const points = triangle.vertexIndices.map((vIdx) => ({
              x: morphState.value!.toVertices![vIdx].x,
              y: morphState.value!.toVertices![vIdx].y,
            }))
            return {
              ...triangle,
              points,
            }
          }
          return triangle
        })

        const { vertices: newVertices, triangles: newTrianglesWithVertices } = extractVertices(newTriangles)
        const vertexMatches = matchVertices(morphState.value.toVertices, newVertices, size.value)

        morphState.value = {
          fromTriangles: updatedFromTriangles,
          toTriangles: newTrianglesWithVertices,
          fromVertices: morphState.value.toVertices,
          toVertices: newVertices,
          vertexMatches,
          fromBlobPath: morphState.value.toBlobPath,
          toBlobPath: newBlobPath,
          progress: 0,
          currentSeed: morphState.value.nextSeed,
          nextSeed: newSeed,
        }
      } else {
        morphState.value = {
          fromTriangles: morphState.value.toTriangles,
          toTriangles: newTriangles,
          fromBlobPath: morphState.value.toBlobPath,
          toBlobPath: newBlobPath,
          progress: 0,
          currentSeed: morphState.value.nextSeed,
          nextSeed: newSeed,
        }
      }

      lastTime = 0
    }

    // Animation loop
    const animate = (currentTime: number) => {
      if (!morphState.value || morphState.value.progress >= 1) return

      if (lastTime === 0) {
        lastTime = currentTime
      }

      const deltaTime = currentTime - lastTime
      const progress = Math.min(morphState.value.progress + deltaTime / props.duration, 1)

      morphState.value.progress = progress

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    // Computed interpolated state
    const interpolatedTriangles = computed(() => {
      if (!morphState.value) return []

      const easedProgress = easeInOutSine(morphState.value.progress)
      const triangles: Triangle[] = []
      const fromCount = morphState.value.fromTriangles.length
      const toCount = morphState.value.toTriangles.length

      if (
        props.mode === 'morph' &&
        morphState.value.fromVertices &&
        morphState.value.toVertices &&
        morphState.value.vertexMatches
      ) {
        const fromOpacity = 1 - easedProgress
        const toOpacity = easedProgress

        if (morphState.value.progress <= 0) {
          morphState.value.fromTriangles.forEach((triangle) => {
            if (triangle.vertexIndices && triangle.vertexIndices.length === 3) {
              const points = triangle.vertexIndices.map(
                (vIdx) => morphState.value!.fromVertices![vIdx] || { x: 0, y: 0 },
              )
              triangles.push({
                points,
                color: triangle.color,
                opacity: 1,
              })
            }
          })
        } else if (morphState.value.progress >= 1) {
          morphState.value.toTriangles.forEach((triangle) => {
            if (triangle.vertexIndices && triangle.vertexIndices.length === 3) {
              const points = triangle.vertexIndices.map((vIdx) => morphState.value!.toVertices![vIdx] || { x: 0, y: 0 })
              triangles.push({
                points,
                color: triangle.color,
                opacity: 1,
              })
            }
          })
        } else {
          const interpolatedVertices: Point[] = new Array(
            Math.max(morphState.value.fromVertices.length, morphState.value.toVertices.length),
          )

          morphState.value.vertexMatches.forEach(({ fromIdx, toIdx }) => {
            const fromVertex = morphState.value!.fromVertices![fromIdx]
            const toVertex = morphState.value!.toVertices![toIdx]
            interpolatedVertices[toIdx] = {
              x: interpolateNumber(fromVertex.x, toVertex.x, easedProgress),
              y: interpolateNumber(fromVertex.y, toVertex.y, easedProgress),
            }
          })

          morphState.value.toVertices.forEach((vertex, idx) => {
            if (!interpolatedVertices[idx]) {
              let nearestDist = Infinity
              let nearestVertex = { x: size.value / 2, y: size.value / 2 }

              interpolatedVertices.forEach((v, vIdx) => {
                if (v && vIdx !== idx) {
                  const dist = Math.sqrt(
                    Math.pow(vertex.x - morphState.value!.toVertices![vIdx].x, 2) +
                      Math.pow(vertex.y - morphState.value!.toVertices![vIdx].y, 2),
                  )
                  if (dist < nearestDist) {
                    nearestDist = dist
                    nearestVertex = v
                  }
                }
              })

              interpolatedVertices[idx] = {
                x: interpolateNumber(nearestVertex.x, vertex.x, easedProgress),
                y: interpolateNumber(nearestVertex.y, vertex.y, easedProgress),
              }
            }
          })

          morphState.value.fromTriangles.forEach((fromTriangle) => {
            if (fromTriangle.vertexIndices && fromTriangle.vertexIndices.length === 3) {
              const points = fromTriangle.vertexIndices.map((vIdx) => {
                const vertexMatch = morphState.value!.vertexMatches!.find((m) => m.fromIdx === vIdx)
                if (vertexMatch) {
                  const fromVertex = morphState.value!.fromVertices![vIdx]
                  const toVertex = morphState.value!.toVertices![vertexMatch.toIdx]
                  return {
                    x: interpolateNumber(fromVertex.x, toVertex.x, easedProgress),
                    y: interpolateNumber(fromVertex.y, toVertex.y, easedProgress),
                  }
                } else {
                  const fromVertex = morphState.value!.fromVertices![vIdx]
                  const centroid = {
                    x: (fromTriangle.points[0].x + fromTriangle.points[1].x + fromTriangle.points[2].x) / 3,
                    y: (fromTriangle.points[0].y + fromTriangle.points[1].y + fromTriangle.points[2].y) / 3,
                  }
                  return {
                    x: interpolateNumber(fromVertex.x, centroid.x, easedProgress),
                    y: interpolateNumber(fromVertex.y, centroid.y, easedProgress),
                  }
                }
              })
              triangles.push({
                points,
                color: fromTriangle.color,
                opacity: fromOpacity,
              })
            }
          })

          morphState.value.toTriangles.forEach((toTriangle) => {
            if (toTriangle.vertexIndices && toTriangle.vertexIndices.length === 3) {
              const points = toTriangle.vertexIndices.map((vIdx) => {
                const vertex = interpolatedVertices[vIdx]
                if (!vertex) {
                  const toVertex = morphState.value!.toVertices![vIdx]
                  const centroid = {
                    x: (toTriangle.points[0].x + toTriangle.points[1].x + toTriangle.points[2].x) / 3,
                    y: (toTriangle.points[0].y + toTriangle.points[1].y + toTriangle.points[2].y) / 3,
                  }
                  return {
                    x: interpolateNumber(centroid.x, toVertex.x, easedProgress),
                    y: interpolateNumber(centroid.y, toVertex.y, easedProgress),
                  }
                }
                return vertex
              })
              triangles.push({
                points,
                color: toTriangle.color,
                opacity: toOpacity,
              })
            }
          })
        }
      } else if (props.mode === 'morph') {
        const triangleMatches: { fromIdx: number; toIdx: number }[] = []
        const matchedFrom = new Set<number>()
        const matchedTo = new Set<number>()

        morphState.value.fromTriangles.forEach((fromTriangle, fromIdx) => {
          const fromCentroid = {
            x: (fromTriangle.points[0].x + fromTriangle.points[1].x + fromTriangle.points[2].x) / 3,
            y: (fromTriangle.points[0].y + fromTriangle.points[1].y + fromTriangle.points[2].y) / 3,
          }

          let bestMatch = -1
          let bestDistance = Infinity

          morphState.value!.toTriangles.forEach((toTriangle, toIdx) => {
            if (matchedTo.has(toIdx)) return

            const toCentroid = {
              x: (toTriangle.points[0].x + toTriangle.points[1].x + toTriangle.points[2].x) / 3,
              y: (toTriangle.points[0].y + toTriangle.points[1].y + toTriangle.points[2].y) / 3,
            }

            const distance = Math.sqrt(
              Math.pow(fromCentroid.x - toCentroid.x, 2) + Math.pow(fromCentroid.y - toCentroid.y, 2),
            )

            if (distance < bestDistance) {
              bestDistance = distance
              bestMatch = toIdx
            }
          })

          if (bestMatch !== -1 && bestDistance < size.value * 0.4) {
            triangleMatches.push({ fromIdx, toIdx: bestMatch })
            matchedFrom.add(fromIdx)
            matchedTo.add(bestMatch)
          }
        })

        triangleMatches.forEach(({ fromIdx, toIdx }) => {
          const fromTriangle = morphState.value!.fromTriangles[fromIdx]
          const toTriangle = morphState.value!.toTriangles[toIdx]

          const interpolatedPoints = fromTriangle.points.map((fromPoint, i) => {
            const toPoint = toTriangle.points[i]
            return {
              x: interpolateNumber(fromPoint.x, toPoint.x, easedProgress),
              y: interpolateNumber(fromPoint.y, toPoint.y, easedProgress),
            }
          })

          triangles.push({
            points: interpolatedPoints,
            color: interpolateColor(fromTriangle.color, toTriangle.color, easedProgress),
            opacity: 1,
          })
        })

        morphState.value.fromTriangles.forEach((fromTriangle, idx) => {
          if (!matchedFrom.has(idx)) {
            const center = {
              x: (fromTriangle.points[0].x + fromTriangle.points[1].x + fromTriangle.points[2].x) / 3,
              y: (fromTriangle.points[0].y + fromTriangle.points[1].y + fromTriangle.points[2].y) / 3,
            }

            const interpolatedPoints = fromTriangle.points.map((point) => ({
              x: interpolateNumber(point.x, center.x, easedProgress),
              y: interpolateNumber(point.y, center.y, easedProgress),
            }))

            triangles.push({
              points: interpolatedPoints,
              color: fromTriangle.color,
              opacity: 1 - easedProgress,
            })
          }
        })

        morphState.value.toTriangles.forEach((toTriangle, idx) => {
          if (!matchedTo.has(idx)) {
            const center = {
              x: (toTriangle.points[0].x + toTriangle.points[1].x + toTriangle.points[2].x) / 3,
              y: (toTriangle.points[0].y + toTriangle.points[1].y + toTriangle.points[2].y) / 3,
            }

            const interpolatedPoints = toTriangle.points.map((point) => ({
              x: interpolateNumber(center.x, point.x, easedProgress),
              y: interpolateNumber(center.y, point.y, easedProgress),
            }))

            triangles.push({
              points: interpolatedPoints,
              color: toTriangle.color,
              opacity: easedProgress,
            })
          }
        })
      } else {
        const maxTriangles = Math.max(fromCount, toCount)

        for (let i = 0; i < maxTriangles; i++) {
          let fromTriangle: Triangle
          let toTriangle: Triangle

          if (i < fromCount && i < toCount) {
            fromTriangle = morphState.value.fromTriangles[i]
            toTriangle = morphState.value.toTriangles[i]
          } else if (i >= fromCount) {
            fromTriangle = {
              points: [
                { x: size.value / 2, y: size.value / 2 },
                { x: size.value / 2, y: size.value / 2 },
                { x: size.value / 2, y: size.value / 2 },
              ],
              color: morphState.value.toTriangles[i].color,
            }
            toTriangle = morphState.value.toTriangles[i]
          } else {
            fromTriangle = morphState.value.fromTriangles[i]
            toTriangle = {
              points: [
                { x: size.value / 2, y: size.value / 2 },
                { x: size.value / 2, y: size.value / 2 },
                { x: size.value / 2, y: size.value / 2 },
              ],
              color: morphState.value.fromTriangles[i].color,
            }
          }

          const interpolatedPoints = fromTriangle.points.map((fromPoint, j) => {
            const toPoint = toTriangle.points[j]
            return {
              x: interpolateNumber(fromPoint.x, toPoint.x, easedProgress),
              y: interpolateNumber(fromPoint.y, toPoint.y, easedProgress),
            }
          })

          triangles.push({
            points: interpolatedPoints,
            color: interpolateColor(fromTriangle.color, toTriangle.color, easedProgress),
          })
        }
      }

      return triangles
    })

    const interpolatedBlobPath = computed(() => {
      if (!morphState.value) return ''
      const easedProgress = easeInOutSine(morphState.value.progress)
      return interpolatePath(morphState.value.fromBlobPath, morphState.value.toBlobPath, easedProgress)
    })

    // Watch for prop changes
    watch(
      () => [props.seed, props.width, props.height, props.mode],
      () => {
        initializeMorph()
      },
    )

    // Animation control
    watch(
      () => morphState.value?.progress,
      () => {
        if (morphState.value && morphState.value.progress < 1) {
          lastTime = 0
          animationFrameId = requestAnimationFrame(animate)
        }
      },
    )

    // Lifecycle
    onMounted(() => {
      initializeMorph()

      intervalId = setInterval(() => {
        if (morphState.value && morphState.value.progress >= 1) {
          startNewMorph()
        }
      }, props.interval)
    })

    onUnmounted(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      if (intervalId) {
        clearInterval(intervalId)
      }
    })

    return {
      size,
      interpolatedTriangles,
      interpolatedBlobPath,
    }
  },
})
</script>
