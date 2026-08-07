import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://radio.yologaza.com',
        changeOrigin: true,
        // Dev-only: the VPS cert chain isn't trusted by Node's default CA
        // store from this machine. Safe to relax here since this proxy is
        // never used in production (see README).
        secure: false,
      },
      '/stream.mp3': {
        target: 'https://radio.yologaza.com',
        changeOrigin: true,
        secure: false,
      },
      '/feeds': {
        target: 'https://radio.yologaza.com',
        changeOrigin: true,
        secure: false,
      },
      // New FastAPI backend (Phase 2), run locally via `uvicorn` on 8001.
      // Same-origin via this proxy in dev, same as the /app-api nginx
      // prefix planned for production — avoids CORS entirely.
      '/app-api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})
