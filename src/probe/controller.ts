import { ProbeHistory } from "./history.ts";
import { PROBE_MAX_TOKENS, runProbe, type ProbeRunnerOptions } from "./run.ts";
import { countResults, emptyCounts, type ProbeRun, type ProbeRunSource, type ProbeRunSummary } from "./types.ts";
import type { ProbePauseState, TrafficSnapshot } from "../traffic.ts";
import type { LimiterSnapshot } from "../limiter.ts";
import { MODEL_ANALYSIS, type ModelAnalysis } from "./analysis.ts";
import { loadModelSeen, saveModelSeen, touchProbeModels } from "./model-seen.ts";
import type { TelemetryEntry } from "../telemetry.ts";

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
  clientQuietMs: number;
  acquire?: (signal: AbortSignal) => Promise<void>;
  waitForClientQuiet?: (handlers: {
    onPause: (state: ProbePauseState) => void;
    onResume: () => void;
  }) => Promise<void>;
  traffic?: () => TrafficSnapshot;
  rateLimit?: () => LimiterSnapshot;
  aliases?: () => Array<{ id: string; resolved: string }>;
  runner?: Runner;
  log?: (record: Record<string, unknown>) => void;
  telemetry?: () => { recent: TelemetryEntry[]; max: number };
  proxyPublicUrl?: string;
  listenNonLoopback?: boolean;
  onHistoryWritten?: (run: ProbeRun) => void | Promise<void>;
};

export type ProbeState = {
  status: "running" | "idle";
  activeRun: ProbeRun | null;
  pause: ProbePauseState | null;
  latest: ProbeRun | null;
  history: ProbeRunSummary[];
  traffic: TrafficSnapshot | null;
  rateLimit: LimiterSnapshot | null;
  aliases: Array<{ id: string; resolved: string }>;
  analysis: Record<string, ModelAnalysis>;
  telemetry: { recent: TelemetryEntry[]; max: number };
  ui: { proxyPublicUrl?: string; listenNonLoopback: boolean };
  scheduler: {
    enabled: boolean;
    intervalMs: number;
    nextRunAt: string | null;
  };
  config: {
    timeoutMs: number;
    concurrency: number;
    maxTokens: number;
    clientQuietMs: number;
    historyLimit: number;
    historyDir: string;
  };
};

export class ProbeController {
  private activeRun: ProbeRun | null = null;
  private timer: NodeJS.Timeout | null = null;
  private nextRunAt: string | null = null;
  private pause: ProbePauseState | null = null;
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

  async state(): Promise<ProbeState> {
    const [latest, history] = await Promise.all([
      this.options.history.latest(),
      this.options.history.summaries(),
    ]);
    return {
      status: this.activeRun ? "running" : "idle",
      activeRun: this.activeRun,
      pause: this.pause,
      latest,
      history,
      traffic: this.options.traffic?.() ?? null,
      rateLimit: this.options.rateLimit?.() ?? null,
      telemetry: this.options.telemetry?.() ?? { recent: [], max: 0 },
      aliases: this.options.aliases?.() ?? [],
      analysis: MODEL_ANALYSIS,
      ui: {
        proxyPublicUrl: this.options.proxyPublicUrl,
        listenNonLoopback: this.options.listenNonLoopback ?? false,
      },
      scheduler: {
        enabled: this.started,
        intervalMs: this.options.intervalMs,
        nextRunAt: this.nextRunAt,
      },
      config: {
        timeoutMs: this.options.timeoutMs,
        concurrency: this.options.concurrency,
        maxTokens: PROBE_MAX_TOKENS,
        clientQuietMs: this.options.clientQuietMs,
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
        clientQuietMs: this.options.clientQuietMs,
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
      clientQuietMs: this.options.clientQuietMs,
      acquire: this.options.acquire,
      beforeProbe: async () => {
        await this.options.waitForClientQuiet?.({
          onPause: (state) => {
            if (!this.pause) {
              this.options.log?.({ event: "probe_paused_for_client_traffic", id, source, reason: state.reason });
            }
            this.pause = state;
          },
          onResume: () => {
            if (this.pause) {
              this.options.log?.({ event: "probe_resumed_after_client_quiet", id, source });
            }
            this.pause = null;
          },
        });
      },
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
          await this.touchProbeSeen(run);
          await this.options.onHistoryWritten?.(run);
          this.options.log?.({ event: "probe_run_finished", id: run.id, source, status: run.status, counts: run.counts });
        } finally {
          this.pause = null;
          this.activeRun = null;
        }
      })
      .catch((e) => {
        this.pause = null;
        this.activeRun = null;
        this.options.log?.({ event: "probe_run_error", source, error: (e as Error).message });
      });

    this.options.log?.({ event: "probe_run_started", id, source });
    return active;
  }

  private async touchProbeSeen(run: ProbeRun): Promise<void> {
    const ids = [...new Set(run.results.map((r) => r.id))];
    if (!ids.length) return;
    const dir = this.options.historyDir;
    const prev = await loadModelSeen(dir);
    const merged = touchProbeModels(prev, ids, new Date().toISOString());
    await saveModelSeen(dir, merged);
  }
}
