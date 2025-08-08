import type { Tool } from './Tool.js';
import type { ExecutionContext } from '../orchestrator/ExecutionContext.js';

/** Shell tool placeholder */
export class ShellTool implements Tool {
  id = 'shell';
  async call(_input: unknown, _ctx: ExecutionContext): Promise<unknown> {
    return null;
  }
}
