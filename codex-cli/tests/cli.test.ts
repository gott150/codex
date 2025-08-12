import { describe, expect, test } from 'vitest';
import { buildCli } from '../bin/codex.js';

describe('cli', () => {
  test('builds parser', () => {
    const parser = buildCli();
    expect(typeof (parser as any).parse).toBe('function');
  });
});
