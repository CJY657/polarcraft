import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cpSync, readdirSync } from 'node:fs';
import { resolve } from 'path';

function copyPublicAssetsWithoutUploads() {
  const publicDir = resolve(__dirname, 'public');
  const outputDir = resolve(__dirname, 'dist');

  return {
    name: 'copy-public-assets-without-uploads',
    apply: 'build' as const,
    closeBundle() {
      for (const entry of readdirSync(publicDir, { withFileTypes: true })) {
        if (entry.name === 'uploads') {
          continue;
        }

        cpSync(
          resolve(publicDir, entry.name),
          resolve(outputDir, entry.name),
          { recursive: entry.isDirectory() }
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyPublicAssetsWithoutUploads()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    copyPublicDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Animation library
          'vendor-motion': ['framer-motion'],
          // State management and i18n
          'vendor-utils': ['zustand', 'i18next', 'react-i18next'],
        },
      },
    },
  },
});
