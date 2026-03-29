import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/pvpoke": {
        target: "https://pvpoketw.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pvpoke/, ""),
      },
    },
  },
})
