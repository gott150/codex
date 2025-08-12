import type { Tool } from './Tool.js';
import type { ExecutionContext } from '../orchestrator/ExecutionContext.js';

/** HTTP tool placeholder */
export class HttpTool implements Tool {
  id = 'http';
  async call(_input: unknown, _ctx: ExecutionContext): Promise<unknown> {
    return null;
  }
}
