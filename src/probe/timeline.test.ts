import assert from "node:assert/strict";
import test from "node:test";
import { aggregateTimelines } from "./timeline.ts";
import { emptyCounts, type ProbeResult, type ProbeRun } from "./types.ts";

function run(id: string, startedAt: string, results: ProbeResult[]): ProbeRun {
  return {
    id,
    source: "manual",
    status: "completed",
    startedAt,
    finishedAt: startedAt,
    durationMs: 0,
    config: {
      timeoutMs: 1,
      concurrency: 1,
      maxTokens: 1,
      clientQuietMs: 0,
      modelCount: results.length,
      skippedModelCount: 0,
    },
    counts: emptyCounts(),
    results,
  };
}

test("aggregateTimelines keeps latest points per model", () => {
  const runs = [
    run("a", "2026-01-02T00:00:00.000Z", [{ id: "m1", category: "alive", ms: 10, note: "", status: 200 }]),
    run("b", "2026-01-01T00:00:00.000Z", [{ id: "m1", category: "alive", ms: 20, note: "", status: 200 }]),
  ];
  const tl = aggregateTimelines(runs, 10);
  assert.equal(tl.m1?.length, 2);
  assert.equal(tl.m1![0]!.ms, 10);
  assert.equal(tl.m1![0]!.runId, "a");
  assert.equal(tl.m1![1]!.runId, "b");
});

test("aggregateTimelines respects maxPerModel", () => {
  const r: ProbeRun[] = [];
  for (let i = 0; i < 15; i += 1) {
    const iso = `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`;
    r.push(run(`run${i}`, iso, [{ id: "x", category: "alive", ms: i, note: "", status: 200 }]));
  }
  const tl = aggregateTimelines(r, 3);
  assert.equal(tl.x?.length, 3);
});
