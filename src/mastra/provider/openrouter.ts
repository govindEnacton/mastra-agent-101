import { createOpenAI } from "@ai-sdk/openai";
 
export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});
 
const primaryModelId = (process.env.OPENROUTER_MODEL ??
  "inclusionai/ling-3.0-flash-sante:free") as `${string}/${string}`;
 
export const openrouterModel = {
  id: primaryModelId,
  url: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
} as const;
 
const fallbackModelId = (process.env.OPENROUTER_FALLBACK_MODEL ??
  "inclusionai/ling-3.0-flash-sante:free") as `${string}/${string}`;
 
export const openrouterModels = [
  {
    model: openrouterModel,
    maxRetries: 1,
  },
  {
    model: {
      id: fallbackModelId,
      url: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    },
    maxRetries: 1,
  },
];
