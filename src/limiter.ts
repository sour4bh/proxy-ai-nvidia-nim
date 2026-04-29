export class QueueTimeoutError extends Error {
  constructor(public waitedMs: number) {
    super(`queue timeout after ${waitedMs}ms`);
    this.name = "QueueTimeoutError";
  }
}

export class AbortedError extends Error {
  constructor() {
    super("aborted");
    this.name = "AbortedError";
  }
}

type Waiter = {
  resolve: () => void;
  reject: (err: Error) => void;
  enqueuedAt: number;
  timeoutId: NodeJS.Timeout;
  signal: AbortSignal;
  abortHandler: () => void;
};

export type LimiterWindowEntry = {
  admittedAt: string;
  expiresAt: string;
  ageMs: number;
  remainingMs: number;
};

export type LimiterSnapshot = {
  sampledAt: string;
  capacity: number;
  windowMs: number;
  maxQueueWaitMs: number;
  inUse: number;
  remaining: number;
  queueDepth: number;
  usageRatio: number;
  pausedUntil: string | null;
  pauseRemainingMs: number | null;
  oldestAdmittedAt: string | null;
  newestAdmittedAt: string | null;
  nextAvailableAt: string | null;
  nextAvailableInMs: number | null;
  resetAt: string | null;
  window: LimiterWindowEntry[];
};

export class Limiter {
  private timestamps: number[] = [];
  private queue: Waiter[] = [];
  private pausedUntil = 0;
  private wakeTimer: NodeJS.Timeout | null = null;

  constructor(
    private capacity: number,
    private windowMs: number,
    private maxQueueWaitMs: number,
  ) {}

  get queueDepth(): number {
    return this.queue.length;
  }

  get inUse(): number {
    this.prune();
    return this.timestamps.length;
  }

  snapshot(now = Date.now()): LimiterSnapshot {
    this.prune(now);
    const window = this.timestamps.map((admittedAt) => {
      const expiresAt = admittedAt + this.windowMs;
      return {
        admittedAt: new Date(admittedAt).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        ageMs: Math.max(0, now - admittedAt),
        remainingMs: Math.max(0, expiresAt - now),
      };
    });
    const atCapacity = this.capacity <= 0 || this.timestamps.length >= this.capacity;
    const nextByCapacity = atCapacity && this.timestamps[0] ? this.timestamps[0] + this.windowMs : now;
    const nextAvailableMs = Math.max(now, this.pausedUntil, nextByCapacity);
    const blocked = nextAvailableMs > now || atCapacity;

    return {
      sampledAt: new Date(now).toISOString(),
      capacity: this.capacity,
      windowMs: this.windowMs,
      maxQueueWaitMs: this.maxQueueWaitMs,
      inUse: this.timestamps.length,
      remaining: Math.max(0, this.capacity - this.timestamps.length),
      queueDepth: this.queue.length,
      usageRatio: this.capacity > 0 ? this.timestamps.length / this.capacity : 0,
      pausedUntil: this.pausedUntil > now ? new Date(this.pausedUntil).toISOString() : null,
      pauseRemainingMs: this.pausedUntil > now ? this.pausedUntil - now : null,
      oldestAdmittedAt: this.timestamps[0] ? new Date(this.timestamps[0]).toISOString() : null,
      newestAdmittedAt: this.timestamps.at(-1) ? new Date(this.timestamps.at(-1)!).toISOString() : null,
      nextAvailableAt: blocked ? new Date(nextAvailableMs).toISOString() : new Date(now).toISOString(),
      nextAvailableInMs: blocked ? nextAvailableMs - now : 0,
      resetAt: this.timestamps.at(-1) ? new Date(this.timestamps.at(-1)! + this.windowMs).toISOString() : null,
      window,
    };
  }

  acquire(signal: AbortSignal): Promise<void> {
    if (signal.aborted) return Promise.reject(new AbortedError());
    this.prune();
    if (this.canAdmitNow()) {
      this.timestamps.push(Date.now());
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const w = {
        enqueuedAt: Date.now(),
        signal,
      } as Waiter;

      const cleanup = () => {
        clearTimeout(w.timeoutId);
        signal.removeEventListener("abort", w.abortHandler);
        this.removeWaiter(w);
      };

      w.resolve = () => {
        cleanup();
        resolve();
      };
      w.reject = (err) => {
        cleanup();
        reject(err);
      };
      w.timeoutId = setTimeout(() => {
        w.reject(new QueueTimeoutError(Date.now() - w.enqueuedAt));
      }, this.maxQueueWaitMs);
      w.abortHandler = () => {
        w.reject(new AbortedError());
      };
      signal.addEventListener("abort", w.abortHandler);

      this.queue.push(w);
      this.scheduleWake();
    });
  }

  pauseUntil(timestampMs: number): void {
    if (timestampMs > this.pausedUntil) this.pausedUntil = timestampMs;
    this.scheduleWake();
  }

  private prune(now = Date.now()): void {
    const cutoff = now - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0]! < cutoff) {
      this.timestamps.shift();
    }
  }

  private canAdmitNow(): boolean {
    return Date.now() >= this.pausedUntil && this.timestamps.length < this.capacity;
  }

  private removeWaiter(w: Waiter): void {
    const i = this.queue.indexOf(w);
    if (i >= 0) this.queue.splice(i, 1);
  }

  private scheduleWake(): void {
    if (this.wakeTimer) clearTimeout(this.wakeTimer);
    this.wakeTimer = null;
    if (this.queue.length === 0) return;

    this.prune();
    const now = Date.now();
    let waitMs: number;
    if (this.timestamps.length >= this.capacity) {
      waitMs = this.timestamps[0]! + this.windowMs - now;
    } else if (this.pausedUntil > now) {
      waitMs = this.pausedUntil - now;
    } else {
      waitMs = 0;
    }
    this.wakeTimer = setTimeout(() => {
      this.wakeTimer = null;
      this.drain();
    }, Math.max(0, waitMs) + 1);
  }

  private drain(): void {
    this.prune();
    while (this.queue.length > 0 && this.canAdmitNow()) {
      const w = this.queue.shift()!;
      this.timestamps.push(Date.now());
      w.resolve();
    }
    if (this.queue.length > 0) this.scheduleWake();
  }
}
