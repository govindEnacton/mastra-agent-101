import { handleChatStream, } from '@mastra/ai-sdk'
import { toAISdkMessages } from '@mastra/ai-sdk/ui'
import { createUIMessageStreamResponse } from 'ai'
import { mastra } from '@/mastra'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const THREAD_ID = 'example-user-id'
const RESOURCE_ID = 'weather-chat'

export async function POST(req: Request) {
  const params = await req.json()
  const stream = await handleChatStream({
    mastra,
    agentId: 'weather-agent',
    version: 'v7',
    params: {
      ...params,
      structuredOutput: {
        schema: z.object({
          location: z.string(),
          temperature: z.number(),
          conditions: z.string(),
          recommendation: z.string(),
        }),
        jsonPromptInjection: 'inline',
      },
      memory: {
        ...params.memory,
        thread: THREAD_ID,
        resource: RESOURCE_ID,
      },
    },

  })

  return createUIMessageStreamResponse({ stream })
}

export async function GET() {
  const memory = await mastra.getAgentById('weather-agent').getMemory()
  let response = null

  try {
    response = await memory?.recall({
      threadId: THREAD_ID,
      resourceId: RESOURCE_ID,
    })
    console.log(response)
  } catch {
    console.log('No previous messages found.')
  }

  const uiMessages = toAISdkMessages(response?.messages || [], { version: 'v7' })

  return NextResponse.json(uiMessages)
}
