import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true,
    watch: {
      usePolling: true // สำหรับ Docker volume mounting
    }
  },
  build: {
    outDir: 'dist'
  }
})
