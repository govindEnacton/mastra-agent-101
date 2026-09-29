import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { responseSchema } from '../../lib/response-schema';
import { openrouterModels } from '../provider/openrouter';
import { researchAgent } from './research-agent';
import { weatherAgent } from './weather-agent';

export const supervisorAgent = new Agent({
  id: 'supervisor-agent',
  name: 'Research Supervisor',
  description: 'Coordinates factual research and weather-based planning, then returns a general-purpose answer.',
  instructions: `You are the user-facing supervisor of a multi-agent assistant.

Use the research-brief skill when preparing a researched answer.
Delegate factual questions, explanations, comparisons, and current weather research
to researchAgent. Give it the user's question and relevant conversation context.
For weather-based activity planning, first obtain facts from researchAgent, then
delegate to weatherAgent with those facts and the user's preferences. Pass the
research result using contextFromRefs when available, or include it in the prompt.
Do not call both specialists independently when planning depends on the research.

Use the research brief to handle greetings and clarification questions concisely. Ask for a location
only when it is needed for a weather request and is absent from the conversation.
For non-weather topics, answer the actual question without requiring a location.
Synthesize the specialist's findings faithfully; never invent live data or citations.
If a specialist cannot complete the task, explain what is missing or unavailable.

Return the configured general-purpose structured response. Use topic-specific
label/value pairs in details, and empty recommendations or sources arrays when
they do not apply. Weather fields are never mandatory for unrelated questions.`,
  model: openrouterModels,
  agents: { researchAgent, weatherAgent },
  skills: ['./skills/research-brief'],
  memory: new Memory(),
  defaultOptions: {
    maxSteps: 10,
    // Guarantee a real handoff even when a model would otherwise answer directly.
    prepareStep: async ({ stepNumber }) => ({
      toolChoice: stepNumber === 0
        ? { type: 'tool' as const, toolName: 'agent-researchAgent' }
        : 'auto' as const,
    }),
    delegation: { enableResultReferences: true },
    structuredOutput: {
      schema: responseSchema,
      jsonPromptInjection: 'inline',
    },
  },
});
