Perform a read-only code audit for the Week 1 assignment in this repository.

First read AGENTS.md and .agents/skills/mastra/SKILL.md. Verify Mastra API claims
against the installed documentation/types rather than recalled API knowledge.

Scope assumption: the inherited chat/weather application at git commit 4fcfbdb is
the available Week 1 baseline. No separate Week 1 directory was found. State this
assumption in the report; do not claim another project was reviewed.

Use `git show 4fcfbdb:<path>` to review the original versions of:

- src/app/api/chat/route.ts
- src/app/chat/page.tsx
- src/mastra/index.ts
- src/mastra/agents/weather-agent.ts
- src/mastra/tools/weather-tool.ts
- src/mastra/workflows/weather-workflow.ts
- src/mastra/routes/webhook.ts
- src/mastra/signal/webhook-provider.ts
- next.config.ts

Then read the current versions, src/mastra/agents/research-agent.ts,
src/mastra/agents/supervisor-agent.ts, src/lib/chat-request.ts,
src/lib/chat-session.ts, src/lib/response-schema.ts, the custom skill under
skills/research-brief, the tests, and docs/audits/week-1-code-audit.md to review fixes.

Focus on actual correctness, user/session isolation, request validation, agent
registration and handoffs, generic structured output, external API failures,
history restoration, and claimed versus available research capabilities.

Do not read .env, databases, credentials, or unrelated directories. Do not modify
files, invoke models/tools with side effects, or spawn subagents. Do not claim
tests or fixes were performed. Treat the local audit as evidence to check, not
as a conclusion to repeat without verification.

Return Markdown containing:
1. Scope and model identity if known.
2. Prioritized concrete findings with file/line references and impact.
3. Whether each current fix resolves the baseline finding.
4. Any remaining issues and targeted verification steps.
5. A short conclusion separating verified defects from untested hypotheses.
