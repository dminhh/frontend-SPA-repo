import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves this repo under /frontend-SPA-repo/, so production asset
// URLs need that prefix or they 404 and the page renders blank. Dev keeps '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/frontend-SPA-repo/' : '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
