import type { Agent } from '../Agent.js';
import type { ExecutionContext } from '../../orchestrator/ExecutionContext.js';

/** Planner agent uses provider to echo input */
export class PlannerAgent implements Agent {
  id = 'planner';
  async run(input: unknown, ctx: ExecutionContext): Promise<unknown> {
    return ctx.provider.generate(`plan:${String(input)}`);
  }
}
