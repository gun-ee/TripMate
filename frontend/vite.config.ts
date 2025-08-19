import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/images/profile': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
