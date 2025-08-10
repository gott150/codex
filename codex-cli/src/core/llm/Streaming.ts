/** Streaming utilities */
export type StreamEvent =
  | { type: 'token'; value: string }
  | { type: 'end' };

export async function* streamFromString(text: string): AsyncIterable<StreamEvent> {
  for (const ch of text.split(' ')) {
    yield { type: 'token', value: ch + ' ' };
  }
  yield { type: 'end' };
}
