import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['node_modules/', 'dist/', 'build/'],
    include: ['tests/**/*.test.ts'],
  },
  esbuild: {
    target: 'esnext',
  },
});
