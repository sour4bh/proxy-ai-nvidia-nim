import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

const proxy = createOpenAICompatible({
  name: "proxy",
  baseURL: "http://127.0.0.1:3000/v1",
  apiKey: "unused",
});

const { text, usage } = await generateText({
  model: proxy.chatModel("gpt-4o"),
  prompt: "In one sentence, what is the speed of light?",
});

console.log(text);
console.log("\nusage:", usage);
