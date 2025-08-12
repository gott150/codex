import type { CommandModule } from 'yargs';

export const mcpConnectCommand: CommandModule = {
  command: 'mcp connect <name> <url>',
  describe: 'Register an MCP server',
  builder: (cmd: any) =>
    cmd.positional('name', { type: 'string' }).positional('url', { type: 'string' }),
  handler: (args: any) => {
    console.log(`mcp connect not implemented for ${args.name} ${args.url}`);
  },
};
