/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // No `globals: true` on purpose: test files import `describe`/`it`/
    // `expect` explicitly from 'vitest', so tsconfig.app.json (which also
    // governs `npm run build`) never needs Vitest's ambient types added to
    // the production compile.
    css: false,
  },
})
