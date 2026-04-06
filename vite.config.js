import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [
    react(),
  ],
  optimizeDeps: {
    // onnxruntime-web uses dynamic imports for its worker files; excluding it
    // from pre-bundling prevents Vite from intercepting those imports.
    exclude: ['onnxruntime-web'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
