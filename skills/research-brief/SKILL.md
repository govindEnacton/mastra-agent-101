---
name: research-brief
description: Prepare grounded research briefs and general-purpose structured answers for this project's Research Supervisor, Research Agent, and weather activity handoff.
---

# Research brief

## When to use

Use this skill for factual questions, explanations, comparisons, and weather
research in this project's multi-agent chat. The Research Agent gathers evidence;
the supervisor synthesizes it; the Weather Agent plans activities from those facts.

## Procedure

1. Identify the user's topic, question, and relevant conversation context. Ask a
   clarification only if necessary. A location is required for live weather, not
   for unrelated questions.
2. Gather the available evidence. For current weather, call `weatherTool` and keep
   the returned location, values, units, observation time, and source URL. For
   general topics, distinguish background knowledge from user-provided material.
   This project has no general web-search tool: never claim to have searched.
3. Keep facts separate from assumptions. Do not turn current observations into a
   forecast or invent citations, venue hours, measurements, or failed tool results.
4. Prepare a concise brief containing findings, evidence actually consulted, and
   limitations. Pass the full brief to the next agent. For activity planning, the
   supervisor must obtain research before asking the Weather Agent to plan.
5. The supervisor returns the schema documented in
   `references/response-format.md`. Adapt the details to the topic rather than
   forcing every response into a weather-shaped object.
6. If evidence is unavailable, explain the limitation and a useful next step. Use
   empty arrays for fields with no supporting content.

## Project integration

- Both `researchAgent` and `supervisorAgent` load this folder via Mastra's `skills` option.
- The skill is available through the agent's `skill`, `skill_read`, and `skill_search` tools.
- The deterministic `weatherWorkflow` passes the Research Agent's brief to the
  Weather Agent. The chat supervisor can perform the same handoff conversationally.
