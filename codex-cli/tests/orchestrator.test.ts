import { describe, expect, test } from 'vitest';
import path from 'node:path';
import { loadFlow } from '../src/loaders/FlowLoader.js';
import { Orchestrator } from '../src/core/orchestrator/Orchestrator.js';

describe('Orchestrator', () => {
  test('runs simple flow', async () => {
    const flow = await loadFlow(path.resolve(__dirname, '../flows/examples/code-assistant.flow.yaml'));
    const orchestrator = Orchestrator.fromFlow(flow);
    const result = await orchestrator.run('Hello');
    expect(typeof result).toBe('string');
  });
});
