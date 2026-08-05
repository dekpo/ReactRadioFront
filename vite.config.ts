import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'https://radio.yologaza.com',
      '/stream.mp3': 'https://radio.yologaza.com',
      '/feeds': 'https://radio.yologaza.com',
    },
  },
})
