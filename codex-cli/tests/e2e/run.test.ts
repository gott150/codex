import { describe, expect, test } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { loadFlow } from '../../src/loaders/FlowLoader.js';
import { Orchestrator } from '../../src/core/orchestrator/Orchestrator.js';
import { Router } from '../../src/core/orchestrator/Router.js';
import type { LlmProvider } from '../../src/core/llm/LlmProvider.js';
import { streamFromString } from '../../src/core/llm/Streaming.js';

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

describe('run flow actions', () => {
  test('creates README file', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-work-'));
    const flowPath = path.resolve(__dirname, '../../flows/examples/code-assistant.flow.yaml');
    const flow = await loadFlow(flowPath);
    const orch = Orchestrator.fromFlow(flow, {}, tmp, new MockRouter());
    await orch.run("Create a README.md with a 'Hello from Queen' section");
    const content = await fs.readFile(path.join(tmp, 'README.md'), 'utf8');
    expect(content).toContain('Hello from Queen');
    const trace = orch.getTrace();
    expect(trace.some((e) => e.type === 'file' && e.path === 'README.md')).toBe(true);
  });

  test('initializes npm and adds build script', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-work-'));
    const flowPath = path.resolve(__dirname, '../../flows/examples/code-assistant.flow.yaml');
    const flow = await loadFlow(flowPath);
    const orch = Orchestrator.fromFlow(flow, {}, tmp, new MockRouter());
    await orch.run('Initialize npm and add a build script that runs tsc');
    const pkg = JSON.parse(await fs.readFile(path.join(tmp, 'package.json'), 'utf8'));
    expect(pkg.scripts.build).toBe('tsc');
    const trace = orch.getTrace();
    expect(trace.some((e) => e.type === 'shell' && e.cmd.includes('npm init'))).toBe(true);
  });
});

