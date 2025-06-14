import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  root: 'dev/vue',
  build: {
    outDir: '../../dist/vue',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})