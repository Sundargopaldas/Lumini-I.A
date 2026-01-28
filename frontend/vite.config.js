import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa' // 🚫 REMOVIDO - causava conflitos
import { compression } from 'vite-plugin-compression2'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 🚫 VitePWA COMPLETAMENTE REMOVIDO
    // Gzip compression para melhor performance
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    })
  ],
  build: {
    // 🔥 HASH NOS ARQUIVOS PARA FORÇAR CACHE BUST
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Hash único em TODOS os arquivos
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'i18n-vendor': ['i18next', 'react-i18next'],
        }
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Minify
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // TEMPORÁRIO: Manter console.logs para debug
        drop_debugger: true
      }
    }
  },
  // Performance optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
