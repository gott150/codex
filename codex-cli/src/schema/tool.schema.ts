import { z } from 'zod';

export const toolSchema = z
  .object({
    id: z.string(),
    type: z.string(),
  })
  .passthrough();

export type ToolConfig = z.infer<typeof toolSchema>;
