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

  private prune(): void {
    const cutoff = Date.now() - this.windowMs;
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
