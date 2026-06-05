/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set this to your GitHub repo name, e.g. '/diary-qual-tool/'
// Leave as '/' if deploying to a custom domain or a user/org root page
const base = process.env.GITHUB_PAGES_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx'],
    },
  },
});
