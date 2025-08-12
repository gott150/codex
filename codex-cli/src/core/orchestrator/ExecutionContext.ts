import type { LlmProvider } from '../llm/LlmProvider.js';

/** Execution context passed to agents and tools */
export interface ExecutionContext {
  provider: LlmProvider;
}
