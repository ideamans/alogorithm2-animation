import Blobs2 from 'blobs/v2/index.js'
import Trianglify from 'trianglify-ts-no-canvas'

import { scaleSvgPath } from './svg'

export interface AnimationOptions {
  width: number
  height: number
  seed?: string
  mode?: 'fly' | 'morph'
  duration?: number
  interval?: number
}

export interface Point {
  x: number
  y: number
}

export interface Triangle {
  points: Point[]
  color: string
  centroid?: Point
  opacity?: number
  vertexIndices?: number[]
}

export interface Vertex {
  x: number
  y: number
  paths: { pathIndex: number; pointIndex: number }[]
}

export interface MorphState {
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

// Default configuration (from dev/browser-dependency.ts)
export const DEFAULT_CONFIG = {
  variance: 1.5,
  cellSizeRatio: 0.2,
  seedPrefix: "ideaman's ",
  extraPoints: 8,
  randomness: 4,
}

// Get dependency configuration (for compatibility with legacy code)
export function getDependency() {
  return {
    markDefaults: DEFAULT_CONFIG,
  }
}

// Ease function for smooth animation
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

// Interpolate between two numbers
export function interpolateNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * progress
}

// Parse HSL color
function parseHSL(color: string): { h: number; s: number; l: number } | null {
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
  const match = rgb.match(/rgb\((\d+),(\d+),(\d+)\)/)
  if (!match) return rgb

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
export function interpolateColor(from: string, to: string, progress: number): string {
  const fromHSL = parseHSL(from)
  const toHSL = parseHSL(to)

  if (!fromHSL || !toHSL) {
    return progress < 0.5 ? from : to
  }

  const h = Math.round(interpolateNumber(fromHSL.h, toHSL.h, progress))
  const s = Math.round(interpolateNumber(fromHSL.s, toHSL.s, progress))
  const l = Math.round(interpolateNumber(fromHSL.l, toHSL.l, progress))

  return `hsl(${h}, ${s}%, ${l}%)`
}

// Interpolate path
export function interpolatePath(fromPath: string, toPath: string, progress: number): string {
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

// Generate random seed
export function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Extract vertices from triangles
export function extractVertices(triangles: Triangle[]): { vertices: Vertex[]; triangles: Triangle[] } {
  const vertices: Vertex[] = []
  const vertexMap = new Map<string, number>()

  const updatedTriangles = triangles.map((triangle, pathIndex) => {
    const vertexIndices: number[] = []

    triangle.points.forEach((point, pointIndex) => {
      const key = `${point.x},${point.y}`
      let vertexIndex = vertexMap.get(key)

      if (vertexIndex === undefined) {
        vertexIndex = vertices.length
        vertices.push({
          x: point.x,
          y: point.y,
          paths: [],
        })
        vertexMap.set(key, vertexIndex)
      }

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

// Generate triangles using Trianglify
export function generateTriangles(seed: string, size: number, animationMode: 'fly' | 'morph'): Triangle[] {
  const fullSeed = DEFAULT_CONFIG.seedPrefix + seed

  const pattern = Trianglify({
    width: size,
    height: size,
    variance: DEFAULT_CONFIG.variance,
    cellSize: size * DEFAULT_CONFIG.cellSizeRatio,
    seed: fullSeed,
  })

  const svg = pattern.toSVG()
  const paths = svg.querySelectorAll('path')
  const triangles: Triangle[] = []

  paths.forEach((path) => {
    const d = path.getAttribute('d')
    const fill = path.getAttribute('fill')

    if (d && fill) {
      const matches = d.match(
        /M\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*L\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*L\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*Z?/,
      )

      if (matches && matches.length >= 7) {
        const points = [
          { x: parseFloat(matches[1]), y: parseFloat(matches[2]) },
          { x: parseFloat(matches[3]), y: parseFloat(matches[4]) },
          { x: parseFloat(matches[5]), y: parseFloat(matches[6]) },
        ]

        const centroid = {
          x: (points[0].x + points[1].x + points[2].x) / 3,
          y: (points[0].y + points[1].y + points[2].y) / 3,
        }

        const color = convertRGBtoHSL(fill)
        triangles.push({ points, color, centroid })
      }
    }
  })

  // Sort triangles by position
  if (animationMode === 'morph') {
    const centerX = size / 2
    const centerY = size / 2

    triangles.sort((a, b) => {
      const centroidA = a.centroid!
      const centroidB = b.centroid!

      const angleA = Math.atan2(centroidA.y - centerY, centroidA.x - centerX)
      const angleB = Math.atan2(centroidB.y - centerY, centroidB.x - centerX)
      const distA = Math.sqrt(Math.pow(centroidA.x - centerX, 2) + Math.pow(centroidA.y - centerY, 2))
      const distB = Math.sqrt(Math.pow(centroidB.x - centerX, 2) + Math.pow(centroidB.y - centerY, 2))

      const sectorSize = Math.PI / 8
      const sectorA = Math.floor(angleA / sectorSize)
      const sectorB = Math.floor(angleB / sectorSize)

      if (sectorA !== sectorB) return sectorA - sectorB

      const bandSize = size / 10
      const bandA = Math.floor(distA / bandSize)
      const bandB = Math.floor(distB / bandSize)

      if (bandA !== bandB) return bandA - bandB

      return angleA - angleB
    })
  } else {
    const gridSize = 50
    triangles.sort((a, b) => {
      const aCentroid = a.centroid!
      const bCentroid = b.centroid!

      const aGridY = Math.floor(aCentroid.y / gridSize)
      const bGridY = Math.floor(bCentroid.y / gridSize)

      if (aGridY !== bGridY) return aGridY - bGridY

      const aGridX = Math.floor(aCentroid.x / gridSize)
      const bGridX = Math.floor(bCentroid.x / gridSize)

      if (aGridX !== bGridX) return aGridX - bGridX

      const yDiff = aCentroid.y - bCentroid.y
      if (Math.abs(yDiff) > 0.1) return yDiff
      return aCentroid.x - bCentroid.x
    })
  }

  // Remove centroid property from triangles before returning
  return triangles.map((triangle) => ({
    points: triangle.points,
    color: triangle.color,
  }))
}

// Generate blob path
export function generateBlobPath(seed: string, size: number): string {
  const fullSeed = DEFAULT_CONFIG.seedPrefix + seed

  const blobPath = Blobs2.svgPath({
    seed: fullSeed,
    extraPoints: DEFAULT_CONFIG.extraPoints,
    randomness: DEFAULT_CONFIG.randomness,
    size: 256,
  })

  return scaleSvgPath(blobPath, size, size)
}

// Match vertices between two vertex sets
export function matchVertices(
  fromVertices: Vertex[],
  toVertices: Vertex[],
  size: number,
): { fromIdx: number; toIdx: number }[] {
  const matches: { fromIdx: number; toIdx: number }[] = []
  const matchedTo = new Set<number>()

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
