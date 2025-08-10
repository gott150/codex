import type { LlmProvider } from './LlmProvider.js';
import { streamFromString } from './Streaming.js';

/** OpenAI provider placeholder */
export class OpenAIProvider implements LlmProvider {
  constructor(private model = 'gpt-4o-mini') {}

  async generate(prompt: string): Promise<string> {
    let out = '';
    for await (const ev of this.stream(prompt)) {
      if (ev.type === 'token') out += ev.value;
    }
    return out.trim();
  }

  async *stream(prompt: string) {
    yield* streamFromString(`openai:${prompt}`);
  }
}
