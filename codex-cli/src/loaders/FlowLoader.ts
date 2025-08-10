import { promises as fs } from 'node:fs';
import yaml from 'yaml';
import { flowSchema, type FlowConfig } from '../schema/flow.schema.js';

export async function loadFlow(path: string): Promise<FlowConfig> {
  try {
    const text = await fs.readFile(path, 'utf8');
    const data = yaml.parse(text);
    return flowSchema.parse(data);
  } catch (err) {
    if (err && typeof err === 'object' && 'issues' in err) {
      const zerr = err as { issues: unknown };
      throw new Error(`Flow validation failed: ${JSON.stringify(zerr.issues)}`);
    }
    throw new Error(`Failed to load flow: ${(err as Error).message}`);
  }
}
