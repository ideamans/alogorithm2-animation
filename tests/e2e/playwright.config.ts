import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  fullyParallel: false, // Run tests sequentially to avoid port conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Use single worker
  reporter: 'html',
  timeout: 60000, // 60 seconds timeout
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'react',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
      testMatch: 'react.spec.ts',
    },
    {
      name: 'vue',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3002',
      },
      testMatch: 'vue.spec.ts',
    },
    {
      name: 'astro',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3003',
      },
      testMatch: 'astro.spec.ts',
    },
  ],

  webServer: [
    {
      command: 'yarn dev:react',
      port: 3001,
      cwd: '../../example',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'yarn dev:vue',
      port: 3002,
      cwd: '../../example',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'yarn dev:astro',
      port: 3003,
      cwd: '../../example',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
})
