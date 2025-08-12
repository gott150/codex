import type { Agent } from '../Agent.js';
import type { ExecutionContext } from '../../orchestrator/ExecutionContext.js';
import { FsTool } from '../../tools/FsTool.js';
import { ShellTool } from '../../tools/ShellTool.js';

/** Coder agent applies plan steps using fs and shell tools */
export class CoderAgent implements Agent {
  id = 'coder';
  role = 'coder';
  model = 'openai';
  tools: string[] = [];

  async run(_input: unknown, ctx: ExecutionContext): Promise<unknown> {
    const fs = ctx.tools.get('fs') as FsTool | undefined;
    const shell = ctx.tools.get('shell') as ShellTool | undefined;
    let changed = 0;
    for (const step of ctx.state.plan ?? []) {
      if (step.id === 'readme' && fs) {
        const content = '# Hello from Queen\n';
        await fs.writeFile('README.md', content, ctx);
        changed++;
      }
      if (step.id === 'init-npm' && shell) {
        await shell.call({ cmd: 'npm init -y' }, ctx);
      }
      if (step.id === 'add-build' && shell) {
        await shell.call({ cmd: 'npm pkg set scripts.build="tsc"' }, ctx);
      }
    }
    ctx.state.changedFilesCount = changed;
    return { changed };
  }
}
