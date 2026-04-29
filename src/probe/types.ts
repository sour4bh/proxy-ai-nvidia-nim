export type ProbeCategory = "alive" | "timeout" | "rate_limited" | "error" | "skipped";
export type ProbeRunSource = "scheduled" | "manual" | "cli";
export type ProbeRunStatus = "running" | "completed" | "failed";

export type ProbeResult = {
  id: string;
  status: number;
  ms: number;
  note: string;
  category: ProbeCategory;
};

export type ProbeCounts = Record<ProbeCategory, number>;

export type ProbeRunConfig = {
  timeoutMs: number;
  concurrency: number;
  maxTokens: number;
  clientQuietMs: number;
  modelCount: number;
  skippedModelCount: number;
};

export type ProbeRun = {
  id: string;
  source: ProbeRunSource;
  status: ProbeRunStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  config: ProbeRunConfig;
  counts: ProbeCounts;
  results: ProbeResult[];
  error?: string;
};

export type ProbeRunSummary = Omit<ProbeRun, "results"> & {
  resultCount: number;
  fastest: ProbeResult[];
  slowest: ProbeResult[];
};

export function emptyCounts(): ProbeCounts {
  return { alive: 0, timeout: 0, rate_limited: 0, error: 0, skipped: 0 };
}

export function countResults(results: ProbeResult[]): ProbeCounts {
  const counts = emptyCounts();
  for (const result of results) counts[result.category] += 1;
  return counts;
}
