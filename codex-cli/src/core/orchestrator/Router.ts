import type { FlowConfig } from '../../schema/flow.schema.js';
import { OpenAIProvider } from '../llm/OpenAIProvider.js';
import type { LlmProvider } from '../llm/LlmProvider.js';

/** Provider router with simple fallback */
export class Router {
  getProvider(name: string, providers: FlowConfig['providers']): LlmProvider {
    const conf = providers.map[name] ?? providers.map[providers.default];
    try {
      return new OpenAIProvider(conf.model);
    } catch {
      const fb = providers.map[providers.default];
      return new OpenAIProvider(fb.model);
    }
  }
}
