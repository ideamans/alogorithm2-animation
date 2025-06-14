import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  srcDir: './src',
  publicDir: './public',
  outDir: '../../dist/astro',
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@': resolve('./../../src'),
      }
    }
  }
})