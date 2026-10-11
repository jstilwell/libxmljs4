import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./test/setup.js'],
    pool: 'forks',
    execArgv: ['--expose_gc'],
    // .claude/ holds temporary git worktrees with their own copies of test/.
    exclude: ['**/node_modules/**', '.claude/**'],
  },
});
