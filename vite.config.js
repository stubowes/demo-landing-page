import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: 'https://demo-landing-page-pink.vercel.app/',
  server: {
    proxy: {
      '/api/webhook': {
        target: 'https://seachangeai.app.n8n.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook/, '/webhook/demo-cta')
      }
    }
  }
})
