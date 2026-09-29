import { handleChatStream } from '@mastra/ai-sdk';
import { toAISdkMessages } from '@mastra/ai-sdk/ui';
import { createUIMessageStreamResponse } from 'ai';
import { NextResponse } from 'next/server';
import { chatRequestSchema } from '@/lib/chat-request';
import { getChatSession } from '@/lib/chat-session';
import { mastra } from '@/mastra';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON request body.' }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Send a non-empty user text message.' }, { status: 400 });
  }

  try {
    const memory = await getChatSession();
    const stream = await handleChatStream({
      mastra,
      agentId: 'supervisor-agent',
      version: 'v7',
      params: {
        messages: [parsed.data],
        memory,
        abortSignal: req.signal,
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch {
    return NextResponse.json({ error: 'Unable to start the assistant. Please try again.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getChatSession();
    const memory = await mastra.getAgent('supervisorAgent').getMemory();
    const thread = await memory?.getThreadById({
      threadId: session.thread,
    });

    if (!thread || thread.resourceId !== session.resource || !memory) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
    }

    const response = await memory.recall({
      threadId: session.thread,
      resourceId: session.resource,
    });

    return NextResponse.json(toAISdkMessages(response.messages, { version: 'v7' }), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Unable to load conversation history.' }, { status: 500 });
  }
}
