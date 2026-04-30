export type ModelAnalysis = { intelligenceIndex: number };

// Intelligence Index scores from artificialanalysis.ai — keyed by NIM model ID.
// Models not listed here appear in bar charts / tables but are excluded from the scatter plot.
export const MODEL_ANALYSIS: Record<string, ModelAnalysis> = {
  "deepseek-ai/deepseek-r1":                          { intelligenceIndex: 85 },
  "deepseek-ai/deepseek-v3":                          { intelligenceIndex: 80 },
  "meta/llama-4-maverick-17b-128e-instruct":          { intelligenceIndex: 85 },
  "meta/llama-4-scout-17b-16e-instruct":              { intelligenceIndex: 76 },
  "meta/llama-3.1-405b-instruct":                     { intelligenceIndex: 75 },
  "nvidia/llama-3.1-nemotron-70b-instruct":           { intelligenceIndex: 72 },
  "mistralai/mistral-large-2-instruct":               { intelligenceIndex: 72 },
  "qwen/qwen2.5-72b-instruct":                        { intelligenceIndex: 70 },
  "meta/llama-3.3-70b-instruct":                      { intelligenceIndex: 70 },
  "mistralai/mixtral-8x22b-instruct-v0.1":            { intelligenceIndex: 65 },
  "meta/llama-3.1-70b-instruct":                      { intelligenceIndex: 62 },
  "google/gemma-3-27b-it":                            { intelligenceIndex: 55 },
  "google/gemma-3-12b-it":                            { intelligenceIndex: 48 },
  "meta/llama-3.1-8b-instruct":                       { intelligenceIndex: 45 },
};
