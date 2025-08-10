import type { CommandModule } from 'yargs';

export const toolAddCommand: CommandModule = {
  command: 'tool add <name>',
  describe: 'Add a tool',
  builder: (cmd: any) => cmd.positional('name', { type: 'string' }),
  handler: (args: any) => {
    console.log(`tool add not implemented for ${args.name}`);
  },
};
