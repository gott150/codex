import type { LlmProvider } from './LlmProvider.js';

/** Gemini provider placeholder */
export class GeminiProvider implements LlmProvider {
  async generate(prompt: string): Promise<string> {
    return `gemini: ${prompt}`;
  }
}
