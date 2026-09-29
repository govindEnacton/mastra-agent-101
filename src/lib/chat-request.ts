import { z } from 'zod';

// Conversation history is recalled from server-side memory. Only the latest
// user message is accepted from the client, never agent execution options.
export const chatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1),
}).transform(({ messages }) => messages.at(-1)).pipe(z.object({
  id: z.string().min(1).max(200),
  role: z.literal('user'),
  parts: z.array(z.object({
    type: z.literal('text'),
    text: z.string().trim().min(1).max(20_000),
  })).min(1).max(10),
}));
