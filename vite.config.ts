import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env vars (including non-VITE_ prefixed ones) for server-side proxy use
  const env = loadEnv(mode, process.cwd(), '')
  const owmApiKey = env.OPENWEATHER_API_KEY ?? ''

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest', // Use custom service worker
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'DunApp PWA - Meteorológiai és Vízállás Monitoring',
        short_name: 'DunApp',
        description: 'Meteorológiai, vízállás és aszály monitoring alkalmazás',
        theme_color: '#00A8CC',
        background_color: '#F0F4F8',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      devOptions: {
        enabled: false,
        type: 'module'
      }
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    })
  ],

  // Build optimization
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'chart-vendor': ['recharts'],
          'map-vendor': ['leaflet', 'react-leaflet'],
          'query-vendor': ['@tanstack/react-query']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true
  },

  // Server optimization
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,
    // CORS proxy for external services
    proxy: {
      '/wms/hugeo': {
        target: 'https://map.hugeo.hu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wms\/hugeo/, '/arcgis/services/tvz/tvz100_all/MapServer/WMSServer'),
        secure: false
      },
      '/api/met': {
        target: 'https://www.met.hu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/met/, '/idojaras/agrometeorologia'),
        secure: false
      },
      '/met-img': {
        target: 'https://www.met.hu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/met-img/, '/img'),
        secure: false
      },
      // OWM tile proxy (dev only) — adds API key server-side, same as Netlify edge function
      '/owm-tiles': {
        target: 'https://tile.openweathermap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/owm-tiles\/(.+)$/, `/map/$1?appid=${owmApiKey}`),
        secure: true
      },
      // OMSZ satellite proxy
      '/met-satellite': {
        target: 'https://odp.met.hu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/met-satellite/, '/weather/satellite/Msg/InfraCloud'),
        secure: true
      }
    }
  },

  // Preview server
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: false
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src'
    }
  }
  }
})
