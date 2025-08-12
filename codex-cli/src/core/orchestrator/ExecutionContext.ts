import type { LlmProvider } from '../llm/LlmProvider.js';
import type { Memory } from '../memory/Memory.js';
import type { StreamEvent } from '../llm/Streaming.js';
import type { ToolRegistry } from '../tools/ToolRegistry.js';

export interface TraceEvent {
  type: string;
  [key: string]: any;
}

/** Execution context passed to agents and tools */
export interface ExecutionContext {
  provider: LlmProvider;
  state: Record<string, any>;
  trace: TraceEvent[];
  config: Record<string, unknown>;
  memory: Memory;
  tools: ToolRegistry;
  workspace: string;
  emit?: (event: StreamEvent) => void;
}
