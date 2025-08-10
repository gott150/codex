import type { LlmProvider } from '../llm/LlmProvider.js';
import type { Memory } from '../memory/Memory.js';
import type { StreamEvent } from '../llm/Streaming.js';

export interface TraceEvent {
  agent: string;
  input: unknown;
  output: unknown;
}

/** Execution context passed to agents and tools */
export interface ExecutionContext {
  provider: LlmProvider;
  state: Record<string, any>;
  trace: TraceEvent[];
  config: Record<string, unknown>;
  memory: Memory;
  emit?: (event: StreamEvent) => void;
}
