import { Parser } from 'expr-eval';
import { InMemoryStore } from '../memory/InMemoryStore.js';
import { AgentRegistry } from '../agents/AgentRegistry.js';
import { PlannerAgent } from '../agents/Builtins/PlannerAgent.js';
import { CoderAgent } from '../agents/Builtins/CoderAgent.js';
import { CriticAgent } from '../agents/Builtins/CriticAgent.js';
import type { ExecutionContext, TraceEvent } from './ExecutionContext.js';
import type { FlowConfig } from '../../schema/flow.schema.js';
import { Router } from './Router.js';

export interface RunOptions {
  onEvent?: (e: any) => void;
}

/** Flow orchestrator */
export class Orchestrator {
  private ctx: ExecutionContext;

  constructor(
    private flow: FlowConfig,
    private router: Router,
    private registry: AgentRegistry,
    private config: Record<string, unknown>,
    ctx?: ExecutionContext
  ) {
    this.ctx =
      ctx ?? {
        provider: router.getProvider(flow.providers.default, flow.providers),
        state: {},
        trace: [],
        config,
        memory: new InMemoryStore(),
      };
  }

  static fromFlow(
    flow: FlowConfig,
    config: Record<string, unknown>,
    router: Router = new Router()
  ): Orchestrator {
    const registry = new AgentRegistry();
    registry.register(new PlannerAgent());
    registry.register(new CoderAgent());
    registry.register(new CriticAgent());
    return new Orchestrator(flow, router, registry, config);
  }

  reset() {
    this.ctx.state = {};
    this.ctx.trace = [];
    this.ctx.memory = new InMemoryStore();
  }

  getTrace(): TraceEvent[] {
    return this.ctx.trace;
  }

  async run(
    input: unknown,
    opts: RunOptions = {}
  ): Promise<{ result: unknown; trace: TraceEvent[] }> {
    let current = this.flow.flow.entry;
    let value: unknown = input;
    this.ctx.emit = opts.onEvent;
    const parser = new Parser();
    let steps = 0;
    while (current !== 'END' && steps < 100) {
      steps++;
      const agent = this.registry.get(current);
      if (!agent) throw new Error(`Unknown agent ${current}`);
      const agentCfg = this.flow.agents.find((a) => a.id === current);
      this.ctx.provider = this.router.getProvider(
        agentCfg?.model ?? this.flow.providers.default,
        this.flow.providers
      );
      const output = await agent.run(value, this.ctx);
      this.ctx.trace.push({ agent: current, input: value, output });
      value = output;
      const edges = this.flow.flow.edges.filter((e) => e.from === current);
      let next = 'END';
      for (const edge of edges) {
        if (!edge.when) {
          next = edge.to;
          break;
        }
        let pass = false;
        try {
          pass = !!parser.evaluate(edge.when, this.ctx.state);
        } catch {
          pass = false;
        }
        if (pass) {
          next = edge.to;
          break;
        }
      }
      current = next;
    }
    return { result: value, trace: this.ctx.trace };
  }
}
