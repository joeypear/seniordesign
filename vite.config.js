import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [
    react(),
    {
      // Serve ORT Web worker .mjs files directly from node_modules in dev mode.
      // Vite refuses to serve .mjs files from /public as ES modules, so we
      // intercept these requests before Vite's own middleware can reject them.
      name: 'ort-wasm-middleware',
      configureServer(server) {
        const ortDist = path.resolve('./node_modules/onnxruntime-web/dist');
        server.middlewares.use((req, res, next) => {
          const url = (req.url || '').split('?')[0];
          if (/^\/ort-wasm-simd-threaded.*\.mjs$/.test(url)) {
            const file = path.join(ortDist, path.basename(url));
            if (fs.existsSync(file)) {
              res.setHeader('Content-Type', 'application/javascript');
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(file).pipe(res);
              return;
            }
          }
          next();
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ['onnxruntime-web', 'onnxruntime-web/wasm'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
