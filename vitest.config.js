

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,   // disables parallel test files
    isolate: true             // each test file runs in isolation
  }
});