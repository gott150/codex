import type { StreamEvent } from '../../core/llm/Streaming.js';

/** Human-readable stream renderer */
export function streamRenderer(verbose = false) {
  return (e: StreamEvent) => {
    if (verbose && e.type !== 'token') {
      console.log(JSON.stringify(e));
      return;
    }
    switch (e.type) {
      case 'plan':
        console.log('PLAN:', JSON.stringify(e.plan));
        break;
      case 'file':
        console.log(e.op === 'patch' ? `PATCH APPLIED: ${e.path}` : `WRITE: ${e.path}`);
        break;
      case 'shell':
        console.log(`SHELL $ ${e.cmd} (code ${e.result.code})`);
        break;
      case 'review':
        console.log(`CRITIC: ${e.review.ok ? 'ok' : 'rework'}`);
        break;
      case 'token':
        process.stdout.write(e.value);
        break;
      case 'end':
        console.log('DONE');
        break;
      default:
        console.log(JSON.stringify(e));
    }
  };
}
