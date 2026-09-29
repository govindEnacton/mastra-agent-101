# Week 1 application code audit

## Scope and provenance

- Date: 2026-09-29.
- Available baseline: this repository's existing chat/weather implementation at
  commit `4fcfbdb`, plus the user's newly added Research Agent. No separate Week 1
  directory was present under the available internship directory. Confirm this
  scope against the assignment if Week 1 lives elsewhere.
- Local reviewer: OpenCode, powered by `openai/gpt-6-astra`.
- Claude attempt: Claude Code `2.1.79`, `--model sonnet`, read-only tools
  (`Read,Glob,Grep`), non-interactive, maximum budget USD 2.
- Claude result: **blocked before any model inference**. The CLI returned:

  ```json
  {
    "is_error": true,
    "result": "Credit balance is too low",
    "duration_api_ms": 0,
    "total_cost_usd": 0
  }
  ```

The findings below were verified locally from source and checks. The required
Claude-authored review is **pending**. Re-run the supplied review prompt after
restoring Claude credits and append its findings and any resulting fixes here.

## Findings and fixes

Baseline line numbers refer to the original files at `4fcfbdb`.

| ID | Severity | Finding and impact | Applied fix | Verification |
| --- | --- | --- | --- | --- |
| A1 | High | `src/app/api/chat/route.ts:8–9,28–32,40–48` uses one constant thread/resource for every request. Different visitors can receive the same conversation history. | A server-created UUID in an HTTP-only cookie now scopes both POST and GET memory. GET checks resource ownership and uses `Cache-Control: no-store`. | Route inspection; session API check recorded below. |
| A2 | High | `src/app/api/chat/route.ts:12,18,29` spreads unvalidated request fields into agent execution. A client can attempt to override instructions, model/options, or memory configuration. | Validate the latest user text message with Zod. Only that message, server-owned memory, and the request abort signal reach Mastra. History comes from server memory. Invalid JSON and invalid messages return 400. | `tests/chat-contract.test.ts` rejects invalid messages and confirms execution options/forged history are discarded. |
| A3 | Medium | The newly added `research-agent.ts` is imported into the working-tree `index.ts` but absent from the agent registry. The route only calls the Weather Agent; the original workflow calls one agent. | Register supervisor, researcher, weather agent, and weather tool. The supervisor's first step forces research delegation. The weather workflow explicitly passes the Research Agent's output to the Weather Agent. | Mocked-model workflow test confirms call order and exact brief handoff. Live supervisor output logs `Delegating to research-agent`; live workflow returns activities. |
| A4 | Medium | `src/app/api/chat/route.ts:19–25` requires `location`, `temperature`, `conditions`, and `recommendation` for every answer. Unrelated questions and clarification requests cannot be represented truthfully. | Shared topic-independent schema: `title`, `summary`, `details`, `recommendations`, `sources`. Research instructions now support general topics and distinguish live data from background knowledge. | Contract tests and a live TypeScript/JavaScript comparison produce valid output without weather fields. |
| A5 | Medium | `src/mastra/tools/weather-tool.ts:45–46,56–57` assumes successful HTTP responses and casts unvalidated JSON. Upstream errors can become misleading “not found” results or property-access errors; requests have no timeout. | Check HTTP status, apply a 10-second timeout per request, propagate cancellation, validate upstream payloads, and return explicit units, UTC observation time, and source URL. | Weather-tool tests cover success, HTTP 503, missing locations, malformed geocoding, and incomplete measurements. |
| A6 | Medium | `src/mastra/workflows/weather-workflow.ts:59,73–81` uses `timezone=auto,` and aggregates an unspecified forecast range into a single dated object, then asks for per-day plans. | Replace the duplicate fetching/aggregation path with a Research Agent → Weather Agent workflow using current-weather evidence and explicit limitations. The public `{ city } → { activities }` contract is preserved. | Workflow test and live London activity-planning check. |
| A7 | Medium | `src/app/chat/page.tsx:37–46` does not check history HTTP status or cancel stale loads. History loading can overwrite a newly started conversation; errors are not displayed. `disabled={status !== 'ready'}` can block input after a chat error. | Abort stale history requests, wait for initial history before sending, display errors, and disable input only while loading/generating. Restore general structured JSON from recalled text. | Structured-history regression test and client code inspection. |
| A8 | Low | `src/app/api/chat/route.ts:49` and the old chat page print full recalled messages in logs. | Remove raw conversation logging from the request/UI paths. | Source inspection. |

## Open baseline findings

1. **Webhook route API/integration:** `src/mastra/routes/webhook.ts` calls
   `registerApiRoute` with an obsolete single-object signature, discards its return
   value, and is not registered by `src/mastra/index.ts`. The app uses Next.js
   routes. The existing webhook file is not a reachable Next.js endpoint.
   `src/mastra/signal/webhook-provider.ts` also uses unvalidated `any` payloads.
2. **UI dependency API drift:** several pre-existing AI Elements components do not
   match the installed AI SDK/Base UI types. Examples: renderable tool descriptions
   in `agent.tsx`, hover-card timing props, token usage fields in `context.tsx`, and
   event callback signatures in `prompt-input.tsx`. These currently block the full
   production type check.
3. **Existing lint debt:** the initial `npm run lint` reported 19 errors and 11
   warnings, primarily React hook rules in generated UI components, plus the
   webhook payload types and the previously unused Research Agent import.
4. **Tracked runtime databases:** local `mastra.db*` and `mastra.duckdb*` files are
   already tracked. They can contain conversation/tracing data and create binary
   diffs. Their contents were not inspected during this review. Establish a
   deliberate data-retention/source-control policy for these artifacts.

## Verification log

- `npm test`: **10 passed, 0 failed**. Uses deterministic model fixtures and mocked
  weather HTTP responses, with no external model calls.
- Focused ESLint on the changed application/agent files: **passed**.
- `npm run smoke -- "Compare TypeScript and JavaScript in three concise points."`:
  **passed**, including an actual Research Agent delegation and Zod-validated
  general structured output.
- `npm run smoke -- --workflow London`: **passed**, returned current-weather
  activity suggestions through the two-agent workflow.
- `npm run build`: JavaScript compilation **passed**; full production type check
  is **blocked** by the baseline UI/webhook issues above.
- Claude review: **blocked by insufficient account credits**.

## Completing the Claude requirement

After adding credits, run from the project root:

```bash
claude --print --model sonnet --output-format json \
  --no-session-persistence --permission-mode dontAsk \
  --tools "Read,Glob,Grep,Bash" \
  --allowedTools "Read,Glob,Grep,Bash(git show:*)" \
  --max-budget-usd 2 < docs/audits/claude-review-prompt.md
```

Save Claude's actual output, verify each reported finding, apply any additional
fixes, and update the verification log. Record the actual model reported by the
successful run; the failed attempt only selected the `sonnet` alias.
