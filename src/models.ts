import type { Context } from "hono";
import { config } from "./config.ts";
import { aliasEntries } from "./aliases.ts";
import { errors } from "./errors.ts";
import { log } from "./log.ts";

type ModelEntry = { id: string; object: "model"; created: number; owned_by: string };

let cachedUpstream: ModelEntry[] | null = null;

export async function loadUpstreamModels(): Promise<void> {
  try {
    const r = await fetch(`${config.nimBaseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.nimApiKey}` },
    });
    if (!r.ok) {
      log({ event: "models_fetch_failed", status: r.status });
      cachedUpstream = [];
      return;
    }
    const body = (await r.json()) as { data?: ModelEntry[] };
    cachedUpstream = Array.isArray(body.data) ? body.data : [];
  } catch (e) {
    log({ event: "models_fetch_error", error: (e as Error).message });
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
