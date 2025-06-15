import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001
  },
  resolve: {
    alias: {
      'alogorithm2-animation': resolve(__dirname, '../node_modules/alogorithm2-animation/dist')
    }
  }
})