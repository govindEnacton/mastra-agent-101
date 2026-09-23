import { registerApiRoute } from '@mastra/core/server'
import { webhookProvider } from '../signal/webhook-provider'

registerApiRoute({
  path: '/webhooks/weather',
  method: 'POST',
  handler: async (c) => {
    const body = await c.req.json()
    const result = await webhookProvider.handleWebhook({
      body,
      headers: c.req.header(),
    })
    return c.json(result)
  },
})
