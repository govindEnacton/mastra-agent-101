import { WebhookSignalProvider } from '@mastra/core/signals'

export const webhookProvider = new WebhookSignalProvider({
  extractResourceId: (payload: any) => payload.city,
  buildNotification: (payload: any, subscription) => ({
    source: 'weather-webhook',
    kind: 'weather-alert',
    summary: `Weather alert for ${subscription.externalResourceId}: ${payload.message}`,
    payload,
  }),
})
