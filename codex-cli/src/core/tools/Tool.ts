import type { z } from 'zod';
import type { ExecutionContext } from '../orchestrator/ExecutionContext.js';

/** Base tool placeholder */
export interface Tool {
  id: string;
  schema: z.ZodTypeAny;
  call(input: unknown, ctx: ExecutionContext): Promise<unknown>;
}
