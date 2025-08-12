import { describe, expect, test } from 'vitest';
import path from 'node:path';
import { loadFlow } from '../src/loaders/FlowLoader.js';
import { flowSchema } from '../src/schema/flow.schema.js';

const example = path.resolve(__dirname, '../flows/examples/code-assistant.flow.yaml');

describe('FlowLoader', () => {
  test('loads example flow', async () => {
    const flow = await loadFlow(example);
    expect(flow.name).toBe('code-assistant');
  });

  test('invalid flow fails', () => {
    expect(() => flowSchema.parse({})).toThrow();
  });
});
