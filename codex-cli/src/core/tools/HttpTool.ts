import { z } from 'zod';
import type { Tool } from './Tool.js';
import type { ExecutionContext } from '../orchestrator/ExecutionContext.js';

const inputSchema = z.object({ url: z.string() });

/** HTTP GET tool */
export class HttpTool implements Tool {
  id = 'http';
  schema = inputSchema;
  async call(input: unknown, _ctx: ExecutionContext): Promise<unknown> {
    const { url } = this.schema.parse(input);
    const res = await fetch(url);
    return await res.text();
  }
}
