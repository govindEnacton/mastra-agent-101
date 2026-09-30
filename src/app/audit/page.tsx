'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { getAuditReport } from '@/lib/audit-response'
import type { AuditReport } from '@/lib/audit-schema'

const verdictStyles: Record<AuditReport['verdict'], string> = {
  pass: 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100',
  'pass-with-comments': 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
  fail: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100',
}

const severityStyles: Record<AuditReport['findings'][number]['severity'], string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-600 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-slate-500 text-white',
}

export default function AuditPage() {
  const [filePath, setFilePath] = useState('sample.ts')
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/audit' }),
  })

  const busy = status === 'submitted' || status === 'streaming'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const path = filePath.trim()
    if (!path || busy) return
    await sendMessage({ text: `Audit the type safety of ${path}` })
  }

  return (
    <main className="flex min-h-screen w-full flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-semibold">Type safety audit</h1>
        <p className="text-sm text-muted-foreground">
          Enter a file path from the audit folder, for example sample.ts
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={filePath}
          onChange={event => setFilePath(event.target.value)}
          placeholder="sample.ts"
          disabled={busy}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !filePath.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground opacity-90 disabled:opacity-50"
        >
          {busy ? 'Auditing…' : 'Audit'}
        </button>
      </form>

      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}

      {messages.map(message => {
        const report = getAuditReport(message)
        if (!report) return null

        return (
          <section key={message.id} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${verdictStyles[report.verdict]}`}>
                {report.verdict}
              </span>
              <span className="text-sm text-muted-foreground">{report.filePath}</span>
              <span className="text-xs text-muted-foreground">
                compiler: {report.typeCheckRan ? (report.compilerOk ? 'clean' : 'errors') : 'not run'}
              </span>
            </div>

            <p className="text-sm">{report.summary}</p>

            {report.findings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No type-safety issues found.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {report.findings.map((finding, index) => (
                  <li key={`${finding.title}-${index}`} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${severityStyles[finding.severity]}`}>
                        {finding.severity}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{finding.category}</span>
                      <span className="text-xs text-muted-foreground">
                        line {finding.line}
                        {finding.compilerConfirmed && ' · compiler'}
                      </span>
                    </div>

                    <h2 className="mb-1 font-medium text-sm">{finding.title}</h2>
                    <p className="mb-2 text-sm text-muted-foreground">{finding.why}</p>

                    <pre className="mb-2 overflow-x-auto rounded bg-muted p-2 text-xs">
                      {finding.evidence}
                    </pre>

                    <div className="text-sm">
                      <span className="font-medium">Fix: </span>
                      {finding.fix}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </main>
  )
}
