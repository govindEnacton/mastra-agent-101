import { z } from 'zod';

// The client sends only a text message naming the file. It never sends agent
// options, model overrides, or tool results.
export const auditRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1),
}).transform(({ messages }) => messages.at(-1)).pipe(z.object({
  id: z.string().min(1).max(200),
  role: z.literal('user'),
  parts: z.array(z.object({
    type: z.literal('text'),
    text: z.string().trim().min(1).max(2_000),
  })).min(1).max(4),
}));
