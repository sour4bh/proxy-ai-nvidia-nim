import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ProbeHistory } from "./history.ts";
import { emptyCounts, type ProbeRun } from "./types.ts";

function run(id: number): ProbeRun {
  const startedAt = new Date(Date.UTC(2026, 0, 1, 0, id)).toISOString();
  return {
    id: `run-${String(id).padStart(2, "0")}`,
    source: "scheduled",
    status: "completed",
    startedAt,
    finishedAt: startedAt,
    durationMs: 10,
    config: { timeoutMs: 1000, concurrency: 1, maxTokens: 1024, modelCount: 1, skippedModelCount: 0 },
    counts: { ...emptyCounts(), alive: 1 },
    results: [{ id: "model", status: 200, ms: id, note: "ok", category: "alive" }],
  };
}

test("ProbeHistory retains only the configured number of run files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "proxyai-probe-"));
  try {
    const history = new ProbeHistory(dir, 30);
    for (let i = 0; i < 32; i += 1) {
      await history.write(run(i));
    }

    const files = await readdir(dir);
    const runFiles = files.filter((file) => file.endsWith(".json") && file !== "latest.json");
    assert.equal(runFiles.length, 30);
    assert.equal(files.includes("latest.json"), true);
    assert.equal(runFiles.includes("run-00.json"), false);
    assert.equal(runFiles.includes("run-01.json"), false);
    assert.equal(runFiles.includes("run-31.json"), true);

    const latest = await history.latest();
    assert.equal(latest?.id, "run-31");

    const summaries = await history.summaries();
    assert.equal(summaries.length, 30);
    assert.equal(summaries[0]?.id, "run-31");
    assert.equal(summaries[0]?.resultCount, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
