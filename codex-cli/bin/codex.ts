#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { registerCommands } from '../src/cli/commands/index.js';

export function buildCli() {
  const cli = yargs(hideBin(process.argv)).scriptName('codex').help();
  registerCommands(cli);
  return cli;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildCli().demandCommand().parse();
}
