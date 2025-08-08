import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'bin/**/*',
        'src/cli/commands/index.ts',
        'src/loaders/FlowLoader.ts',
        'src/schema/flow.schema.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 0,
        statements: 80,
      },
    },
  },
});
