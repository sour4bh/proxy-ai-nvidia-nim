import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ProbeController } from "./controller.ts";
import { ProbeHistory } from "./history.ts";
import { emptyCounts, type ProbeRun } from "./types.ts";

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function completedRun(id: string): ProbeRun {
  return {
    id,
    source: "manual",
    status: "completed",
    startedAt: "2026-01-01T00:00:00.000Z",
    finishedAt: "2026-01-01T00:00:01.000Z",
    durationMs: 1000,
    config: { timeoutMs: 1000, concurrency: 1, maxTokens: 1024, modelCount: 0, skippedModelCount: 0 },
    counts: emptyCounts(),
    results: [],
  };
}

async function waitForIdle(controller: ProbeController): Promise<void> {
  for (let i = 0; i < 20; i += 1) {
    const state = await controller.state();
    if (state.status === "idle") return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

test("ProbeController rejects a manual run while another run is active", async () => {
  const dir = await mkdtemp(join(tmpdir(), "proxyai-probe-controller-"));
  const pending = deferred<ProbeRun>();
  try {
    const controller = new ProbeController({
      history: new ProbeHistory(dir, 30),
      nimBaseUrl: "https://example.test/v1",
      nimApiKey: "key",
      timeoutMs: 1000,
      concurrency: 1,
      intervalMs: 60_000,
      historyLimit: 30,
      historyDir: dir,
      runner: async (options) => pending.promise.then(() => completedRun(options.runId ?? "run")),
    });

    const first = controller.triggerManual();
    const second = controller.triggerManual();
    assert.equal(first.accepted, true);
    assert.equal(second.accepted, false);
    assert.equal(second.run.id, first.run.id);

    pending.resolve(completedRun(first.run.id));
    await waitForIdle(controller);
    const state = await controller.state();
    assert.equal(state.status, "idle");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
