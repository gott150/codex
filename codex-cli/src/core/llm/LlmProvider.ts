import type { StreamEvent } from './Streaming.js';

/** LLM provider placeholder */
export interface LlmProvider {
  generate(prompt: string): Promise<string>;
  stream(prompt: string): AsyncIterable<StreamEvent>;
}
