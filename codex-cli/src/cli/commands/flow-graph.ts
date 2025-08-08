import type { CommandModule } from 'yargs';

export const flowGraphSubcommand: CommandModule = {
  command: 'graph <file>',
  describe: 'Render a flow graph',
  builder: (cmd: any) => cmd.positional('file', { type: 'string' }),
  handler: (args: any) => {
    console.log(`flow graph not implemented for ${args.file}`);
  },
};
