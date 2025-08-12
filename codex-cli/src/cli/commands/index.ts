import type yargs from 'yargs';
import { flowCommand } from './flow.js';
import { agentNewCommand } from './agent-new.js';
import { toolAddCommand } from './tool-add.js';
import { mcpConnectCommand } from './mcp-connect.js';
import { chatCommand } from './chat.js';

export function registerCommands(y: yargs.Argv) {
  y.command(chatCommand);
  y.command(flowCommand);
  y.command(agentNewCommand);
  y.command(toolAddCommand);
  y.command(mcpConnectCommand);
}
