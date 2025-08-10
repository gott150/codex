import type { StreamEvent } from '../../core/llm/Streaming.js';

/** Simple terminal stream renderer */
export function streamRenderer(opts: { verbose?: boolean } = {}) {
  return (e: StreamEvent) => {
    if (e.type === 'token') {
      process.stdout.write(e.value);
    } else if (opts.verbose) {
      process.stderr.write(`\n[${e.type}] ${JSON.stringify(e)}\n`);
    }
    if (e.type === 'end') process.stdout.write('\n');
  };
}
