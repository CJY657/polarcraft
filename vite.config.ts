import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 3D rendering (Three.js ecosystem - largest chunk)
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          // Animation library
          'vendor-motion': ['framer-motion'],
          // State management and i18n
          'vendor-utils': ['zustand', 'i18next', 'react-i18next'],
        },
      },
    },
  },
});
