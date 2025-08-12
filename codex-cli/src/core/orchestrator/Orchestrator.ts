import { Parser } from 'expr-eval';
import { InMemoryStore } from '../memory/InMemoryStore.js';
import { AgentRegistry } from '../agents/AgentRegistry.js';
import { PlannerAgent } from '../agents/Builtins/PlannerAgent.js';
import { CoderAgent } from '../agents/Builtins/CoderAgent.js';
import { CriticAgent } from '../agents/Builtins/CriticAgent.js';
import type { ExecutionContext, TraceEvent } from './ExecutionContext.js';
import type { FlowConfig } from '../../schema/flow.schema.js';
import { Router } from './Router.js';
import { ToolRegistry } from '../tools/ToolRegistry.js';
import { ShellTool } from '../tools/ShellTool.js';
import { HttpTool } from '../tools/HttpTool.js';
import { FsTool } from '../tools/FsTool.js';

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
    private workspace: string,
    ctx?: ExecutionContext
  ) {
    const tools = new ToolRegistry();
    for (const t of flow.tools) {
      if (t.type === 'builtin.shell') {
        tools.register(new ShellTool((t as any).allow));
      } else if (t.type === 'builtin.http') {
        tools.register(new HttpTool());
      } else if (t.type === 'builtin.fs') {
        tools.register(new FsTool(workspace));
      }
    }
    this.ctx =
      ctx ?? {
        provider: router.getProvider(flow.providers.default, flow.providers),
        state: {},
        trace: [],
        config,
        memory: new InMemoryStore(),
        tools,
        workspace,
      };
  }

  static fromFlow(
    flow: FlowConfig,
    config: Record<string, unknown>,
    workspace: string,
    router: Router = new Router()
  ): Orchestrator {
    const registry = new AgentRegistry();
    registry.register(new PlannerAgent());
    registry.register(new CoderAgent());
    registry.register(new CriticAgent());
    return new Orchestrator(flow, router, registry, config, workspace);
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
    const MAX_STEPS = 3;
    while (current !== 'END' && steps < MAX_STEPS) {
      steps++;
      const agent = this.registry.get(current);
      if (!agent) throw new Error(`Unknown agent ${current}`);
      const agentCfg = this.flow.agents.find((a) => a.id === current);
      this.ctx.provider = this.router.getProvider(
        agentCfg?.model ?? this.flow.providers.default,
        this.flow.providers
      );
      const output = await agent.run(value, this.ctx);
      this.ctx.trace.push({ type: 'agent', agent: current, input: value, output });
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
    const endEv = { type: 'end', result: value };
    this.ctx.trace.push(endEv);
    this.ctx.emit?.(endEv as any);
    return { result: value, trace: this.ctx.trace };
  }
}
