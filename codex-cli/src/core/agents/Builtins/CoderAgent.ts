import type { Agent } from '../Agent.js';
import type { ExecutionContext } from '../../orchestrator/ExecutionContext.js';

/** Coder agent placeholder */
export class CoderAgent implements Agent {
  id = 'coder';
  async run(input: unknown, ctx: ExecutionContext): Promise<unknown> {
    return ctx.provider.generate(`code:${String(input)}`);
  }
}
