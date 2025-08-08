import type { CommandModule } from 'yargs';
import { loadFlow } from '../../loaders/FlowLoader.js';
import { Orchestrator } from '../../core/orchestrator/Orchestrator.js';

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
      }),
  handler: async (args: any) => {
    const flow = await loadFlow(args.file);
    const orchestrator = Orchestrator.fromFlow(flow);
    const result = await orchestrator.run(args.input ?? '');
    console.log(result);
  },
};
