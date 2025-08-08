import { z } from 'zod';

export const agentSchema = z.object({
  id: z.string(),
  role: z.string(),
  model: z.string(),
  tools: z.array(z.string()).default([]),
});

export type AgentConfig = z.infer<typeof agentSchema>;
