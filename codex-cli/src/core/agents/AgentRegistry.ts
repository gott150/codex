import type { Agent } from './Agent.js';

/** Simple agent registry placeholder */
export class AgentRegistry {
  private agents = new Map<string, Agent>();

  register(agent: Agent) {
    this.agents.set(agent.id, agent);
  }

  get(id: string): Agent | undefined {
    return this.agents.get(id);
  }
}
