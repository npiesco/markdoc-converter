import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    globals: true,
    include: ['api/**/*.test.ts', 'mcp-server/**/*.test.ts'],
  },
});
