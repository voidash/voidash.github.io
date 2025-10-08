import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  server: {
    cors: false,
  },
  build: {
    outDir: 'dist'
  },
  plugins: [react()],
})
