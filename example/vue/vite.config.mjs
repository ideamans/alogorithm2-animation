import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3002
  },
  resolve: {
    alias: {
      'alogorithm2-animation': resolve(__dirname, '../node_modules/alogorithm2-animation/dist')
    }
  }
})