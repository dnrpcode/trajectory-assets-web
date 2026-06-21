import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// In local dev, Vercel Edge Functions (api/) don't run — intercept /api/* so
// Vite never tries to serve the .ts files as browser modules (causes esbuild loader errors).
function apiDevStubPlugin(): Plugin {
  return {
    name: 'api-dev-stub',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'API routes only available via `vercel dev`' }));
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    apiDevStubPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Trajectory — Portfolio Intelligence',
        short_name: 'Trajectory',
        description: 'Platform investasi cerdas untuk investor retail Indonesia',
        theme_color: '#0f1117',
        background_color: '#0f1117',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache app shell + static assets; skip Firestore/API calls
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Vercel Edge API — network-first, fall back to cache
            urlPattern: /^https:\/\/trajectory-assets\.vercel\.app\/api\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
