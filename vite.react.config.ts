import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'dev/react',
  build: {
    outDir: '../../dist/react',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})