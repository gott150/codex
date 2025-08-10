import type { Agent } from '../Agent.js';
import type { ExecutionContext } from '../../orchestrator/ExecutionContext.js';

/** Critic agent placeholder */
export class CriticAgent implements Agent {
  id = 'critic';
  role = 'critic';
  model = 'openai';
  tools: string[] = [];

  async run(input: unknown, ctx: ExecutionContext): Promise<unknown> {
    const prompt = `critique:${String(input)}`;
    let out = '';
    for await (const ev of ctx.provider.stream(prompt)) {
      ctx.emit?.(ev);
      if (ev.type === 'token') out += ev.value;
    }
    ctx.state.review = { ok: true };
    return out;
  }
}
