import type { Agent } from '../Agent.js';
import type { ExecutionContext } from '../../orchestrator/ExecutionContext.js';

/** Critic agent placeholder */
export class CriticAgent implements Agent {
  id = 'critic';
  async run(input: unknown, ctx: ExecutionContext): Promise<unknown> {
    return ctx.provider.generate(`critique:${String(input)}`);
  }
}
