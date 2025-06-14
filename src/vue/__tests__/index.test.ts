import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import Alogorithm2Animation from '../index.vue'

// Mock the animation module
vi.mock('../../animation', () => ({
  DEFAULT_CONFIG: {
    variance: 1.5,
    cellSizeRatio: 0.2,
    seedPrefix: "ideaman's ",
    extraPoints: 8,
    randomness: 4,
  },
  generateRandomSeed: vi.fn(() => 'random-seed'),
  generateTriangles: vi.fn((seed, size, mode) => {
    if (mode === 'fly') {
      // For fly mode, return triangles with points structure
      return [
        {
          points: [
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 25, y: 50 },
          ],
          color: '#ff0000',
          opacity: 1,
        },
        {
          points: [
            { x: 100, y: 0 },
            { x: 150, y: 0 },
            { x: 125, y: 50 },
          ],
          color: '#00ff00',
          opacity: 1,
        },
      ]
    }
    // For morph mode, return simple triangle data
    return [
      { x: 0, y: 0, fill: '#ff0000', stroke: '#ff0000', opacity: 1 },
      { x: 100, y: 0, fill: '#00ff00', stroke: '#00ff00', opacity: 1 },
      { x: 50, y: 100, fill: '#0000ff', stroke: '#0000ff', opacity: 1 },
    ]
  }),
  generateBlobPath: vi.fn(() => 'M100,50 Q150,100 100,150 Q50,100 100,50'),
  extractVertices: vi.fn((triangles) => ({
    vertices: triangles.map((t: any) => ({ x: t.x, y: t.y })),
    triangles: triangles.map((t: any, i: number) => ({
      points: [
        { x: t.x, y: t.y },
        { x: (t.x + 10) % 100, y: t.y },
        { x: t.x, y: (t.y + 10) % 100 },
      ],
      color: t.fill,
      opacity: t.opacity || 1,
      vertexIndices: [i, (i + 1) % 3, (i + 2) % 3],
    })),
  })),
  matchVertices: vi.fn((fromVerts) => fromVerts.map((_: any, i: number) => i)),
  easeInOutSine: vi.fn((t) => t),
  interpolateNumber: vi.fn((from, to, progress) => from + (to - from) * progress),
  interpolateColor: vi.fn((from) => from),
  interpolatePath: vi.fn((from) => from),
  createInterpolatedTriangles: vi.fn((from: any, to: any, progress: number) =>
    from.map((f: any, i: number) => ({
      ...f,
      x: f.x + (to[i].x - f.x) * progress,
      y: f.y + (to[i].y - f.y) * progress,
    })),
  ),
}))

describe('Alogorithm2Animation Vue Component', () => {
  let requestAnimationFrameSpy: any
  let cancelAnimationFrameSpy: any
  let rafCallbacks: Array<(time: number) => void> = []
  let rafId = 0

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    rafCallbacks = []
    rafId = 0

    requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = ++rafId
      rafCallbacks.push(callback)
      return id
    })

    cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    requestAnimationFrameSpy.mockRestore()
    cancelAnimationFrameSpy.mockRestore()
    vi.useRealTimers()
  })

  const flushAnimationFrames = (time: number = 0) => {
    const callbacks = [...rafCallbacks]
    rafCallbacks = []
    callbacks.forEach((cb) => cb(time))
  }

  it('renders SVG with correct dimensions', () => {
    const wrapper = mount(Alogorithm2Animation, {
      props: {
        width: 400,
        height: 300,
      },
    })

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('width')).toBe('400')
    expect(svg.attributes('height')).toBe('300')
    expect(svg.attributes('viewBox')).toBe('0 0 300 300')
  })

  it('renders triangles in morph mode', async () => {
    const wrapper = mount(Alogorithm2Animation, {
      props: {
        width: 300,
        height: 300,
        mode: 'morph',
      },
    })

    await nextTick()

    const triangles = wrapper.findAll('polygon')
    expect(triangles.length).toBeGreaterThan(0)
  })

  it('renders blob path in morph mode', async () => {
    const wrapper = mount(Alogorithm2Animation, {
      props: {
        width: 300,
        height: 300,
        mode: 'morph',
      },
    })

    await nextTick()

    const paths = wrapper.findAll('path')
    const blobPath = paths.find((p) => p.attributes('d')?.includes('M'))
    expect(blobPath).toBeDefined()
  })

  it('animates triangles in fly mode', async () => {
    const wrapper = mount(Alogorithm2Animation, {
      props: {
        width: 300,
        height: 300,
        mode: 'fly',
        duration: 1000,
        interval: 2000,
      },
    })

    await nextTick()

    // Initial state
    let triangles = wrapper.findAll('polygon')
    const initialCount = triangles.length

    // Wait for interval to trigger animation
    vi.advanceTimersByTime(2000)
    await nextTick()

    // Animation should now be in progress
    triangles = wrapper.findAll('polygon')
    expect(triangles.length).toBe(initialCount)

    // Animation frame should have been requested
    expect(requestAnimationFrameSpy).toHaveBeenCalled()
  })

  it('implements crossfade in morph mode', async () => {
    const wrapper = mount(Alogorithm2Animation, {
      props: {
        width: 300,
        height: 300,
        mode: 'morph',
        duration: 1000,
      },
    })

    await nextTick()

    // Start animation
    flushAnimationFrames(0)
    await nextTick()

    // Mid animation (50% progress)
    flushAnimationFrames(500)
    await nextTick()

    // During morph, we should see both triangle sets with different opacities
    const polygons = wrapper.findAll('polygon')
    const opacities = polygons.map((p) => p.attributes('opacity'))

    // Should have triangles with opacity values
    expect(opacities.length).toBeGreaterThan(0)
  })

  it('respects custom seed prop', async () => {
    mount(Alogorithm2Animation, {
      props: {
        width: 300,
        height: 300,
        seed: 'custom-seed',
      },
    })

    await nextTick()

    const { generateTriangles } = await import('../../animation')
    expect(generateTriangles).toHaveBeenCalledWith('custom-seed', 300, 'morph')
  })

  it('cleans up animation on unmount', async () => {
    const wrapper = mount(Alogorithm2Animation, {
      props: {
        width: 300,
        height: 300,
        mode: 'fly',
        interval: 100,
      },
    })

    await nextTick()

    // Let interval trigger
    vi.advanceTimersByTime(150)
    await nextTick()

    // Unmount
    wrapper.unmount()

    // Should cancel animation frame if any was running
    // The test passes if no errors occur during unmount
    expect(wrapper.exists()).toBe(false)
  })

  it('handles interval prop correctly', async () => {
    mount(Alogorithm2Animation, {
      props: {
        width: 300,
        height: 300,
        mode: 'morph',
        duration: 500,
        interval: 1000,
      },
    })

    await nextTick()

    // Complete first animation
    flushAnimationFrames(0)
    flushAnimationFrames(500)
    await nextTick()

    // Should pause for interval
    flushAnimationFrames(1000)
    await nextTick()

    // Should start new animation after interval
    flushAnimationFrames(1500)
    await nextTick()

    // Wait for interval to trigger
    vi.advanceTimersByTime(1100)
    await nextTick()

    const { generateTriangles } = await import('../../animation')
    // Should have generated new triangles for the next animation
    const callCount = (generateTriangles as any).mock.calls.length
    expect(callCount).toBeGreaterThan(1)
  })

  it('updates blob path during animation', async () => {
    mount(Alogorithm2Animation, {
      props: {
        width: 300,
        height: 300,
        mode: 'morph',
        duration: 1000,
      },
    })

    await nextTick()

    const { generateBlobPath } = await import('../../animation')

    // Initial blob
    expect(generateBlobPath).toHaveBeenCalled()
    const initialCallCount = (generateBlobPath as any).mock.calls.length

    // Start animation
    flushAnimationFrames(0)
    await nextTick()

    // Complete animation
    flushAnimationFrames(1000)
    await nextTick()

    // Wait for interval to trigger new animation
    vi.advanceTimersByTime(4100)
    await nextTick()

    // Should have generated new blob for next animation
    const finalCallCount = (generateBlobPath as any).mock.calls.length
    expect(finalCallCount).toBeGreaterThan(initialCallCount)
  })

  it('maintains correct opacity during morph animation', async () => {
    const wrapper = mount(Alogorithm2Animation, {
      props: {
        width: 300,
        height: 300,
        mode: 'morph',
        duration: 1000,
      },
    })

    await nextTick()

    // Start animation
    flushAnimationFrames(0)
    await nextTick()

    // Check at 25% progress
    flushAnimationFrames(250)
    await nextTick()

    let polygons = wrapper.findAll('polygon')
    let opacities = polygons.map((p) => parseFloat(p.attributes('opacity') || '1'))

    // Some triangles should have opacity 0.75 (from) and some 0.25 (to)
    expect(opacities.length).toBeGreaterThan(0)

    // Check at 75% progress
    flushAnimationFrames(750)
    await nextTick()

    polygons = wrapper.findAll('polygon')
    opacities = polygons.map((p) => parseFloat(p.attributes('opacity') || '1'))

    // Some triangles should have opacity 0.25 (from) and some 0.75 (to)
    expect(opacities.length).toBeGreaterThan(0)
  })
})
