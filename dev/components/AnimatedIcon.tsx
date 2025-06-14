import React, { useEffect, useState, useRef } from 'react'
import { getDependency } from '../dependency'
import { generateRandomSeed } from '../utils'
import Trianglify from 'trianglify'
import Blobs2 from 'blobs/v2/index.js'
import { scaleSvgPath } from '../../src/svg'

interface AnimatedIconProps {
  seed?: string
  size?: number
  autoAnimate?: boolean
  animationInterval?: number
  animation?: 'flying' | 'morph'
  manualProgress?: number
}

interface Point {
  x: number
  y: number
}

interface Triangle {
  points: Point[]
  color: string
  centroid?: Point
  opacity?: number
  vertexIndices?: number[] // Indices to shared vertices
}

interface Vertex {
  x: number
  y: number
  paths: { pathIndex: number; pointIndex: number }[] // Which paths use this vertex
}

interface MorphState {
  fromTriangles: Triangle[]
  toTriangles: Triangle[]
  fromVertices?: Vertex[]
  toVertices?: Vertex[]
  vertexMatches?: { fromIdx: number; toIdx: number }[]
  fromBlobPath: string
  toBlobPath: string
  progress: number
  currentSeed: string
  nextSeed: string
}

// Ease function for smooth animation
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

// Interpolate between two numbers
function interpolateNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * progress
}

// Parse HSL color
function parseHSL(color: string): { h: number; s: number; l: number } | null {
  // Handle both hsl(h, s%, l%) and hsl(h,s%,l%) formats
  const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!match) return null
  return {
    h: parseInt(match[1]),
    s: parseInt(match[2]),
    l: parseInt(match[3]),
  }
}

// Convert RGB to HSL
function convertRGBtoHSL(rgb: string): string {
  // Parse rgb(r,g,b) format
  const match = rgb.match(/rgb\((\d+),(\d+),(\d+)\)/)
  if (!match) return rgb // Return original if not RGB format

  const r = parseInt(match[1]) / 255
  const g = parseInt(match[2]) / 255
  const b = parseInt(match[3]) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

// Interpolate colors
function interpolateColor(from: string, to: string, progress: number): string {
  const fromHSL = parseHSL(from)
  const toHSL = parseHSL(to)

  if (!fromHSL || !toHSL) {
    // If not HSL, try to parse as hex and fallback
    return progress < 0.5 ? from : to
  }

  const h = Math.round(interpolateNumber(fromHSL.h, toHSL.h, progress))
  const s = Math.round(interpolateNumber(fromHSL.s, toHSL.s, progress))
  const l = Math.round(interpolateNumber(fromHSL.l, toHSL.l, progress))

  return `hsl(${h}, ${s}%, ${l}%)`
}

// Interpolate path
function interpolatePath(fromPath: string, toPath: string, progress: number): string {
  const fromNumbers = fromPath.match(/-?\d+\.?\d*/g) || []
  const toNumbers = toPath.match(/-?\d+\.?\d*/g) || []

  if (fromNumbers.length !== toNumbers.length) {
    return progress < 0.5 ? fromPath : toPath
  }

  let result = fromPath
  let index = 0

  result = result.replace(/-?\d+\.?\d*/g, () => {
    const from = parseFloat(fromNumbers[index])
    const to = parseFloat(toNumbers[index])
    index++
    return interpolateNumber(from, to, progress).toFixed(2)
  })

  return result
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  seed,
  size = 400,
  autoAnimate = true,
  animationInterval = 4000,
  animation = 'flying',
  manualProgress,
}) => {
  const [morphState, setMorphState] = useState<MorphState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const animationFrameRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const morphDuration = 2000 // 2 seconds for morphing

  const dep = getDependency()

  // Extract vertices from triangles (paths) and create vertex sharing
  const extractVertices = (triangles: Triangle[]): { vertices: Vertex[]; triangles: Triangle[] } => {
    const vertices: Vertex[] = []
    const vertexMap = new Map<string, number>() // Map for exact coordinate matching

    // Updated triangles with vertex indices
    const updatedTriangles = triangles.map((triangle, pathIndex) => {
      const vertexIndices: number[] = []

      triangle.points.forEach((point, pointIndex) => {
        // Create a key for exact matching
        const key = `${point.x},${point.y}`

        // Find if this vertex already exists
        let vertexIndex = vertexMap.get(key)

        if (vertexIndex === undefined) {
          // Create new vertex
          vertexIndex = vertices.length
          vertices.push({
            x: point.x,
            y: point.y,
            paths: [],
          })
          vertexMap.set(key, vertexIndex)
        }

        // Add path reference to vertex
        vertices[vertexIndex].paths.push({
          pathIndex,
          pointIndex,
        })

        vertexIndices.push(vertexIndex)
      })

      return {
        ...triangle,
        vertexIndices,
      }
    })

    return { vertices, triangles: updatedTriangles }
  }

  // Generate triangles using Trianglify directly
  const generateTriangles = (seed: string, animationMode: 'flying' | 'morph'): Triangle[] => {
    const fullSeed = dep.markDefaults.seedPrefix + seed

    const pattern = Trianglify({
      width: size,
      height: size,
      variance: dep.markDefaults.variance,
      cellSize: size * dep.markDefaults.cellSizeRatio,
      seed: fullSeed,
    })

    const svg = pattern.toSVG()

    // Work directly with path elements
    const paths = svg.querySelectorAll('path')
    const triangles: Triangle[] = []

    // Parse path elements
    paths.forEach((path) => {
      const d = path.getAttribute('d')
      const fill = path.getAttribute('fill')

      if (d && fill) {
        // Parse path data - format is like "M196.9,240.8L192.1,323.4L222,242.6Z"
        // Support negative numbers, decimals, and optional spaces
        const matches = d.match(
          /M\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*L\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*L\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*Z?/,
        )

        if (matches && matches.length >= 7) {
          const points = [
            { x: parseFloat(matches[1]), y: parseFloat(matches[2]) },
            { x: parseFloat(matches[3]), y: parseFloat(matches[4]) },
            { x: parseFloat(matches[5]), y: parseFloat(matches[6]) },
          ]

          // Calculate centroid for sorting
          const centroid = {
            x: (points[0].x + points[1].x + points[2].x) / 3,
            y: (points[0].y + points[1].y + points[2].y) / 3,
          }

          // Convert rgb color to hsl
          const color = convertRGBtoHSL(fill)
          triangles.push({ points, color, centroid })
        }
      }
    })

    // Sort triangles by position to maintain consistent ordering
    if (animationMode === 'morph') {
      // For morph animation, sort by angle and distance from center
      // This provides more stable ordering across different seeds
      const centerX = size / 2
      const centerY = size / 2

      triangles.sort((a, b) => {
        const centroidA = a.centroid!
        const centroidB = b.centroid!

        // Calculate polar coordinates
        const angleA = Math.atan2(centroidA.y - centerY, centroidA.x - centerX)
        const angleB = Math.atan2(centroidB.y - centerY, centroidB.x - centerX)
        const distA = Math.sqrt(Math.pow(centroidA.x - centerX, 2) + Math.pow(centroidA.y - centerY, 2))
        const distB = Math.sqrt(Math.pow(centroidB.x - centerX, 2) + Math.pow(centroidB.y - centerY, 2))

        // First sort by angle (divided into sectors)
        const sectorSize = Math.PI / 8 // 16 sectors
        const sectorA = Math.floor(angleA / sectorSize)
        const sectorB = Math.floor(angleB / sectorSize)

        if (sectorA !== sectorB) return sectorA - sectorB

        // Then by distance bands
        const bandSize = size / 10
        const bandA = Math.floor(distA / bandSize)
        const bandB = Math.floor(distB / bandSize)

        if (bandA !== bandB) return bandA - bandB

        // Finally by exact angle within the same sector and band
        return angleA - angleB
      })
    } else {
      // For flying animation, use grid-based sorting (creates more chaotic movement)
      const gridSize = 50 // Grid cell size for grouping
      triangles.sort((a, b) => {
        const aGridY = Math.floor((a as any).centroid.y / gridSize)
        const bGridY = Math.floor((b as any).centroid.y / gridSize)

        if (aGridY !== bGridY) return aGridY - bGridY

        const aGridX = Math.floor((a as any).centroid.x / gridSize)
        const bGridX = Math.floor((b as any).centroid.x / gridSize)

        if (aGridX !== bGridX) return aGridX - bGridX

        // Within same grid cell, sort by exact position
        const yDiff = (a as any).centroid.y - (b as any).centroid.y
        if (Math.abs(yDiff) > 0.1) return yDiff
        return (a as any).centroid.x - (b as any).centroid.x
      })
    }

    // Remove centroid from final data
    const finalTriangles = triangles.map(({ centroid, ...triangle }) => triangle)
    return finalTriangles
  }

  // Generate blob path
  const generateBlobPath = (seed: string): string => {
    const fullSeed = dep.markDefaults.seedPrefix + seed

    const blobPath = Blobs2.svgPath({
      seed: fullSeed,
      extraPoints: dep.markDefaults.extraPoints,
      randomness: dep.markDefaults.randomness,
      size: 256,
    })

    return scaleSvgPath(blobPath, size, size)
  }

  // Initialize or update when seed changes
  useEffect(() => {
    const initializeMorph = async () => {
      const initialSeed = seed || generateRandomSeed()
      const triangles = generateTriangles(initialSeed, animation)
      const blobPath = generateBlobPath(initialSeed)

      if (animation === 'morph') {
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
  }, [seed, size, animation])

  // Match vertices between two vertex sets
  const matchVertices = (fromVertices: Vertex[], toVertices: Vertex[]): { fromIdx: number; toIdx: number }[] => {
    const matches: { fromIdx: number; toIdx: number }[] = []
    const matchedTo = new Set<number>()

    // For each from vertex, find the closest to vertex
    fromVertices.forEach((fromVertex, fromIdx) => {
      let bestMatch = -1
      let bestDistance = Infinity

      toVertices.forEach((toVertex, toIdx) => {
        if (matchedTo.has(toIdx)) return

        const distance = Math.sqrt(Math.pow(fromVertex.x - toVertex.x, 2) + Math.pow(fromVertex.y - toVertex.y, 2))

        if (distance < bestDistance && distance < size * 0.5) {
          bestDistance = distance
          bestMatch = toIdx
        }
      })

      if (bestMatch !== -1) {
        matches.push({ fromIdx, toIdx: bestMatch })
        matchedTo.add(bestMatch)
      }
    })

    return matches
  }

  // Start new morph
  const startNewMorph = () => {
    if (!morphState) return

    const newSeed = generateRandomSeed()
    const newTriangles = generateTriangles(newSeed, animation)
    const newBlobPath = generateBlobPath(newSeed)

    if (animation === 'morph' && morphState.toVertices && morphState.toTriangles) {
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
      const vertexMatches = matchVertices(morphState.toVertices, newVertices)

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
    const progress = Math.min(morphState.progress + deltaTime / morphDuration, 1)

    setMorphState((prev) => (prev ? { ...prev, progress } : null))

    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }
  }

  // Handle manual progress
  useEffect(() => {
    if (!autoAnimate && manualProgress !== undefined && morphState) {
      // If we don't have a proper morph set up yet, start one
      if (morphState.currentSeed === morphState.nextSeed && morphState.progress === 1) {
        startNewMorph()
      } else {
        setMorphState((prev) => (prev ? { ...prev, progress: manualProgress } : null))
      }
    }
  }, [manualProgress, autoAnimate])

  // Handle auto-animation
  useEffect(() => {
    if (!autoAnimate || !morphState || isLoading) return

    const interval = setInterval(() => {
      if (morphState.progress >= 1) {
        startNewMorph()
      }
    }, animationInterval)

    return () => clearInterval(interval)
  }, [autoAnimate, morphState, animationInterval, isLoading])

  // Start animation when morph begins
  useEffect(() => {
    if (morphState && morphState.progress < 1 && autoAnimate) {
      lastTimeRef.current = 0
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [morphState?.currentSeed, morphState?.nextSeed, autoAnimate])

  if (!morphState) {
    return <div>Loading...</div>
  }

  // Interpolate the current state - use raw progress when manually controlled
  const rawProgress = !autoAnimate && manualProgress !== undefined ? manualProgress : morphState.progress
  const easedProgress = easeInOutSine(rawProgress) // Apply easing to both animations

  // Interpolate triangles
  const fromCount = morphState.fromTriangles.length
  const toCount = morphState.toTriangles.length
  const interpolatedTriangles: Triangle[] = []

  if (animation === 'morph' && morphState.fromVertices && morphState.toVertices && morphState.vertexMatches) {
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
  } else if (animation === 'morph') {
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
    // Flying animation - use original index-based matching
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

  // Render the interpolated SVG
  return (
    <div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="morphing-clip">
            <path d={interpolatedBlobPath} />
          </clipPath>
        </defs>
        <g clipPath="url(#morphing-clip)">
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
    </div>
  )
}
