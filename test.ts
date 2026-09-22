// test-raw-output.ts (temporary file, run with tsx)
import { mastra } from '@/mastra'

const agent = mastra.getAgentById('weather-agent')
const response = await agent.generate('What is the weather in London?')

console.log('--- TEXT ---')
console.log(response.text)

console.log('--- TOOL CALLS ---')
console.log(JSON.stringify(response.toolCalls, null, 2))

console.log('--- FULL OBJECT ---')
console.dir(response, { depth: null })
