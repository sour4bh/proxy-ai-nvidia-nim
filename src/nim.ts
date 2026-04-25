import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const apiKey = process.env.NVIDIA_NIM_API_KEY;
if (!apiKey) throw new Error("NVIDIA_NIM_API_KEY not set");

export const nim = createOpenAICompatible({
  name: "nim",
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey,
});

export const llama = nim.chatModel("meta/llama-3.3-70b-instruct");
