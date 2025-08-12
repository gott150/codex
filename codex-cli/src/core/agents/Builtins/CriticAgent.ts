import type { Agent } from '../Agent.js';
import type { ExecutionContext } from '../../orchestrator/ExecutionContext.js';

/** Critic agent reviews changes */
export class CriticAgent implements Agent {
  id = 'critic';
  role = 'critic';
  model = 'openai';
  tools: string[] = [];

  async run(_input: unknown, ctx: ExecutionContext): Promise<unknown> {
    const ok = (ctx.state.changedFilesCount ?? 0) > 0;
    ctx.state.review = ok ? { ok: true } : { ok: false, rework: ['no changes'] };
    const ev = { type: 'review', review: ctx.state.review };
    ctx.trace.push(ev);
    ctx.emit?.(ev as any);
    return ctx.state.review;
  }
}
