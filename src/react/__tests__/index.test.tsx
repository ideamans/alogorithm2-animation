import { render } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Alogorithm2Animation } from '../index'

// Mock the animation module
vi.mock('../../animation', () => ({
  generateRandomSeed: () => 'test-seed',
  generateTriangles: vi.fn(() => [
    {
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 },
      ],
      color: 'hsl(180, 50%, 50%)',
    },
    {
      points: [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 150, y: 200 },
      ],
      color: 'hsl(240, 50%, 50%)',
    },
  ]),
  generateBlobPath: vi.fn(() => 'M0,0L100,0L100,100L0,100Z'),
  extractVertices: vi.fn((triangles) => ({
    vertices: [
      { x: 0, y: 0, paths: [] },
      { x: 100, y: 0, paths: [] },
      { x: 50, y: 100, paths: [] },
      { x: 100, y: 100, paths: [] },
      { x: 200, y: 100, paths: [] },
      { x: 150, y: 200, paths: [] },
    ],
    triangles: triangles.map((t, i) => ({
      ...t,
      vertexIndices: [i * 3, i * 3 + 1, i * 3 + 2],
    })),
  })),
  matchVertices: vi.fn(() => [
    { fromIdx: 0, toIdx: 0 },
    { fromIdx: 1, toIdx: 1 },
    { fromIdx: 2, toIdx: 2 },
  ]),
  easeInOutSine: vi.fn((t) => t),
  interpolateNumber: vi.fn((from, to, progress) => from + (to - from) * progress),
  interpolateColor: vi.fn((from) => from),
  interpolatePath: vi.fn((from) => from),
}))

describe('Alogorithm2Animation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders SVG with default props', () => {
    const { container } = render(<Alogorithm2Animation />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '400')
    expect(svg).toHaveAttribute('height', '400')
    expect(svg).toHaveAttribute('viewBox', '0 0 400 400')
  })

  it('renders with custom dimensions', () => {
    const { container } = render(<Alogorithm2Animation width={600} height={300} />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '600')
    expect(svg).toHaveAttribute('height', '300')
    expect(svg).toHaveAttribute('viewBox', '0 0 300 300') // Uses min(width, height)
  })

  it('renders with custom seed', () => {
    const { container } = render(<Alogorithm2Animation seed="custom-seed" />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders triangles with clipPath', () => {
    const { container } = render(<Alogorithm2Animation />)

    // Check clipPath exists
    const clipPath = container.querySelector('clipPath#alogorithm2-clip')
    expect(clipPath).toBeInTheDocument()

    // Check triangles are rendered
    const polygons = container.querySelectorAll('polygon')
    expect(polygons.length).toBeGreaterThan(0)
  })

  it('supports different modes', () => {
    const { container, rerender } = render(<Alogorithm2Animation mode="morph" />)
    let svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()

    rerender(<Alogorithm2Animation mode="fly" />)
    svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('starts animation automatically', async () => {
    const { generateTriangles } = await import('../../animation')

    render(<Alogorithm2Animation duration={1000} interval={2000} />)

    // Initial render should call generateTriangles
    expect(generateTriangles).toHaveBeenCalledTimes(1)

    // Clear mock to count new calls
    vi.mocked(generateTriangles).mockClear()

    // Fast forward to trigger animation
    vi.advanceTimersByTime(2100)

    // Should have started new morph
    expect(generateTriangles).toHaveBeenCalledTimes(1)
  })

  it('respects custom duration', async () => {
    const { container } = render(<Alogorithm2Animation duration={500} interval={1000} />)

    // Wait for animation to start
    vi.advanceTimersByTime(1100)

    // Animation should be in progress
    const polygons = container.querySelectorAll('polygon')
    expect(polygons.length).toBeGreaterThan(0)
  })

  it('handles morph mode with vertex matching', async () => {
    const { extractVertices, matchVertices } = await import('../../animation')

    render(<Alogorithm2Animation mode="morph" />)

    // Initial render should call extractVertices
    expect(extractVertices).toHaveBeenCalled()

    // Clear mocks
    vi.mocked(extractVertices).mockClear()
    vi.mocked(matchVertices).mockClear()

    // Trigger new morph
    vi.advanceTimersByTime(4100)

    // Should have called both functions for new morph
    expect(extractVertices).toHaveBeenCalled()
    expect(matchVertices).toHaveBeenCalled()
  })

  it('renders with proper opacity during animation', () => {
    const { container } = render(<Alogorithm2Animation mode="morph" duration={1000} />)

    const polygons = container.querySelectorAll('polygon')
    polygons.forEach((polygon) => {
      const opacity = polygon.getAttribute('opacity')
      expect(opacity).toBeDefined()
      const opacityValue = parseFloat(opacity || '1')
      expect(opacityValue).toBeGreaterThanOrEqual(0)
      expect(opacityValue).toBeLessThanOrEqual(1)
    })
  })
})
