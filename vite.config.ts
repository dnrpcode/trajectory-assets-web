import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

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
  plugins: [react(), apiDevStubPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
