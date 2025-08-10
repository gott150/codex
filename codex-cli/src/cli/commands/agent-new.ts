import type { CommandModule } from 'yargs';

export const agentNewCommand: CommandModule = {
  command: 'agent new <id>',
  describe: 'Scaffold a new agent',
  builder: (cmd: any) => cmd.positional('id', { type: 'string' }),
  handler: (args: any) => {
    console.log(`agent new not implemented for ${args.id}`);
  },
};
