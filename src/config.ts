import { parseArgs } from "node:util";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number, got ${v}`);
  return n;
}

function text(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.trim() ? v : fallback;
}

function parseAliases(): Record<string, string> {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const { values } = parseArgs({
    args,
    options: { alias: { type: "string", multiple: true } },
    strict: true,
    allowPositionals: false,
  });
  const list = (values.alias as string[] | undefined) ?? [];
  const out: Record<string, string> = {};
  for (const kv of list) {
    const eq = kv.indexOf("=");
    if (eq <= 0) throw new Error(`--alias expects key=value, got: ${kv}`);
    out[kv.slice(0, eq)] = kv.slice(eq + 1);
  }
  return out;
}

export const config = {
  nimApiKey: required("NVIDIA_NIM_API_KEY"),
  nimBaseUrl: "https://integrate.api.nvidia.com/v1",
  host: process.env.PROXY_HOST ?? "127.0.0.1",
  port: int("PROXY_PORT", 3000),
  rateCapacity: int("PROXY_RATE_CAPACITY", 40),
  rateWindowMs: int("PROXY_RATE_WINDOW_MS", 60_000),
  maxQueueWaitMs: int("PROXY_MAX_QUEUE_WAIT_MS", 30_000),
  upstreamTimeoutMs: int("PROXY_UPSTREAM_TIMEOUT_MS", 600_000),
  probeIntervalMs: int("PROBE_INTERVAL_MS", 21_600_000),
  probeHistoryLimit: int("PROBE_HISTORY_LIMIT", 30),
  probeHistoryDir: text("PROBE_HISTORY_DIR", ".probe-history"),
  probeTimeoutMs: int("PROBE_TIMEOUT_MS", 30_000),
  probeConcurrency: int("PROBE_CONCURRENCY", 3),
  probeClientQuietMs: int("PROBE_CLIENT_QUIET_MS", 30_000),
  aliases: parseAliases(),
} as const;
