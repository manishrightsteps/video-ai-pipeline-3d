import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Allow access through VS Code / Microsoft dev tunnels
    allowedHosts: ['.devtunnels.ms'],
    // Forward API calls to the Express backend (npm run dev in ../)
    proxy: { '/api': 'http://localhost:4000' },
  },
})
