import type { CommandModule } from 'yargs';
import { loadFlow } from '../../loaders/FlowLoader.js';

export const flowGraphSubcommand: CommandModule = {
  command: 'graph <file>',
  describe: 'Render a flow graph',
  builder: (cmd: any) => cmd.positional('file', { type: 'string' }),
  handler: async (args: any) => {
    const flow = await loadFlow(args.file);
    console.log('graph TD');
    for (const e of flow.flow.edges) {
      const label = e.when ? `|${e.when}|` : '';
      console.log(`  ${e.from} -->${label} ${e.to}`);
    }
  },
};
