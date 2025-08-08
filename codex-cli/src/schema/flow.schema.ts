import { z } from 'zod';
import { agentSchema } from './agent.schema.js';
import { toolSchema } from './tool.schema.js';

const providerSchema = z.object({
  model: z.string(),
  apiKeyEnv: z.string(),
});

const edgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  when: z.string().optional(),
});

export const flowSchema = z.object({
  version: z.number(),
  name: z.string(),
  description: z.string().optional(),
  providers: z.object({
    default: z.string(),
    map: z.record(providerSchema),
  }),
  memory: z.record(z.any()).optional(),
  tools: z.array(toolSchema),
  agents: z.array(agentSchema),
  flow: z.object({
    entry: z.string(),
    edges: z.array(edgeSchema),
  }),
});

export type FlowConfig = z.infer<typeof flowSchema>;
