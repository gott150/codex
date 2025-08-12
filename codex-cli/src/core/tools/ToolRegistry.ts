import type { Tool } from './Tool.js';

/** Simple tool registry */
export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool) {
    this.tools.set(tool.id, tool);
  }

  get(id: string): Tool | undefined {
    return this.tools.get(id);
  }
}
