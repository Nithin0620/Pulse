import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expose to local network for mobile testing
    port: 5173,
    proxy: {
      // Proxy Overpass API requests to avoid CORS issues in development
      '/api/overpass': {
        target: 'https://overpass.kumi.systems',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/overpass/, '/api/interpreter'),
        secure: true,
      }
    }
  }
})
