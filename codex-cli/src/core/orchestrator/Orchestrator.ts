import type { FlowConfig } from '../../schema/flow.schema.js';
import { AgentRegistry } from '../agents/AgentRegistry.js';
import { PlannerAgent } from '../agents/Builtins/PlannerAgent.js';
import { CoderAgent } from '../agents/Builtins/CoderAgent.js';
import { CriticAgent } from '../agents/Builtins/CriticAgent.js';
import type { ExecutionContext } from './ExecutionContext.js';
import { Router } from './Router.js';

/** Simple orchestrator running agents sequentially */
export class Orchestrator {
  constructor(
    private flow: FlowConfig,
    private router: Router,
    private registry: AgentRegistry
  ) {}

  static fromFlow(flow: FlowConfig): Orchestrator {
    const router = new Router();
    const registry = new AgentRegistry();
    registry.register(new PlannerAgent());
    registry.register(new CoderAgent());
    registry.register(new CriticAgent());
    return new Orchestrator(flow, router, registry);
  }

  async run(input: string): Promise<unknown> {
    let current = this.flow.flow.entry;
    let result: unknown = input;
    const ctx: ExecutionContext = {
      provider: this.router.getProvider(this.flow.providers.default),
    };
    const visited = new Set<string>();
    while (current !== 'END' && !visited.has(current)) {
      visited.add(current);
      const agent = this.registry.get(current);
      if (!agent) throw new Error(`Unknown agent ${current}`);
      const agentConfig = this.flow.agents.find((a) => a.id === current);
      ctx.provider = this.router.getProvider(agentConfig?.model ?? this.flow.providers.default);
      result = await agent.run(result, ctx);
      const edge = this.flow.flow.edges.find((e) => e.from === current);
      if (!edge) break;
      current = edge.to;
    }
    return result;
  }
}
