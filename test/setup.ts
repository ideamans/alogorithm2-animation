import '@testing-library/jest-dom'

// Mock requestAnimationFrame for tests
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(callback, 16) as unknown as number
}

global.cancelAnimationFrame = (id: number): void => {
  clearTimeout(id)
}