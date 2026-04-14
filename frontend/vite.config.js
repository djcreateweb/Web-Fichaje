import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_NAME__: JSON.stringify('Presentia'),
  },
  build: {
    sourcemap: false,
  },
  // host: true evita que "localhost" resuelva a IPv6 (::1) sin listener en Windows
  server: {
    host: true,
    port: 5174,
    strictPort: false,
  },
})
