# Multi-agent research assistant

Next.js chat powered by Mastra, with a supervisor, two specialists, a reusable
project skill, and a deterministic two-agent weather workflow.

## Run locally

```bash
bun install
```

Set `OPENROUTER_API_KEY` in `.env`. Optional `OPENROUTER_MODEL` and
`OPENROUTER_FALLBACK_MODEL` override the existing defaults in
`src/mastra/provider/openrouter.ts`; use models that support tool calling.

```bash
bun run dev
```

Open **http://localhost:3000/chat**.

Try:

- “Compare TypeScript and JavaScript.”
- “Explain how a Mastra supervisor coordinates agents.”
- “What is the current weather in London?”
- “Research the weather in London and suggest outdoor activities with an indoor backup.”

The UI displays agent/tool calls and the final structured response. Conversation
history is scoped to an anonymous browser session using an HTTP-only cookie.
Clearing that cookie starts a new conversation. This is browser-session isolation;
there is no account login system.

## Multi-agent orchestration

```text
POST /api/chat
  └─ Research Supervisor
       ├─ Research Agent → project skill / weatherTool when relevant
       ├─ Weather Agent ← research brief, for weather activity planning
       └─ General-purpose structured response
```

The supervisor forces the first model step to delegate to `researchAgent` so the
handoff is executed even if the model could answer from its own knowledge. After
research, it can delegate activity planning to `weatherAgent` and synthesize the
final answer. Mastra result references let the planner receive the research brief.

There is also an explicit workflow, registered as `weatherWorkflow`:

```text
{ city } → research-weather (Research Agent)
         → plan-activities (Weather Agent receives the research)
         → { activities }
```

This workflow plans from **current observations**. The weather tool does not
provide a future forecast. General-topic research uses model knowledge and
user-provided material; live web search is not configured.

All agents, workflows, and the weather tool are registered in `src/mastra/index.ts`.

## General-purpose structured output

The supervisor uses the shared Zod contract in `src/lib/response-schema.ts`:

```json
{
  "title": "TypeScript and JavaScript",
  "summary": "TypeScript adds static type checking to JavaScript.",
  "details": [
    { "label": "Runtime", "value": "TypeScript compiles to JavaScript." }
  ],
  "recommendations": [],
  "sources": []
}
```

`details` adapts to the topic. Weather measurements are label/value entries with
units, rather than mandatory fields on every answer. Sources contain
`{ title, url }` entries only when a source was actually used. Clarifications use
the same schema with empty arrays where appropriate.

The UI recognizes both streamed structured-output parts and JSON answers restored
from memory.

## Custom skill

[`skills/research-brief/SKILL.md`](skills/research-brief/SKILL.md) defines how this
project gathers evidence, passes research to another agent, handles unavailable
data, and produces topic-independent answers. Its
[`references/response-format.md`](skills/research-brief/references/response-format.md)
documents the shared contract and examples.

Both the supervisor and researcher expose the folder through Mastra's `skills`
option. Agents can discover it, load instructions with `skill`, and read the
reference with `skill_read`. Next.js output tracing includes the folder for the
chat route.

## Verification

```bash
# Offline tests: schemas, history restoration, upstream errors, skill discovery,
# and the real two-agent workflow with deterministic model fixtures.
bun run test

# Live checks using the configured OpenRouter model and ephemeral storage.
bun run smoke -- "Compare TypeScript and JavaScript."
bun run smoke -- --workflow London

# Project-wide checks.
bun run lint
bun run build
```

Live checks make model calls; the weather workflow also calls Open-Meteo.
The smoke script uses in-memory storage so it does not add messages to the UI's
conversation history.

See the [audit notes](docs/audits/week-1-code-audit.md) for verification results and
the existing repository-wide lint/type-check findings.

## Week 1 code audit

- [Findings, fixes, and verification](docs/audits/week-1-code-audit.md)
- [Repeatable Claude review prompt](docs/audits/claude-review-prompt.md)

The Claude CLI attempt was blocked by `Credit balance is too low`. The notes
record the verified local review and fixes; completing the Claude review remains
an assignment follow-up once credits are available.
