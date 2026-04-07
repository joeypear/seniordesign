import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Zero-network build: assets, WASM, and the model are all served from
// `public/` which Capacitor bundles into the Android APK under assets/public.
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // SharedArrayBuffer headers so ORT can optionally use threads during dev.
    // Production uses single-threaded WASM so these are not required in the APK.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    target: 'es2020',
    // The ONNX model is large; raise the warning limit so the build is quiet.
    chunkSizeWarningLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          ort: ['onnxruntime-web'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    // onnxruntime-web ships its own wasm loader — let Vite pre-bundle the JS entry.
    include: ['onnxruntime-web'],
  },
});
