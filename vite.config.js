import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // onnxruntime-web ships its own pre-built bundles + WASM; exclude it from
  // Vite's dep-optimizer so it's loaded as-is (avoids bundle corruption).
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  // Ensure .wasm files are served with the correct MIME type in dev mode
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
