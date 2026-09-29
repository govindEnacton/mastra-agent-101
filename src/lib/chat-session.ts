import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';

const SESSION_COOKIE = 'mastra-chat-session';

export async function getChatSession() {
  const cookieStore = await cookies();
  const existing = z.uuid().safeParse(cookieStore.get(SESSION_COOKIE)?.value);
  const sessionId = existing.success ? existing.data : randomUUID();

  if (!existing.success) {
    cookieStore.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/chat',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return {
    thread: `chat:${sessionId}`,
    resource: `visitor:${sessionId}`,
  };
}
