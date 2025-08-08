import type { CommandModule } from 'yargs';
import { loadFlow } from '../../loaders/FlowLoader.js';
import { loadConfig } from '../../loaders/ConfigLoader.js';
import { Orchestrator } from '../../core/orchestrator/Orchestrator.js';
import { streamRenderer } from '../ui/streamRenderer.js';

export const flowRunSubcommand: CommandModule = {
  command: 'run <file>',
  describe: 'Run a flow definition',
  builder: (cmd: any) =>
    cmd
      .positional('file', { type: 'string', describe: 'Flow YAML file' })
      .option('input', {
        alias: 'i',
        type: 'string',
        describe: 'Initial input',
      })
      .option('profile', {
        type: 'string',
        default: 'local',
        describe: 'Config profile',
      }),
  handler: async (args: any) => {
    const flow = await loadFlow(args.file);
    const config = await loadConfig(args.profile);
    const orchestrator = Orchestrator.fromFlow(flow, config);
    const { result } = await orchestrator.run(args.input ?? '', {
      onEvent: streamRenderer(),
    });
    console.log(result);
  },
};
