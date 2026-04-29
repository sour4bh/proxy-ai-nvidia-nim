import { config } from "../config.ts";
import { runProbe } from "./run.ts";
import type { ProbeResult } from "./types.ts";

const C = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

function mark(r: ProbeResult): string {
  if (r.category === "alive") return C.green("ok");
  if (r.category === "timeout") return C.red("timeout");
  if (r.category === "rate_limited") return C.yellow("429");
  if (r.category === "skipped") return C.yellow("skip");
  return C.yellow("error");
}

export async function runCliProbe(): Promise<void> {
  const run = await runProbe({
    source: "cli",
    nimBaseUrl: config.nimBaseUrl,
    nimApiKey: config.nimApiKey,
    timeoutMs: config.probeTimeoutMs,
    concurrency: config.probeConcurrency,
    onConfig: (probeConfig) => {
      console.log(
        `Probing ${probeConfig.modelCount} chat models (skipping ${probeConfig.skippedModelCount} non-chat) - concurrency=${probeConfig.concurrency}, timeout=${probeConfig.timeoutMs}ms\n`,
      );
    },
    onResult: (r) => {
      console.log(`${mark(r).padEnd(8)} ${r.id.padEnd(60)} ${`${r.ms}ms`.padStart(8)}  ${C.dim(r.note)}`);
    },
  });

  console.log(
    `\n${C.green(`${run.counts.alive} alive`)}, ${C.red(`${run.counts.timeout} hung`)}, ${C.yellow(`${run.counts.rate_limited} 429`)}, ${C.yellow(`${run.counts.error} errored`)}, ${C.yellow(`${run.counts.skipped} skipped`)} of ${run.results.length}`,
  );

  const alive = run.results.filter((r) => r.category === "alive").sort((a, b) => a.ms - b.ms);
  if (alive.length) {
    console.log("\nfastest 10:");
    for (const r of alive.slice(0, 10)) {
      console.log(`  ${`${r.ms}ms`.padStart(7)}  ${r.id}`);
    }
  }

  const failed = run.results.filter((r) => r.category !== "alive");
  if (failed.length) {
    console.log("\nnot alive:");
    for (const r of failed) console.log(`  ${r.category.padEnd(12)} ${r.id}`);
  }

  if (run.status === "failed") {
    throw new Error(run.error ?? "probe failed");
  }
}
