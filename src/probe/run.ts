import { countResults, emptyCounts, type ProbeResult, type ProbeRun, type ProbeRunSource } from "./types.ts";

const NON_CHAT =
  /embed|guard|retriever|reward|safety|translate|streampetr|vila|deplot|paligemma|kosmos|recurrentgemma|fuyu|starcoder|mamba|mathstral|nemotron-parse|nvclip|neva-/i;

export const PROBE_MAX_TOKENS = 1024;

type Fetch = typeof fetch;

export type ProbeRunnerOptions = {
  source: ProbeRunSource;
  nimBaseUrl: string;
  nimApiKey: string;
  timeoutMs: number;
  concurrency: number;
  maxTokens?: number;
  clientQuietMs?: number;
  fetchImpl?: Fetch;
  acquire?: (signal: AbortSignal) => Promise<void>;
  beforeProbe?: (modelId: string) => Promise<void>;
  runId?: string;
  startedAt?: string;
  onConfig?: (config: ProbeRun["config"]) => void;
  onResult?: (result: ProbeResult) => void;
};

export type ProbeOneOptions = {
  nimBaseUrl: string;
  nimApiKey: string;
  timeoutMs: number;
  maxTokens?: number;
  fetchImpl?: Fetch;
  acquire?: (signal: AbortSignal) => Promise<void>;
};

export function chatModelIds(models: Array<{ id: string }>): { ids: string[]; skipped: number } {
  const ids = models.map((model) => model.id).filter((id) => !NON_CHAT.test(id));
  return { ids, skipped: models.length - ids.length };
}

export function createRunId(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export async function probeOne(id: string, options: ProbeOneOptions): Promise<ProbeResult> {
  const fetcher = options.fetchImpl ?? fetch;
  const maxTokens = options.maxTokens ?? PROBE_MAX_TOKENS;
  const start = Date.now();
  const signal = AbortSignal.timeout(options.timeoutMs);

  if (options.acquire) {
    try {
      await options.acquire(signal);
    } catch (e) {
      return {
        id,
        status: 0,
        ms: Date.now() - start,
        note: `local limiter rejected probe: ${(e as Error).message}`.slice(0, 100),
        category: "skipped",
      };
    }
  }

  try {
    const r = await fetcher(`${options.nimBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.nimApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: id,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: maxTokens,
      }),
      signal,
    });
    const ms = Date.now() - start;
    if (r.status === 200) return { id, status: 200, ms, note: "ok", category: "alive" };
    const body = (await r.text()).replace(/\s+/g, " ").trim().slice(0, 100);
    if (r.status === 429) return { id, status: 429, ms, note: body, category: "rate_limited" };
    return { id, status: r.status, ms, note: body, category: "error" };
  } catch (e) {
    const ms = Date.now() - start;
    const err = e as Error;
    if (err.name === "TimeoutError") {
      return { id, status: 0, ms, note: `no bytes in ${options.timeoutMs}ms`, category: "timeout" };
    }
    return { id, status: 0, ms, note: err.message.slice(0, 100), category: "error" };
  }
}

async function fetchModelIds(options: ProbeRunnerOptions): Promise<{ ids: string[]; skipped: number }> {
  const fetcher = options.fetchImpl ?? fetch;
  const r = await fetcher(`${options.nimBaseUrl}/models`, {
    headers: { Authorization: `Bearer ${options.nimApiKey}` },
  });
  if (!r.ok) throw new Error(`/v1/models returned ${r.status}`);
  const list = (await r.json()) as { data?: Array<{ id: string }> };
  return chatModelIds(Array.isArray(list.data) ? list.data : []);
}

export async function runProbe(options: ProbeRunnerOptions): Promise<ProbeRun> {
  const startedAt = options.startedAt ?? new Date().toISOString();
  const id = options.runId ?? createRunId(new Date(startedAt));
  const maxTokens = options.maxTokens ?? PROBE_MAX_TOKENS;
  const startedMs = Date.parse(startedAt);
  const results: ProbeResult[] = [];
  let config: ProbeRun["config"] = {
    timeoutMs: options.timeoutMs,
    concurrency: options.concurrency,
    maxTokens,
    clientQuietMs: options.clientQuietMs ?? 0,
    modelCount: 0,
    skippedModelCount: 0,
  };

  try {
    const { ids, skipped } = await fetchModelIds(options);
    config = { ...config, modelCount: ids.length, skippedModelCount: skipped };
    options.onConfig?.(config);

    let cursor = 0;
    const worker = async (): Promise<void> => {
      while (cursor < ids.length) {
        const modelId = ids[cursor++]!;
        await options.beforeProbe?.(modelId);
        const result = await probeOne(modelId, { ...options, maxTokens });
        results.push(result);
        options.onResult?.(result);
      }
    };

    await Promise.all(Array.from({ length: Math.max(1, options.concurrency) }, worker));

    const finishedAt = new Date().toISOString();
    return {
      id,
      source: options.source,
      status: "completed",
      startedAt,
      finishedAt,
      durationMs: Date.parse(finishedAt) - startedMs,
      config,
      counts: countResults(results),
      results: [...results].sort((a, b) => a.id.localeCompare(b.id)),
    };
  } catch (e) {
    const finishedAt = new Date().toISOString();
    return {
      id,
      source: options.source,
      status: "failed",
      startedAt,
      finishedAt,
      durationMs: Date.parse(finishedAt) - startedMs,
      config,
      counts: emptyCounts(),
      results,
      error: (e as Error).message,
    };
  }
}
