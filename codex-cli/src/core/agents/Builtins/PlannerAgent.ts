import type { Agent } from '../Agent.js';
import type { ExecutionContext } from '../../orchestrator/ExecutionContext.js';

/** Planner agent uses provider to echo input */
export class PlannerAgent implements Agent {
  id = 'planner';
  role = 'planner';
  model = 'openai';
  tools: string[] = [];

  async run(input: unknown, ctx: ExecutionContext): Promise<unknown> {
    const prompt = `plan:${String(input)}`;
    let out = '';
    for await (const ev of ctx.provider.stream(prompt)) {
      ctx.emit?.(ev);
      if (ev.type === 'token') out += ev.value;
    }
    ctx.state.hasPlan = true;
    return out;
  }
}
