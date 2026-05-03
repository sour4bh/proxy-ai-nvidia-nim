import type { Context } from "hono";
import { config } from "./config.ts";
import { aliasEntries } from "./aliases.ts";
import { errors } from "./errors.ts";
import { log } from "./log.ts";

export type ModelEntry = { id: string; object: "model"; created: number; owned_by: string };

let cachedUpstream: ModelEntry[] | null = null;

export function getUpstreamModelsSnapshot(): readonly ModelEntry[] | null {
  if (cachedUpstream === null) return null;
  return cachedUpstream;
}

type LoadUpstreamModelsOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export async function loadUpstreamModels(options: LoadUpstreamModelsOptions = {}): Promise<void> {
  const fetcher = options.fetchImpl ?? fetch;
  const signal = AbortSignal.timeout(options.timeoutMs ?? 30_000);
  try {
    const r = await fetcher(`${config.nimBaseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.nimApiKey}` },
      signal,
    });
    if (!r.ok) {
      log({ event: "models_fetch_failed", status: r.status });
      cachedUpstream = [];
      return;
    }
    const body = (await r.json()) as { data?: ModelEntry[] };
    cachedUpstream = Array.isArray(body.data) ? body.data : [];
  } catch (e) {
    log({
      event: "models_fetch_error",
      error: signal.aborted ? `timed out after ${options.timeoutMs ?? 30_000}ms` : (e as Error).message,
    });
    cachedUpstream = [];
  }
}

export function listModels(c: Context): Response {
  if (cachedUpstream === null) {
    return c.json(errors.upstreamUnavailable("Upstream model list not loaded"), 502);
  }
  const now = Math.floor(Date.now() / 1000);
  const aliasModels: ModelEntry[] = aliasEntries().map(({ id }) => ({
    id,
    object: "model",
    created: now,
    owned_by: "proxyai-alias",
  }));
  return c.json({ object: "list", data: [...aliasModels, ...cachedUpstream] });
}
