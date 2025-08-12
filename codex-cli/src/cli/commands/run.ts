import type { CommandModule } from 'yargs';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { resolveFlow } from '../utils/resolve-flow.js';
import { loadFlow } from '../../loaders/FlowLoader.js';
import { loadConfig } from '../../loaders/ConfigLoader.js';
import { Orchestrator } from '../../core/orchestrator/Orchestrator.js';
import { streamRenderer } from '../ui/streamRenderer.js';

export const runCommand: CommandModule = {
  command: 'run',
  describe: 'Run a flow in the current workspace',
  builder: (y) =>
    y
      .option('input', { alias: 'i', type: 'string', describe: 'Initial input' })
      .option('flow', { type: 'string', describe: 'Explicit flow file' })
      .option('profile', { type: 'string', default: 'local' })
      .option('workspace', { type: 'string', describe: 'Workspace directory' })
      .option('trace', { type: 'string', describe: 'Trace output path' })
      .option('verbose', { type: 'boolean', default: false }),
  handler: async (args: any) => {
    const workspace = path.resolve(args.workspace ?? process.cwd());
    const flowPath = await resolveFlow({ workspace, explicitPath: args.flow });
    const flow = await loadFlow(flowPath);
    const config = await loadConfig({
      profile: args.profile,
      flowFile: flowPath,
      workspace,
    });
    const orchestrator = Orchestrator.fromFlow(flow, config, workspace);
    const { trace } = await orchestrator.run(args.input ?? '', {
      onEvent: streamRenderer(args.verbose),
    });
    const tracePath = path.resolve(
      workspace,
      args.trace ?? path.join('.codex', `trace-${Date.now()}.json`)
    );
    await fs.mkdir(path.dirname(tracePath), { recursive: true });
    await fs.writeFile(tracePath, JSON.stringify(trace, null, 2), 'utf8');
  },
};

