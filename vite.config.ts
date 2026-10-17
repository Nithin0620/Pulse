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
      },
      // Proxy Azure Blob Storage uploads for Sarvam AI to avoid CORS
      '/api/sarvam-upload': {
        target: 'https://appsprodaksharpublicsa.blob.core.windows.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sarvam-upload/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Forward PUT/POST methods properly
            if (req.method === 'PUT' || req.method === 'POST') {
              proxyReq.setHeader('x-ms-blob-type', 'BlockBlob');
            }
          });
        },
      }
    }
  }
})
