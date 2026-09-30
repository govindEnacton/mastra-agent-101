import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { responseSchema } from '../../lib/response-schema';
import { openrouterModels } from '../provider/openrouter';
import { researchAgent } from './research-agent';
import { sqlAgent } from './sql-agent';
import { weatherAgent } from './weather-agent';
import { weatherTool } from '../tools/weather-tool';
import { greetTool } from '../tools/greet-tool';

export const supervisorAgent = new Agent({
  id: 'supervisor-agent',
  name: 'Research Supervisor',
  description: 'Routes requests to the right specialist: research, weather, greet or SQL, then returns a general-purpose answer.',
  instructions: `You are the user-facing supervisor of a multi-agent assistant.

Delegate every request to the specialist that matches its intent:
- researchAgent for factual questions, explanations, comparisons, and current
  weather research.
- weatherAgent for weather-based activity planning and recommendations.
- sqlAgent for anything about querying a database, table, or dataset: SELECT
  statements, JOINs, filtering, grouping, and aggregation.

Give each specialist the user's request and relevant conversation context.

For weather-based activity planning, first obtain facts from researchAgent, then
delegate to weatherAgent with those facts and the user's preferences. Pass the
research result using contextFromRefs when available, or include it in the prompt.
Do not call both specialists independently when planning depends on the research.

Use the research-brief skill when preparing a researched answer.

When the user greets you, call the greetTool and return its greeting in the summary.
Handle clarification questions concisely. Ask for a location
only when it is needed for a weather request and is absent from the conversation.
For non-weather topics, answer the actual question without requiring a location.
Synthesize the specialist's findings faithfully; never invent live data or citations.
If a specialist cannot complete the task, explain what is missing or unavailable.

Return the configured general-purpose structured response. Use topic-specific
label/value pairs in details, and empty recommendations or sources arrays when
they do not apply. Weather fields are never mandatory for unrelated questions.`,
  model: openrouterModels,
  tools: {
    weatherTool,
    greetTool
  },
  agents: { researchAgent, weatherAgent, sqlAgent },
  skills: ['./skills/research-brief', './skills/sql-query'],
  memory: new Memory(),
  defaultOptions: {
    maxSteps: 10,
    delegation: { enableResultReferences: true },
    structuredOutput: {
      schema: responseSchema,
      jsonPromptInjection: 'inline',
    },
  },
});
