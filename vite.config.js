/**
 * Purpose: Configure the local Vite dev/build pipeline for the React frontend.
 * Used by: `npm run dev`, `npm run build`, and `npm run preview`.
 * Main dependencies: Vite, React plugin, Node path/url utilities.
 * Public/main functions: default `defineConfig` export for Vite.
 * Important side effects: Resolves `@` imports to `src` and controls dev server startup behavior.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(srcDir),
    },
  },
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
})
