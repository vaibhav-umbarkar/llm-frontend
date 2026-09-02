import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // Vitest configuration
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    globals: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
    },
  },

  server: {
    port: 3000,
    open: true,

    proxy: {
      '/api': {
        target: 'http://localhost:11434',
        changeOrigin: true,
      },
      '/chats-api': {
        target: 'http://localhost:3080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chats-api/, ''),
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,

    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor'
            }

            if (id.includes('@tanstack') || id.includes('zustand')) {
              return 'state'
            }

            if (
              id.includes('react-dropzone') ||
              id.includes('react-markdown')
            ) {
              return 'ui'
            }
          }
        },
      },
    },
  },
})