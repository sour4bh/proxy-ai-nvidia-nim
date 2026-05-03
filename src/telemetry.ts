import type { Context } from "hono";
import { clientHints } from "./client-hints.ts";

export type TelemetryEntry = {
  at: string;
  reqId: string;
  path: string;
  requestedModel: string;
  resolvedModel: string;
  stream: boolean;
  queueWaitMs?: number;
  upstreamStatus?: number;
  totalMs?: number;
  phase: string;
  userAgent: string;
  clientIp?: string;
};

export type TelemetryAppendInput = Omit<TelemetryEntry, "at"> & { at?: string };

export type RequestInstrument = {
  telemetry?: TelemetryStore;
  clientIp?: string;
  userAgent: string;
};

let boundStore: TelemetryStore | null = null;

export function setTelemetryStore(store: TelemetryStore | null): void {
  boundStore = store;
}

export function getTelemetryStore(): TelemetryStore | null {
  return boundStore;
}

export function instrument(c: Context): RequestInstrument | undefined {
  if (!boundStore) return undefined;
  const h = clientHints(c);
  return { telemetry: boundStore, userAgent: h.userAgent, clientIp: h.clientIp };
}

export function appendTelemetry(
  inst: RequestInstrument | undefined,
  entry: Omit<TelemetryAppendInput, "userAgent" | "clientIp">,
): void {
  inst?.telemetry?.append({
    ...entry,
    userAgent: inst.userAgent,
    clientIp: inst.clientIp,
  });
}

const UA_MAX = 120;

export function truncateUserAgent(ua: string, max = UA_MAX): string {
  if (ua.length <= max) return ua;
  return `${ua.slice(0, max - 1)}…`;
}

export class TelemetryStore {
  private buf: TelemetryEntry[] = [];
  private head = 0;
  private size = 0;

  constructor(
    private readonly max: number,
    private enabled: boolean,
  ) {}

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  append(entry: TelemetryAppendInput): void {
    if (!this.enabled || this.max <= 0) return;
    const full: TelemetryEntry = {
      at: entry.at ?? new Date().toISOString(),
      reqId: entry.reqId,
      path: entry.path,
      requestedModel: entry.requestedModel,
      resolvedModel: entry.resolvedModel,
      stream: entry.stream,
      queueWaitMs: entry.queueWaitMs,
      upstreamStatus: entry.upstreamStatus,
      totalMs: entry.totalMs,
      phase: entry.phase,
      userAgent: truncateUserAgent(entry.userAgent),
      clientIp: entry.clientIp,
    };
    if (this.size < this.max) {
      const idx = (this.head + this.size) % this.max;
      if (this.size === this.buf.length) this.buf.push(full);
      else this.buf[idx] = full;
      this.size += 1;
      return;
    }
    this.buf[this.head] = full;
    this.head = (this.head + 1) % this.max;
  }

  recent(count: number): TelemetryEntry[] {
    const n = Math.min(count, this.size);
    if (n <= 0) return [];
    const out: TelemetryEntry[] = [];
    for (let i = 0; i < n; i += 1) {
      const idx = (this.head + this.size - 1 - i + this.max) % this.max;
      out.push(this.buf[idx]!);
    }
    return out;
  }

  tailForState(count: number): TelemetryEntry[] {
    return this.recent(count);
  }

  maxEntries(): number {
    return this.max;
  }
}
