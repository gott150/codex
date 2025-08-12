import { promises as fs } from 'node:fs';
import path from 'node:path';
import { applyPatch } from 'diff';
import { z } from 'zod';
import type { Tool } from './Tool.js';
import type { ExecutionContext } from '../orchestrator/ExecutionContext.js';

const inputSchema = z.object({
  action: z.enum(['readFile', 'writeFile', 'applyPatch']),
  path: z.string().optional(),
  content: z.string().optional(),
  diff: z.string().optional(),
});

/** Filesystem tool sandboxed to workspace */
export class FsTool implements Tool {
  id = 'fs';
  schema = inputSchema;
  constructor(private workspace: string) {}

  private resolve(p: string): string {
    const full = path.resolve(this.workspace, p);
    if (!full.startsWith(this.workspace)) {
      throw new Error('Path escapes workspace');
    }
    return full;
  }

  async readFile(rel: string): Promise<string> {
    return fs.readFile(this.resolve(rel), 'utf8');
  }

  async writeFile(rel: string, content: string, ctx?: ExecutionContext): Promise<void> {
    const full = this.resolve(rel);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, 'utf8');
    if (ctx) {
      const ev = { type: 'file', op: 'write', path: rel };
      ctx.trace.push(ev);
      ctx.emit?.(ev as any);
    }
  }

  async applyPatch(diff: string, ctx?: ExecutionContext): Promise<string> {
    const match = diff.match(/\n\+\+\+ b\/(.+)\n/);
    if (!match) throw new Error('Patch missing file path');
    const rel = match[1];
    const full = this.resolve(rel);
    let original = '';
    try {
      original = await fs.readFile(full, 'utf8');
    } catch {
      /* empty */
    }
    const patched = applyPatch(original, diff);
    if (patched === false) throw new Error('Failed to apply patch');
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, patched, 'utf8');
    if (ctx) {
      const ev = { type: 'file', op: 'patch', path: rel };
      ctx.trace.push(ev);
      ctx.emit?.(ev as any);
    }
    return rel;
  }

  async call(input: unknown, _ctx: ExecutionContext): Promise<unknown> {
    const args = this.schema.parse(input);
    if (args.action === 'readFile' && args.path) {
      return this.readFile(args.path);
    }
    if (args.action === 'writeFile' && args.path && args.content !== undefined) {
      await this.writeFile(args.path, args.content);
      return null;
    }
    if (args.action === 'applyPatch' && args.diff) {
      return this.applyPatch(args.diff);
    }
    throw new Error('Invalid fs action');
  }
}

