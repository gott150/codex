import type { ExecutionContext } from '../orchestrator/ExecutionContext.js';

/** Base tool placeholder */
export interface Tool {
  id: string;
  call(input: unknown, ctx: ExecutionContext): Promise<unknown>;
}
