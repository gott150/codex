import type { Agent } from '../Agent.js';
import type { ExecutionContext } from '../../orchestrator/ExecutionContext.js';

/** Coder agent placeholder */
export class CoderAgent implements Agent {
  id = 'coder';
  role = 'coder';
  model = 'openai';
  tools: string[] = [];

  async run(input: unknown, ctx: ExecutionContext): Promise<unknown> {
    const prompt = `code:${String(input)}`;
    let out = '';
    for await (const ev of ctx.provider.stream(prompt)) {
      ctx.emit?.(ev);
      if (ev.type === 'token') out += ev.value;
    }
    ctx.state.changedFilesCount = 1;
    return out;
  }
}
