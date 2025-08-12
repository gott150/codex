import type { Agent } from '../Agent.js';
import type { ExecutionContext } from '../../orchestrator/ExecutionContext.js';

interface PlanItem {
  id: string;
  title: string;
  files?: string[];
  rationale?: string;
}

/** Planner agent creates a simple plan from the input */
export class PlannerAgent implements Agent {
  id = 'planner';
  role = 'planner';
  model = 'openai';
  tools: string[] = [];

  async run(input: unknown, ctx: ExecutionContext): Promise<unknown> {
    const task = String(input);
    const plan: PlanItem[] = [];
    if (/readme/i.test(task)) {
      plan.push({ id: 'readme', title: 'create README.md', files: ['README.md'] });
    }
    if (/init npm/i.test(task) || /initialize npm/i.test(task)) {
      plan.push({ id: 'init-npm', title: 'initialize npm project', files: ['package.json'] });
      plan.push({ id: 'add-build', title: 'add build script', files: ['package.json'] });
    }
    if (plan.length === 0) {
      plan.push({ id: 'task', title: task });
    }
    ctx.state.plan = plan;
    const ev = { type: 'plan', plan };
    ctx.trace.push(ev);
    ctx.emit?.(ev as any);
    return plan;
  }
}
