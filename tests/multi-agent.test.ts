import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Mastra } from '@mastra/core/mastra';
import type { MastraModelConfig } from '@mastra/core/llm';
import { LibSQLStore } from '@mastra/libsql';
import { researchAgent } from '../src/mastra/agents/research-agent';
import { weatherAgent } from '../src/mastra/agents/weather-agent';
import { supervisorAgent } from '../src/mastra/agents/supervisor-agent';
import { weatherWorkflow } from '../src/mastra/workflows/weather-workflow';

function textModel(text: string, inspect?: (prompt: string) => void) {
  return {
    specificationVersion: 'v3',
    provider: 'test',
    modelId: 'text-model',
    supportedUrls: {},
    doGenerate: async ({ prompt }) => {
      inspect?.(JSON.stringify(prompt));
      return {
        content: [{ type: 'text', text }],
        finishReason: { unified: 'stop', raw: 'stop' },
        usage: {
          inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 10, text: 10, reasoning: 0 },
        },
        warnings: [],
      };
    },
    doStream: async ({ prompt }) => {
      inspect?.(JSON.stringify(prompt));
      return {
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: 'text-start', id: 'text-1' });
            controller.enqueue({ type: 'text-delta', id: 'text-1', delta: text });
            controller.enqueue({ type: 'text-end', id: 'text-1' });
            controller.enqueue({
              type: 'finish', finishReason: { unified: 'stop', raw: 'stop' },
              usage: {
                inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
                outputTokens: { total: 10, text: 10, reasoning: 0 },
              },
            });
            controller.close();
          },
        }),
      };
    },
  } satisfies Extract<MastraModelConfig, { specificationVersion: 'v3' }>;
}

test('the supervisor exposes both specialists and the project skill is discoverable and readable', async () => {
  const agents = await supervisorAgent.listAgents();
  assert.equal(agents.researchAgent, researchAgent);
  assert.equal(agents.weatherAgent, weatherAgent);
  const skills = await researchAgent.listSkills();
  assert.ok(skills.some(skill => skill.name === 'research-brief'));
  const skill = await supervisorAgent.getSkill('research-brief');
  assert.ok(skill);
  assert.match(skill.instructions, /current observations/);
});

test('the real workflow runs research before planning and hands off the complete brief', async () => {
  const calls: string[] = [];
  const brief = 'London: 18 °C, overcast, observed at 10:00 UTC. Source: Open-Meteo.';
  const originalResearchModel = researchAgent.model;
  const originalWeatherModel = weatherAgent.model;
  const storage = new LibSQLStore({ id: 'workflow-test', url: ':memory:' });

  researchAgent.model = textModel(brief, prompt => {
    calls.push('research');
    assert.match(prompt, /London/);
  });
  weatherAgent.model = textModel('Take a walk; keep a museum as an indoor alternative.', prompt => {
    calls.push('weather');
    assert.ok(prompt.includes(brief));
  });

  try {
    const mastra = new Mastra({
      agents: { researchAgent, weatherAgent },
      workflows: { weatherWorkflow },
      storage,
      logger: false,
    });
    const run = await mastra.getWorkflow('weatherWorkflow').createRun();
    const result = await run.start({ inputData: { city: 'London' } });
    assert.equal(result.status, 'success', JSON.stringify(result));
    assert.deepEqual(calls, ['research', 'weather']);
    if (result.status === 'success') assert.match(result.result.activities, /museum/);
  } finally {
    researchAgent.model = originalResearchModel;
    weatherAgent.model = originalWeatherModel;
    await storage.close();
  }
});
