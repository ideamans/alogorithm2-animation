import React, { useEffect, useState, useRef } from 'react'
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

export interface Alogorithm2AnimationProps {
  width?: number
  height?: number
  seed?: string
  mode?: 'fly' | 'morph'
  duration?: number
  interval?: number
}

export const Alogorithm2Animation: React.FC<Alogorithm2AnimationProps> = ({
  width = 400,
  height = 400,
  seed,
  mode = 'morph',
  duration = 2000,
  interval = 4000,
}) => {
  const [morphState, setMorphState] = useState<MorphState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const animationFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const size = Math.min(width, height)

  // Initialize or update when seed changes
  useEffect(() => {
    const initializeMorph = () => {
      const initialSeed = seed || generateRandomSeed()
      const triangles = generateTriangles(initialSeed, size, mode)
      const blobPath = generateBlobPath(initialSeed, size)

      if (mode === 'morph') {
        const { vertices, triangles: trianglesWithVertices } = extractVertices(triangles)
        setMorphState({
          fromTriangles: trianglesWithVertices,
          toTriangles: trianglesWithVertices,
          fromVertices: vertices,
          toVertices: vertices,
          fromBlobPath: blobPath,
          toBlobPath: blobPath,
          progress: 1,
          currentSeed: initialSeed,
          nextSeed: initialSeed,
        })
      } else {
        setMorphState({
          fromTriangles: triangles,
          toTriangles: triangles,
          fromBlobPath: blobPath,
          toBlobPath: blobPath,
          progress: 1,
          currentSeed: initialSeed,
          nextSeed: initialSeed,
        })
      }
      setIsLoading(false)
    }

    initializeMorph()
  }, [seed, width, height, mode, size])

  // Start new morph
  const startNewMorph = () => {
    if (!morphState) return

    const newSeed = generateRandomSeed()
    const newTriangles = generateTriangles(newSeed, size, mode)
    const newBlobPath = generateBlobPath(newSeed, size)

    if (mode === 'morph' && morphState.toVertices && morphState.toTriangles) {
      const updatedFromTriangles = morphState.toTriangles.map((triangle) => {
        if (triangle.vertexIndices && triangle.vertexIndices.length === 3) {
          const points = triangle.vertexIndices.map((vIdx) => ({
            x: morphState.toVertices![vIdx].x,
            y: morphState.toVertices![vIdx].y,
          }))
          return {
            ...triangle,
            points,
          }
        }
        return triangle
      })

      const { vertices: newVertices, triangles: newTrianglesWithVertices } = extractVertices(newTriangles)
      const vertexMatches = matchVertices(morphState.toVertices, newVertices, size)

      setMorphState({
        fromTriangles: updatedFromTriangles,
        toTriangles: newTrianglesWithVertices,
        fromVertices: morphState.toVertices,
        toVertices: newVertices,
        vertexMatches,
        fromBlobPath: morphState.toBlobPath,
        toBlobPath: newBlobPath,
        progress: 0,
        currentSeed: morphState.nextSeed,
        nextSeed: newSeed,
      })
    } else {
      setMorphState({
        fromTriangles: morphState.toTriangles,
        toTriangles: newTriangles,
        fromBlobPath: morphState.toBlobPath,
        toBlobPath: newBlobPath,
        progress: 0,
        currentSeed: morphState.nextSeed,
        nextSeed: newSeed,
      })
    }

    lastTimeRef.current = 0
  }

  // Animation loop
  const animate = (currentTime: number) => {
    if (!morphState || morphState.progress >= 1) return

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime
    }

    const deltaTime = currentTime - lastTimeRef.current
    const progress = Math.min(morphState.progress + deltaTime / duration, 1)

    setMorphState((prev) => (prev ? { ...prev, progress } : null))

    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }
  }

  // Handle auto-animation
  useEffect(() => {
    if (!morphState || isLoading) return

    const intervalId = setInterval(() => {
      if (morphState.progress >= 1) {
        startNewMorph()
      }
    }, interval)

    return () => clearInterval(intervalId)
  }, [morphState, interval, isLoading])

  // Start animation when morph begins
  useEffect(() => {
    if (morphState && morphState.progress < 1) {
      lastTimeRef.current = 0
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [morphState?.currentSeed, morphState?.nextSeed])

  if (!morphState) {
    return null
  }

  // Interpolate the current state
  const easedProgress = easeInOutSine(morphState.progress)
  const interpolatedTriangles: Triangle[] = []
  const fromCount = morphState.fromTriangles.length
  const toCount = morphState.toTriangles.length

  if (mode === 'morph' && morphState.fromVertices && morphState.toVertices && morphState.vertexMatches) {
    const fromOpacity = 1 - easedProgress
    const toOpacity = easedProgress

    if (morphState.progress <= 0) {
      morphState.fromTriangles.forEach((triangle) => {
        if (triangle.vertexIndices && triangle.vertexIndices.length === 3) {
          const points = triangle.vertexIndices.map((vIdx) => morphState.fromVertices![vIdx] || { x: 0, y: 0 })
          interpolatedTriangles.push({
            points,
            color: triangle.color,
            opacity: 1,
          })
        }
      })
    } else if (morphState.progress >= 1) {
      morphState.toTriangles.forEach((triangle) => {
        if (triangle.vertexIndices && triangle.vertexIndices.length === 3) {
          const points = triangle.vertexIndices.map((vIdx) => morphState.toVertices![vIdx] || { x: 0, y: 0 })
          interpolatedTriangles.push({
            points,
            color: triangle.color,
            opacity: 1,
          })
        }
      })
    } else {
      const interpolatedVertices: Point[] = new Array(
        Math.max(morphState.fromVertices.length, morphState.toVertices.length),
      )

      morphState.vertexMatches.forEach(({ fromIdx, toIdx }) => {
        const fromVertex = morphState.fromVertices![fromIdx]
        const toVertex = morphState.toVertices![toIdx]
        interpolatedVertices[toIdx] = {
          x: interpolateNumber(fromVertex.x, toVertex.x, easedProgress),
          y: interpolateNumber(fromVertex.y, toVertex.y, easedProgress),
        }
      })

      morphState.toVertices.forEach((vertex, idx) => {
        if (!interpolatedVertices[idx]) {
          let nearestDist = Infinity
          let nearestVertex = { x: size / 2, y: size / 2 }

          interpolatedVertices.forEach((v, vIdx) => {
            if (v && vIdx !== idx) {
              const dist = Math.sqrt(
                Math.pow(vertex.x - morphState.toVertices![vIdx].x, 2) +
                  Math.pow(vertex.y - morphState.toVertices![vIdx].y, 2),
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

      morphState.fromTriangles.forEach((fromTriangle) => {
        if (fromTriangle.vertexIndices && fromTriangle.vertexIndices.length === 3) {
          const points = fromTriangle.vertexIndices.map((vIdx) => {
            const vertexMatch = morphState.vertexMatches!.find((m) => m.fromIdx === vIdx)
            if (vertexMatch) {
              const fromVertex = morphState.fromVertices![vIdx]
              const toVertex = morphState.toVertices![vertexMatch.toIdx]
              return {
                x: interpolateNumber(fromVertex.x, toVertex.x, easedProgress),
                y: interpolateNumber(fromVertex.y, toVertex.y, easedProgress),
              }
            } else {
              const fromVertex = morphState.fromVertices![vIdx]
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
          interpolatedTriangles.push({
            points,
            color: fromTriangle.color,
            opacity: fromOpacity,
          })
        }
      })

      morphState.toTriangles.forEach((toTriangle) => {
        if (toTriangle.vertexIndices && toTriangle.vertexIndices.length === 3) {
          const points = toTriangle.vertexIndices.map((vIdx) => {
            const vertex = interpolatedVertices[vIdx]
            if (!vertex) {
              const toVertex = morphState.toVertices![vIdx]
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
          interpolatedTriangles.push({
            points,
            color: toTriangle.color,
            opacity: toOpacity,
          })
        }
      })
    }
  } else if (mode === 'morph') {
    const triangleMatches: { fromIdx: number; toIdx: number }[] = []
    const matchedFrom = new Set<number>()
    const matchedTo = new Set<number>()

    morphState.fromTriangles.forEach((fromTriangle, fromIdx) => {
      const fromCentroid = {
        x: (fromTriangle.points[0].x + fromTriangle.points[1].x + fromTriangle.points[2].x) / 3,
        y: (fromTriangle.points[0].y + fromTriangle.points[1].y + fromTriangle.points[2].y) / 3,
      }

      let bestMatch = -1
      let bestDistance = Infinity

      morphState.toTriangles.forEach((toTriangle, toIdx) => {
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

      if (bestMatch !== -1 && bestDistance < size * 0.4) {
        triangleMatches.push({ fromIdx, toIdx: bestMatch })
        matchedFrom.add(fromIdx)
        matchedTo.add(bestMatch)
      }
    })

    triangleMatches.forEach(({ fromIdx, toIdx }) => {
      const fromTriangle = morphState.fromTriangles[fromIdx]
      const toTriangle = morphState.toTriangles[toIdx]

      const interpolatedPoints = fromTriangle.points.map((fromPoint, i) => {
        const toPoint = toTriangle.points[i]
        return {
          x: interpolateNumber(fromPoint.x, toPoint.x, easedProgress),
          y: interpolateNumber(fromPoint.y, toPoint.y, easedProgress),
        }
      })

      interpolatedTriangles.push({
        points: interpolatedPoints,
        color: interpolateColor(fromTriangle.color, toTriangle.color, easedProgress),
        opacity: 1,
      })
    })

    morphState.fromTriangles.forEach((fromTriangle, idx) => {
      if (!matchedFrom.has(idx)) {
        const center = {
          x: (fromTriangle.points[0].x + fromTriangle.points[1].x + fromTriangle.points[2].x) / 3,
          y: (fromTriangle.points[0].y + fromTriangle.points[1].y + fromTriangle.points[2].y) / 3,
        }

        const interpolatedPoints = fromTriangle.points.map((point) => ({
          x: interpolateNumber(point.x, center.x, easedProgress),
          y: interpolateNumber(point.y, center.y, easedProgress),
        }))

        interpolatedTriangles.push({
          points: interpolatedPoints,
          color: fromTriangle.color,
          opacity: 1 - easedProgress,
        })
      }
    })

    morphState.toTriangles.forEach((toTriangle, idx) => {
      if (!matchedTo.has(idx)) {
        const center = {
          x: (toTriangle.points[0].x + toTriangle.points[1].x + toTriangle.points[2].x) / 3,
          y: (toTriangle.points[0].y + toTriangle.points[1].y + toTriangle.points[2].y) / 3,
        }

        const interpolatedPoints = toTriangle.points.map((point) => ({
          x: interpolateNumber(center.x, point.x, easedProgress),
          y: interpolateNumber(center.y, point.y, easedProgress),
        }))

        interpolatedTriangles.push({
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
        fromTriangle = morphState.fromTriangles[i]
        toTriangle = morphState.toTriangles[i]
      } else if (i >= fromCount) {
        fromTriangle = {
          points: [
            { x: size / 2, y: size / 2 },
            { x: size / 2, y: size / 2 },
            { x: size / 2, y: size / 2 },
          ],
          color: morphState.toTriangles[i].color,
        }
        toTriangle = morphState.toTriangles[i]
      } else {
        fromTriangle = morphState.fromTriangles[i]
        toTriangle = {
          points: [
            { x: size / 2, y: size / 2 },
            { x: size / 2, y: size / 2 },
            { x: size / 2, y: size / 2 },
          ],
          color: morphState.fromTriangles[i].color,
        }
      }

      const interpolatedPoints = fromTriangle.points.map((fromPoint, j) => {
        const toPoint = toTriangle.points[j]
        return {
          x: interpolateNumber(fromPoint.x, toPoint.x, easedProgress),
          y: interpolateNumber(fromPoint.y, toPoint.y, easedProgress),
        }
      })

      interpolatedTriangles.push({
        points: interpolatedPoints,
        color: interpolateColor(fromTriangle.color, toTriangle.color, easedProgress),
      })
    }
  }

  const interpolatedBlobPath = interpolatePath(morphState.fromBlobPath, morphState.toBlobPath, easedProgress)

  // Render SVG
  return (
    <svg width={width} height={height} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="alogorithm2-clip">
          <path d={interpolatedBlobPath} />
        </clipPath>
      </defs>
      <g clipPath="url(#alogorithm2-clip)">
        {interpolatedTriangles.map((triangle, index) => (
          <polygon
            key={index}
            points={triangle.points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill={triangle.color}
            opacity={triangle.opacity || 1}
          />
        ))}
      </g>
    </svg>
  )
}
