import type { ProbeRun } from "./types.ts";

export type TimelinePoint = {
  runId: string;
  startedAt: string;
  category: string;
  ms: number;
  note: string;
};

export function aggregateTimelines(runs: readonly ProbeRun[], maxPerModel = 10): Record<string, TimelinePoint[]> {
  const sorted = [...runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const map: Record<string, TimelinePoint[]> = {};
  for (const run of sorted) {
    for (const r of run.results) {
      const arr = (map[r.id] ??= []);
      if (arr.length >= maxPerModel) continue;
      arr.push({
        runId: run.id,
        startedAt: run.startedAt,
        category: r.category,
        ms: r.ms,
        note: r.note,
      });
    }
  }
  return map;
}
