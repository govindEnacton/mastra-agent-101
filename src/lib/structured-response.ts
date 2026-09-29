import type { UIMessage } from 'ai';
import { responseSchema, type StructuredResponse } from './response-schema';

export function getStructuredResponse(message: UIMessage): StructuredResponse | undefined {
  if (message.role !== 'assistant') return;

  for (const part of message.parts) {
    if (part.type !== 'data-structured-output') continue;
    const data = part.data;
    if (typeof data !== 'object' || data === null || !('object' in data)) continue;
    const parsed = responseSchema.safeParse(data.object);
    if (parsed.success) return parsed.data;
  }

  // Mastra memory can restore the JSON answer as text rather than an SSE data part.
  const text = message.parts
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('');

  try {
    const parsed = responseSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : undefined;
  } catch {
    // Partial JSON is expected while a response is streaming.
    return undefined;
  }
}
