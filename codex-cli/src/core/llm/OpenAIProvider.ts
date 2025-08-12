import type { LlmProvider } from './LlmProvider.js';

/** OpenAI provider placeholder */
export class OpenAIProvider implements LlmProvider {
  async generate(prompt: string): Promise<string> {
    return `openai: ${prompt}`;
  }
}
