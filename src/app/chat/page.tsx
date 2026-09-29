'use client'

import { useEffect, useState } from 'react'
import { DefaultChatTransport, isToolUIPart } from 'ai'
import { useChat } from '@ai-sdk/react'
import { getStructuredResponse } from '@/lib/structured-response'
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'

export default function Chat() {
  const [input, setInput] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState<string>()
  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })
  const busy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    const controller = new AbortController()
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/chat', { signal: controller.signal })
        if (!res.ok) throw new Error('Unable to load conversation history.')
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('Invalid conversation history.')
        if (!controller.signal.aborted) setMessages(data)
      } catch {
        if (!controller.signal.aborted) {
          setHistoryError('Could not load earlier messages. You can still send a new message.')
        }
      } finally {
        if (!controller.signal.aborted) setLoadingHistory(false)
      }
    }
    void fetchMessages()
    return () => controller.abort()
  }, [setMessages])

  const handleSubmit = async () => {
    if (!input.trim() || busy || loadingHistory) return
    const text = input.trim()
    setInput('')
    await sendMessage({ text })
  }

  return (
    <main className="flex h-screen w-full flex-col gap-4 p-6">
      <header>
        <h1 className="text-xl font-semibold">Research assistant</h1>
        <p className="text-sm text-muted-foreground">
          Ask about any topic, compare ideas, or plan activities using current weather.
        </p>
      </header>

      <Conversation className="min-h-0 flex-1 rounded-lg border">
        <ConversationContent>
          {loadingHistory && <p role="status">Loading conversation…</p>}
          {messages.map(message => {
            const structuredData = getStructuredResponse(message)
            return (
              <div key={message.id}>
                {message.parts.map((part, i) => {
                  if (part.type === 'text' && !structuredData) {
                    return (
                      <Message key={`${message.id}-${i}`} from={message.role}>
                        <MessageContent><MessageResponse>{part.text}</MessageResponse></MessageContent>
                      </Message>
                    )
                  }

                  if (isToolUIPart(part)) {
                    return (
                      <Tool key={`${message.id}-${i}`}>
                        {part.type === 'dynamic-tool' ? (
                          <ToolHeader type={part.type} state={part.state} toolName={part.toolName} />
                        ) : (
                          <ToolHeader type={part.type} state={part.state} />
                        )}
                        <ToolContent>
                          <ToolInput input={part.input ?? {}} />
                          <ToolOutput output={part.output} errorText={part.errorText} />
                        </ToolContent>
                      </Tool>
                    )
                  }
                  return null
                })}
                {structuredData && (
                  <Message from={message.role}>
                    <MessageContent>
                      <div className="rounded-lg border bg-muted p-4 text-sm">
                        <div className="mb-2 font-semibold">Structured Output</div>
                        <pre className="whitespace-pre-wrap break-words">
                          {JSON.stringify(structuredData, null, 2)}
                        </pre>
                      </div>
                    </MessageContent>
                  </Message>
                )}
              </div>
            )
          })}
          {busy && <p role="status" className="text-sm text-muted-foreground">Agents are working…</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {historyError && <p role="alert" className="text-sm text-destructive">{historyError}</p>}
      {error && <p role="alert" className="text-sm text-destructive">The assistant could not finish the response. Please try again.</p>}
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputTextarea
            onChange={e => setInput(e.target.value)}
            value={input}
            placeholder="For example: Compare TypeScript and JavaScript"
            disabled={busy || loadingHistory}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            disabled={busy || loadingHistory || !input.trim()}
          >
            Send
          </button>
        </PromptInputFooter>
      </PromptInput>
    </main>
  )
}
