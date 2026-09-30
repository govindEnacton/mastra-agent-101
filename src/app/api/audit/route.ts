import { handleChatStream } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import { NextResponse } from 'next/server';
import { auditRequestSchema } from '@/lib/audit-request';
import { mastra } from '@/mastra';

export const runtime = 'nodejs';
export const maxDuration = 180;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON request body.' }, { status: 400 });
  }

  const parsed = auditRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Send the path of the file to audit.' }, { status: 400 });
  }

  const text = parsed.data.parts
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join(' ')
    .trim();

  // Defence in depth alongside the workspace's own containment: reject any
  // request naming an absolute path or a parent-directory escape.
  if (text.startsWith('/') || text.includes('..')) {
    return NextResponse.json(
      { error: 'Use a path relative to the audit folder.' },
      { status: 400 },
    );
  }

  try {
    const stream = await handleChatStream({
      mastra,
      agentId: 'audit-agent',
      version: 'v7',
      params: {
        messages: [parsed.data],
        abortSignal: req.signal,
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch {
    return NextResponse.json({ error: 'Unable to start the audit. Please try again.' }, { status: 500 });
  }
}
