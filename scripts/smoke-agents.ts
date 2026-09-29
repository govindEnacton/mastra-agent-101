import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { supervisorAgent } from '../src/mastra/agents/supervisor-agent';
import { researchAgent } from '../src/mastra/agents/research-agent';
import { weatherAgent } from '../src/mastra/agents/weather-agent';
import { weatherTool } from '../src/mastra/tools/weather-tool';
import { weatherWorkflow } from '../src/mastra/workflows/weather-workflow';
import { responseSchema } from '../src/lib/response-schema';

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('Set OPENROUTER_API_KEY in .env before running the live smoke check.');
}

// Exercise the production agents with ephemeral storage, keeping demo chat history clean.
const storage = new LibSQLStore({ id: 'smoke-storage', url: ':memory:' });
const mastra = new Mastra({
  agents: { supervisorAgent, researchAgent, weatherAgent },
  workflows: { weatherWorkflow },
  tools: { weatherTool },
  storage,
  logger: false,
});

try {
  const args = process.argv.slice(2);
  if (args[0] === '--workflow') {
    const city = args.slice(1).join(' ').trim() || 'London';
    const run = await mastra.getWorkflow('weatherWorkflow').createRun();
    const result = await run.start({ inputData: { city } });
    if (result.status !== 'success') throw new Error(`Workflow finished with status: ${result.status}`);
    console.log(JSON.stringify(result.result, null, 2));
  } else {
    const query = args.join(' ').trim() || 'Compare TypeScript and JavaScript for a beginner.';
    const result = await mastra.getAgent('supervisorAgent').generate(query, {
      abortSignal: AbortSignal.timeout(120_000),
      delegation: {
        enableResultReferences: true,
        onDelegationStart: async ({ primitiveId }) => {
          console.log(`Delegating to ${primitiveId}`);
          return { proceed: true };
        },
      },
    });
    console.log(JSON.stringify(responseSchema.parse(result.object), null, 2));
  }
} finally {
  await storage.close();
}
