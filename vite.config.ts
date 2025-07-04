import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'd3': ['d3'],
          'mui': ['@mui/material', '@mui/icons-material'],
          'vendor': ['react', 'react-dom']
        }
      }
    }
  },
      resolve: {
      alias: {
        '@': resolve(import.meta.url, '../frontend'),
        '@components': resolve(import.meta.url, '../frontend/components'),
        '@types': resolve(import.meta.url, '../frontend/types'),
        '@services': resolve(import.meta.url, '../frontend/services'),
        '@stores': resolve(import.meta.url, '../frontend/stores'),
        '@utils': resolve(import.meta.url, '../frontend/utils')
      }
    },
  optimizeDeps: {
    include: ['react', 'react-dom', 'd3', '@mui/material']
  }
})
