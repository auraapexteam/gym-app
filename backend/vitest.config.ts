import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    env: {
      // The entire supabase module is mocked in tests; these dummy values
      // exist only to satisfy the env-schema validation on startup.
      SUPABASE_ANON_KEY: 'test-anon-key-placeholder',
      SUPABASE_URL: 'https://test-project.example.invalid',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key-placeholder',
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
