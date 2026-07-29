import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      // Proxy /api/* to the Vercel dev server or a local function runner
      // When testing locally with `vercel dev`, this is not needed as Vercel
      // handles the /api routes. If you run `npm run dev` (Vite only),
      // you would need `vercel dev` instead for the API to work.
      // This proxy is left here as a placeholder for any local API server.
    },
  },
})
