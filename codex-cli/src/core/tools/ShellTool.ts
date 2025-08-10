import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import type { Tool } from './Tool.js';
import type { ExecutionContext } from '../orchestrator/ExecutionContext.js';

const exec = promisify(execCb);

const inputSchema = z.object({ cmd: z.string() });

/** Shell tool with whitelist */
export class ShellTool implements Tool {
  id = 'shell';
  schema = inputSchema;
  constructor(private allow: string[] = ['echo', 'node', 'cat']) {}

  async call(input: unknown, _ctx: ExecutionContext): Promise<unknown> {
    const { cmd } = this.schema.parse(input);
    const [bin] = cmd.split(' ');
    if (!this.allow.includes(bin)) {
      throw new Error(`Command "${bin}" not allowed`);
    }
    const { stdout } = await exec(cmd);
    return stdout.trim();
  }
}
