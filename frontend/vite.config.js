import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { compression } from 'vite-plugin-compression2'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true, // 🔥 LIMPAR CACHES ANTIGOS
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.luminiiadigital\.com\.br\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'lumini-v310-email-verify-2026', // 🔥 NOVA VERSÃO
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 30 // 🔥 30 minutos apenas
              },
              networkTimeoutSeconds: 3
            }
          }
        ]
      },
      includeAssets: ['logo.svg', 'logo.png', 'icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'Lumini I.A - Gestão Financeira Inteligente',
        short_name: 'Lumini',
        version: '3.1.0',
        description: 'Gestão financeira inteligente com IA. Controle suas finanças, integre bancos e emita notas fiscais.',
        theme_color: '#8b5cf6',
        background_color: '#1e1b4b',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'any',
        categories: ['finance', 'business', 'productivity'],
        lang: 'pt-BR',
        dir: 'ltr',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable'
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'logo.png',
            sizes: '540x720',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      }
    }),
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
