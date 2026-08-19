import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'src/core/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
