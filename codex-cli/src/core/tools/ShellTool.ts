import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import type { Tool } from './Tool.js';
import type { ExecutionContext } from '../orchestrator/ExecutionContext.js';

const exec = promisify(execCb);
const TEN_SECONDS = 10_000;
const SIXTY_FOUR_KB = 64 * 1024;

const inputSchema = z.object({ cmd: z.string() });

/** Shell tool with whitelist */
export class ShellTool implements Tool {
  id = 'shell';
  schema = inputSchema;
  constructor(
    private allow: string[] = ['echo', 'node', 'cat'],
    private timeoutMs = TEN_SECONDS,
    private maxBuffer = SIXTY_FOUR_KB,
  ) {}

  async call(input: unknown, ctx: ExecutionContext): Promise<unknown> {
    const { cmd } = this.schema.parse(input);
    const [bin] = cmd.split(' ');
    if (!this.allow.includes(bin)) {
      throw new Error(`Command "${bin}" not allowed`);
    }
    try {
      const { stdout, stderr } = await exec(cmd, {
        cwd: ctx.workspace,
        timeout: this.timeoutMs,
        maxBuffer: this.maxBuffer,
      });
      const result = { stdout: stdout.trim(), stderr: stderr.trim(), code: 0 };
      const ev = { type: 'shell', cmd, result };
      ctx.trace.push(ev);
      ctx.emit?.(ev as any);
      return result;
    } catch (err: any) {
      if (err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
        throw new Error(`Command "${bin}" exceeded output limit`);
      }
      if (err.killed || err.signal) {
        throw new Error(`Command "${bin}" timed out`);
      }
      const result = {
        stdout: err.stdout?.toString().trim() ?? '',
        stderr: err.stderr?.toString().trim() ?? '',
        code: typeof err.code === 'number' ? err.code : 1,
      };
      const ev = { type: 'shell', cmd, result };
      ctx.trace.push(ev);
      ctx.emit?.(ev as any);
      return result;
    }
  }
}
