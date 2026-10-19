import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // While developing, any request to /api or /uploads is passed on to our
    // Express server. This means the React code can just call "/api/products"
    // without worrying about ports or CORS.
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
})
