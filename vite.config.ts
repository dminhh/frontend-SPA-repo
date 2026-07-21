import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves this repo under /frontend-SPA-repo/, so production asset
// URLs need that prefix there or they 404 and the page renders blank. Vercel
// serves the app from its domain root, so it needs base '/' instead — Vercel
// sets the VERCEL env var automatically during its build, no config needed.
// Dev keeps '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' && !process.env.VERCEL ? '/frontend-SPA-repo/' : '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
