import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const greetTool = createTool({
  id: "greet-user",
  description:
    "Return a friendly greeting for the user. Use when the user says hi or hello.",
  inputSchema: z.object({
    name: z
      .string()
      .optional()
      .describe("The user name, only if they gave one"),
  }),
  outputSchema: z.object({
    greeting: z.string().describe("The greeting to show the user"),
  }),
  execute: async ({ name }) => ({
    greeting: name ? `Hello ${name}!` : "Hello! How can I help?",
  }),
});
