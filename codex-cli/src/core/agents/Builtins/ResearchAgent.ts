import type { Agent } from '../Agent.js';
import type { ExecutionContext } from '../../orchestrator/ExecutionContext.js';

/** Research agent placeholder */
export class ResearchAgent implements Agent {
  id = 'research';
  async run(input: unknown, _ctx: ExecutionContext): Promise<unknown> {
    return input;
  }
}
