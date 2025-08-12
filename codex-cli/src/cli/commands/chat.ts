import type { CommandModule } from 'yargs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { promises as fs } from 'node:fs';
import { loadFlow } from '../../loaders/FlowLoader.js';
import { loadConfig } from '../../loaders/ConfigLoader.js';
import { Orchestrator } from '../../core/orchestrator/Orchestrator.js';
import { streamRenderer } from '../ui/streamRenderer.js';
import { resolveDefaultFlow } from '../utils/resolve-default-flow.js';

export const chatCommand: CommandModule = {
  command: 'chat [file]',
  aliases: ['$0'],
  describe: 'Interactive chat REPL',
  builder: (y) =>
    y
      .positional('file', { type: 'string', describe: 'Flow YAML file' })
      .option('profile', { type: 'string', default: 'local' })
      .option('input', { alias: 'i', type: 'string', describe: 'Initial input' })
      .option('trace', { type: 'string', describe: 'Write trace to file on exit' })
      .option('verbose', { type: 'boolean', default: false })
      .option('config-root', { type: 'string', describe: 'Explicit config root' }),
  handler: async (args: any) => {
    let file = args.file as string | undefined;
    if (!file) file = await resolveDefaultFlow();
    let profile = args.profile as string;
    let flow = await loadFlow(file);
    let config = await loadConfig({ profile, flowFile: file, configRoot: args['config-root'] });
    let orchestrator = Orchestrator.fromFlow(flow, config);

    const run = async (prompt: string) => {
      await orchestrator.run(prompt, { onEvent: streamRenderer() });
    };

    if (args.input) await run(args.input);

    const rl = readline.createInterface({ input, output, prompt: 'queen> ' });
    rl.prompt();
    for await (const line of rl) {
      if (line === '/exit') {
        break;
      }
      if (line === '/reset') {
        orchestrator.reset();
        rl.prompt();
        continue;
      }
      if (line.startsWith('/save ')) {
        const p = line.split(' ')[1];
        await fs.writeFile(p, JSON.stringify(orchestrator.getTrace(), null, 2));
        console.log(`Trace saved to ${p}`);
        rl.prompt();
        continue;
      }
      if (line.startsWith('/profile ')) {
        profile = line.split(' ')[1] ?? profile;
        config = await loadConfig({ profile, flowFile: file, configRoot: args['config-root'] });
        orchestrator = Orchestrator.fromFlow(flow, config);
        rl.prompt();
        continue;
      }
      if (line.startsWith('/load ')) {
        file = line.split(' ')[1] ?? file;
        flow = await loadFlow(file);
        config = await loadConfig({ profile, flowFile: file, configRoot: args['config-root'] });
        orchestrator = Orchestrator.fromFlow(flow, config);
        rl.prompt();
        continue;
      }
      await run(line);
      rl.prompt();
    }
    rl.close();
    if (args.trace) {
      await fs.writeFile(args.trace, JSON.stringify(orchestrator.getTrace(), null, 2));
    }
  },
};
