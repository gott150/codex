import type { ExecutionContext } from '../orchestrator/ExecutionContext.js';

/** Base agent placeholder */
export interface Agent {
  id: string;
  run(input: unknown, ctx: ExecutionContext): Promise<unknown>;
}
