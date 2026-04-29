export type TrafficSnapshot = {
  activeClients: number;
  lastClientStartedAt: string | null;
  lastClientFinishedAt: string | null;
  lastClientActivityAt: string | null;
  quietForMs: number | null;
};

export type ProbePauseState = {
  reason: "active_clients" | "recent_client_activity";
  since: string;
  activeClients: number;
  quietForMs: number | null;
  requiredQuietMs: number;
};

type QuietOptions = {
  quietMs: number;
  pollMs?: number;
  onPause?: (state: ProbePauseState) => void;
  onResume?: () => void;
};

export class TrafficMonitor {
  private activeClients = 0;
  private lastClientStartedAt = 0;
  private lastClientFinishedAt = 0;
  private lastClientActivityAt = 0;

  async track(handler: () => Response | Promise<Response>): Promise<Response> {
    const finish = this.startClient();
    let response: Response;
    try {
      response = await handler();
    } catch (e) {
      finish();
      throw e;
    }
    return this.finishWithResponse(response, finish);
  }

  snapshot(now = Date.now()): TrafficSnapshot {
    return {
      activeClients: this.activeClients,
      lastClientStartedAt: this.formatTime(this.lastClientStartedAt),
      lastClientFinishedAt: this.formatTime(this.lastClientFinishedAt),
      lastClientActivityAt: this.formatTime(this.lastClientActivityAt),
      quietForMs: this.lastClientActivityAt > 0 && this.activeClients === 0 ? now - this.lastClientActivityAt : null,
    };
  }

  async waitForQuiet(options: QuietOptions): Promise<void> {
    const pollMs = options.pollMs ?? 1_000;
    let paused = false;
    let pausedSince = "";

    while (true) {
      const now = Date.now();
      const quietForMs = this.lastClientActivityAt > 0 ? now - this.lastClientActivityAt : null;
      const hasActiveClients = this.activeClients > 0;
      const hasRecentActivity = quietForMs !== null && quietForMs < options.quietMs;

      if (!hasActiveClients && !hasRecentActivity) {
        if (paused) options.onResume?.();
        return;
      }

      if (!paused) {
        paused = true;
        pausedSince = new Date(now).toISOString();
      }
      options.onPause?.({
        reason: hasActiveClients ? "active_clients" : "recent_client_activity",
        since: pausedSince,
        activeClients: this.activeClients,
        quietForMs,
        requiredQuietMs: options.quietMs,
      });

      const waitMs = hasActiveClients
        ? pollMs
        : Math.min(pollMs, Math.max(50, options.quietMs - (quietForMs ?? 0)));
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  private startClient(): () => void {
    const now = Date.now();
    this.activeClients += 1;
    this.lastClientStartedAt = now;
    this.lastClientActivityAt = now;
    let finished = false;
    return () => {
      if (finished) return;
      finished = true;
      this.activeClients = Math.max(0, this.activeClients - 1);
      const finishedAt = Date.now();
      this.lastClientFinishedAt = finishedAt;
      this.lastClientActivityAt = finishedAt;
    };
  }

  private finishWithResponse(response: Response, finish: () => void): Response {
    if (!response.body) {
      finish();
      return response;
    }

    const body = response.body;
    const reader = body.getReader();
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      reader.releaseLock();
    };
    const tracked = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            finish();
            release();
            controller.close();
            return;
          }

          if (value) controller.enqueue(value);
        } catch (e) {
          finish();
          release();
          controller.error(e);
        }
      },
      async cancel(reason) {
        finish();
        await reader.cancel(reason).catch(() => {});
        release();
      },
    });

    return new Response(tracked, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  private formatTime(timestampMs: number): string | null {
    return timestampMs > 0 ? new Date(timestampMs).toISOString() : null;
  }
}
