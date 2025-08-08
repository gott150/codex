import { GeminiProvider } from '../llm/GeminiProvider.js';
import { OpenAIProvider } from '../llm/OpenAIProvider.js';
import type { LlmProvider } from '../llm/LlmProvider.js';

/** Minimal provider router */
export class Router {
  getProvider(name: string): LlmProvider {
    switch (name) {
      case 'openai':
        return new OpenAIProvider();
      case 'gemini':
      default:
        return new GeminiProvider();
    }
  }
}
