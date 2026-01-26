import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-v23.js`,
        chunkFileNames: 'assets/[name]-[hash]-v20.js',
        assetFileNames: 'assets/[name]-[hash]-v20.[ext]',
      }
    }
  }
})
