import { z } from 'zod';

export const responseSchema = z.object({
  title: z.string().describe('A short title relevant to the user’s request'),
  summary: z.string().describe('The answer, or a clarification question when information is missing'),
  details: z.array(z.object({
    label: z.string().describe('A topic-specific label, such as Temperature or Main difference'),
    value: z.string().describe('The factual detail, including units where relevant'),
  })).describe('Supporting facts for any topic; use an empty array when unnecessary'),
  recommendations: z.array(z.string()).describe('Useful next steps; use an empty array when unnecessary'),
  sources: z.array(z.object({
    title: z.string(),
    url: z.url({ protocol: /^https?$/ }),
  })).describe('Only sources actually provided or consulted; otherwise use an empty array'),
});

export type StructuredResponse = z.infer<typeof responseSchema>;
