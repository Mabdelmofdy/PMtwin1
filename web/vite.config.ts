import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pm-twin/commands': path.resolve(__dirname, '../packages/commands/src/index.ts'),
      '@pm-twin/lifecycle': path.resolve(__dirname, '../packages/lifecycle/src/index.js'),
      '@pm-twin/matching': path.resolve(__dirname, '../packages/matching/dist/index.js'),
      '@pm-twin/collaboration-models': path.resolve(__dirname, '../packages/collaboration-models/dist/index.js'),
      '@pm-twin/workflows': path.resolve(__dirname, '../packages/workflows/dist/index.js'),
      // Phase 10.2 — neutral seed alias; physical root remains POC/data until extraction.
      '@seed-data': path.resolve(__dirname, '../POC/data'),
    },
  },
})
