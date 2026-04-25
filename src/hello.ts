import { generateText } from "ai";
import { llama } from "./nim.ts";

const { text, usage } = await generateText({
  model: llama,
  prompt: "In one sentence, what is NVIDIA NIM?",
});

console.log(text);
console.log("\nusage:", usage);
