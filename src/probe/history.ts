import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProbeRun, ProbeRunSummary } from "./types.ts";

export class ProbeHistory {
  constructor(
    private dir: string,
    private limit: number,
  ) {}

  async write(run: ProbeRun): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const runPath = this.pathFor(run.id);
    await this.writeJsonAtomic(runPath, run);
    await this.writeJsonAtomic(join(this.dir, "latest.json"), run);
    await this.prune();
  }

  async latest(): Promise<ProbeRun | null> {
    try {
      return parseRun(await readFile(join(this.dir, "latest.json"), "utf8"));
    } catch {
      return null;
    }
  }

  async summaries(): Promise<ProbeRunSummary[]> {
    const runs = await this.runs();
    return runs.map((run) => summarizeRun(run));
  }

  private async runs(): Promise<ProbeRun[]> {
    let files: string[];
    try {
      files = await readdir(this.dir);
    } catch {
      return [];
    }

    const runs: ProbeRun[] = [];
    for (const file of files) {
      if (!file.endsWith(".json") || file === "latest.json" || file.endsWith(".tmp")) continue;
      try {
        runs.push(parseRun(await readFile(join(this.dir, file), "utf8")));
      } catch {
        continue;
      }
    }
    return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  private async prune(): Promise<void> {
    const runs = await this.runs();
    for (const run of runs.slice(this.limit)) {
      await rm(this.pathFor(run.id), { force: true });
    }
  }

  private pathFor(id: string): string {
    return join(this.dir, `${id}.json`);
  }

  private async writeJsonAtomic(path: string, value: unknown): Promise<void> {
    const tmp = `${path}.tmp`;
    await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`);
    await rename(tmp, path);
  }
}

function parseRun(contents: string): ProbeRun {
  const run = JSON.parse(contents) as ProbeRun;
  return {
    ...run,
    config: {
      timeoutMs: run.config.timeoutMs,
      concurrency: run.config.concurrency,
      maxTokens: run.config.maxTokens,
      clientQuietMs: run.config.clientQuietMs ?? 0,
      modelCount: run.config.modelCount,
      skippedModelCount: run.config.skippedModelCount,
    },
  };
}

export function summarizeRun(run: ProbeRun): ProbeRunSummary {
  const { results, ...summary } = run;
  const alive = run.results.filter((result) => result.category === "alive");
  return {
    ...summary,
    resultCount: run.results.length,
    fastest: [...alive].sort((a, b) => a.ms - b.ms).slice(0, 5),
    slowest: [...run.results].sort((a, b) => b.ms - a.ms).slice(0, 5),
  };
}
