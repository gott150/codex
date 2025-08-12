/** Streaming utilities */
export type StreamEvent =
  | { type: 'token'; value: string }
  | { type: 'plan'; plan: unknown }
  | { type: 'file'; op: 'write' | 'patch'; path: string }
  | { type: 'shell'; cmd: string; result: { stdout: string; stderr: string; code: number } }
  | { type: 'review'; review: { ok: boolean; [key: string]: any } }
  | { type: 'end'; result?: unknown };

export async function* streamFromString(text: string): AsyncIterable<StreamEvent> {
  for (const ch of text.split(' ')) {
    yield { type: 'token', value: ch + ' ' };
  }
  yield { type: 'end' };
}
