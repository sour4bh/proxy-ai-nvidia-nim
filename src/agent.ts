import { ToolLoopAgent, tool } from "ai";
import { z } from "zod";
import { llama } from "./nim.ts";

const agent = new ToolLoopAgent({
  model: llama,
  instructions: "You use tools to answer questions. Be concise.",
  tools: {
    getWeather: tool({
      description: "Get the current weather for a city, in Celsius.",
      inputSchema: z.object({ city: z.string() }),
      execute: async ({ city }) => ({
        city,
        temperatureC: 15 + Math.floor(Math.random() * 15),
      }),
    }),
  },
});

const result = await agent.generate({
  prompt: "What's the weather in San Francisco?",
});

console.log(result.text);
console.log(`\n(${result.steps.length} steps)`);
