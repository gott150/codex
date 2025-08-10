import { describe, expect, it } from 'vitest';
import { ShellTool } from '../src/core/tools/ShellTool.js';

// Minimal ExecutionContext stub
const ctx = {} as any;

describe('ShellTool security', () => {
  it('rejects commands outside allow list', async () => {
    const tool = new ShellTool(['echo']);
    await expect(tool.call({ cmd: 'ls' }, ctx)).rejects.toThrow('not allowed');
  });
});
