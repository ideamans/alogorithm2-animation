import { test, expect } from '@playwright/test'

test.describe('React Example', () => {
  test('should render SVG with content', async ({ page }) => {
    await page.goto('/')
    
    // Wait longer for Vite to fully load
    await page.waitForTimeout(3000)
    
    // Wait for the app to mount
    await page.waitForSelector('#root', { state: 'attached' })
    
    // Check if SVG elements exist in the DOM
    const svgCount = await page.locator('svg').count()
    
    // If still no SVGs, wait a bit more and check again
    if (svgCount === 0) {
      await page.waitForTimeout(2000)
      const retryCount = await page.locator('svg').count()
      expect(retryCount).toBeGreaterThan(0)
    } else {
      expect(svgCount).toBeGreaterThan(0)
    }
    
    // Check if SVG has content (polygons)
    const polygonCount = await page.locator('svg polygon').count()
    expect(polygonCount).toBeGreaterThan(0)
  })
})