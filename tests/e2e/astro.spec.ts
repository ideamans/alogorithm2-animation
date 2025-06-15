import { test, expect } from '@playwright/test'

test.describe('Astro Example', () => {
  test('should render SVG with content', async ({ page }) => {
    await page.goto('/')
    
    // Wait longer for Astro to fully load
    await page.waitForTimeout(3000)
    
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
    
    // Check if at least one SVG has content (polygons)
    const polygonCount = await page.locator('svg polygon').count()
    expect(polygonCount).toBeGreaterThan(0)
  })
})