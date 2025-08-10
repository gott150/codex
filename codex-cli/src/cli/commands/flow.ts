import type { CommandModule } from 'yargs';
import { flowRunSubcommand } from './flow-run.js';
import { flowGraphSubcommand } from './flow-graph.js';

export const flowCommand: CommandModule = {
  command: 'flow <command>',
  describe: 'Flow utilities',
  builder: (y) => y.command(flowRunSubcommand).command(flowGraphSubcommand),
  handler: () => {},
};
