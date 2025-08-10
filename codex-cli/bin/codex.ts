#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { registerCommands } from '../src/cli/commands/index.js';

export function buildCli() {
  const cli = yargs(hideBin(process.argv)).scriptName('codex-flow').help();
  registerCommands(cli);
  return cli;
}

buildCli().demandCommand().parse();
