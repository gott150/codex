import { describe, expect, test } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { loadFlow } from '../../src/loaders/FlowLoader.js';
import { Orchestrator } from '../../src/core/orchestrator/Orchestrator.js';
import { Router } from '../../src/core/orchestrator/Router.js';
import type { LlmProvider } from '../../src/core/llm/LlmProvider.js';
import { streamFromString } from '../../src/core/llm/Streaming.js';
import { ShellTool } from '../../src/core/tools/ShellTool.js';

class MockProvider implements LlmProvider {
  async generate(prompt: string): Promise<string> {
    let out = '';
    for await (const ev of this.stream(prompt)) {
      if (ev.type === 'token') out += ev.value;
    }
    return out.trim();
  }
  async *stream(prompt: string) {
    yield* streamFromString(`mock:${prompt}`);
  }
}

class MockRouter extends Router {
  getProvider() {
    return new MockProvider();
  }
}

describe('e2e flow run', () => {
  test('planner -> coder -> critic -> END', async () => {
    const flowPath = path.resolve(__dirname, '../../flows/examples/code-assistant.flow.yaml');
    const flow = await loadFlow(flowPath);
    const orch = Orchestrator.fromFlow(flow, {}, process.cwd(), new MockRouter());
    const { trace } = await orch.run('Hello');
    expect(trace.filter((t) => t.type === 'agent').map((t) => t.agent)).toEqual([
      'planner',
      'coder',
      'critic',
    ]);
  });

  test('shell tool whitelist', async () => {
    const shell = new ShellTool(['echo']);
    const ctx: any = { workspace: process.cwd(), trace: [], state: {}, config: {}, memory: {}};
    await expect(shell.call({ cmd: 'echo hi' }, ctx)).resolves.toMatchObject({ stdout: 'hi' });
    await expect(shell.call({ cmd: 'ls' }, ctx)).rejects.toThrow('not allowed');
  });

  test('invalid flow yields zod error', async () => {
    const bad = path.join(__dirname, 'bad.flow.yaml');
    await fs.writeFile(bad, 'version: 1');
    await expect(loadFlow(bad)).rejects.toThrow('Flow validation failed');
    await fs.unlink(bad);
  });
});
