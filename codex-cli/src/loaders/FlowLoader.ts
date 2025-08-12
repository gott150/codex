import { promises as fs } from 'node:fs';
import yaml from 'yaml';
import { flowSchema, type FlowConfig } from '../schema/flow.schema.js';

export async function loadFlow(path: string): Promise<FlowConfig> {
  const text = await fs.readFile(path, 'utf8');
  const data = yaml.parse(text);
  return flowSchema.parse(data);
}
