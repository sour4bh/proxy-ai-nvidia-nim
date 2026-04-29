import { ProbeHistory } from "./history.ts";
import { PROBE_MAX_TOKENS, runProbe, type ProbeRunnerOptions } from "./run.ts";
import { countResults, emptyCounts, type ProbeRun, type ProbeRunSource } from "./types.ts";

type Runner = (options: ProbeRunnerOptions) => Promise<ProbeRun>;

type ProbeControllerOptions = {
  history: ProbeHistory;
  nimBaseUrl: string;
  nimApiKey: string;
  timeoutMs: number;
  concurrency: number;
  intervalMs: number;
  historyLimit: number;
  historyDir: string;
  acquire?: (signal: AbortSignal) => Promise<void>;
  runner?: Runner;
  log?: (record: Record<string, unknown>) => void;
};

export class ProbeController {
  private activeRun: ProbeRun | null = null;
  private timer: NodeJS.Timeout | null = null;
  private nextRunAt: string | null = null;
  private started = false;
  private runner: Runner;

  constructor(private options: ProbeControllerOptions) {
    this.runner = options.runner ?? runProbe;
  }

  startScheduler(): void {
    if (this.started) return;
    this.started = true;
    this.schedule(5_000);
  }

  stopScheduler(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.nextRunAt = null;
    this.started = false;
  }

  triggerManual(): { accepted: true; run: ProbeRun } | { accepted: false; run: ProbeRun } {
    if (this.activeRun) return { accepted: false, run: this.activeRun };
    return { accepted: true, run: this.startRun("manual") };
  }

  async state(): Promise<Record<string, unknown>> {
    const [latest, history] = await Promise.all([
      this.options.history.latest(),
      this.options.history.summaries(),
    ]);
    return {
      status: this.activeRun ? "running" : "idle",
      activeRun: this.activeRun,
      latest,
      history,
      scheduler: {
        enabled: this.started,
        intervalMs: this.options.intervalMs,
        nextRunAt: this.nextRunAt,
      },
      config: {
        timeoutMs: this.options.timeoutMs,
        concurrency: this.options.concurrency,
        maxTokens: PROBE_MAX_TOKENS,
        historyLimit: this.options.historyLimit,
        historyDir: this.options.historyDir,
      },
    };
  }

  private schedule(delayMs: number): void {
    const next = Date.now() + delayMs;
    this.nextRunAt = new Date(next).toISOString();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.nextRunAt = null;
      if (!this.activeRun) this.startRun("scheduled");
      this.schedule(this.options.intervalMs);
    }, delayMs);
    this.timer.unref?.();
  }

  private startRun(source: ProbeRunSource): ProbeRun {
    const startedAt = new Date().toISOString();
    const id = startedAt.replace(/[:.]/g, "-");
    const active: ProbeRun = {
      id,
      source,
      status: "running",
      startedAt,
      finishedAt: null,
      durationMs: null,
      config: {
        timeoutMs: this.options.timeoutMs,
        concurrency: this.options.concurrency,
        maxTokens: PROBE_MAX_TOKENS,
        modelCount: 0,
        skippedModelCount: 0,
      },
      counts: emptyCounts(),
      results: [],
    };
    this.activeRun = active;

    void this.runner({
      source,
      runId: id,
      startedAt,
      nimBaseUrl: this.options.nimBaseUrl,
      nimApiKey: this.options.nimApiKey,
      timeoutMs: this.options.timeoutMs,
      concurrency: this.options.concurrency,
      maxTokens: PROBE_MAX_TOKENS,
      acquire: this.options.acquire,
      onConfig: (config) => {
        active.config = config;
      },
      onResult: (result) => {
        active.results.push(result);
        active.counts = countResults(active.results);
      },
    })
      .then(async (run) => {
        try {
          await this.options.history.write(run);
          this.options.log?.({ event: "probe_run_finished", id: run.id, source, status: run.status, counts: run.counts });
        } finally {
          this.activeRun = null;
        }
      })
      .catch((e) => {
        this.activeRun = null;
        this.options.log?.({ event: "probe_run_error", source, error: (e as Error).message });
      });

    this.options.log?.({ event: "probe_run_started", id, source });
    return active;
  }
}
