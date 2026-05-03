import type { Hono } from "hono";
import { probePage } from "./page.ts";
import type { ProbeController } from "./controller.ts";
import { aliasEntries, updateAliases } from "../aliases.ts";
import { config } from "../config.ts";
import { getUpstreamModelsSnapshot, loadUpstreamModels } from "../models.ts";
import type { TrafficSnapshot } from "../traffic.ts";
import type { LimiterSnapshot } from "../limiter.ts";
import type { TelemetryStore } from "../telemetry.ts";
import { buildProbeCatalog } from "./catalog.ts";
import { loadModelSeen, mergeCatalogSnapshot, saveModelSeen } from "./model-seen.ts";
import type { ProbeHistory } from "./history.ts";

function isAliasMap(input: unknown): input is Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  return Object.entries(input).every(
    ([key, value]) => key.trim().length > 0 && typeof value === "string" && value.trim().length > 0,
  );
}

export type ProbeRoutesMount = {
  controller: ProbeController;
  traffic: () => TrafficSnapshot;
  rateLimit: () => LimiterSnapshot;
  telemetryStore: TelemetryStore;
  history: ProbeHistory;
};

export function mountProbeRoutes(app: Hono, deps: ProbeRoutesMount): void {
  const { controller, traffic, rateLimit, telemetryStore, history } = deps;

  app.get("/probe", (c) =>
    c.html(
      probePage({
        proxyPublicUrl: config.proxyPublicUrl,
        listenNonLoopback: !config.isLoopbackHost,
      }),
    ),
  );

  app.get("/probe/state", async (c) => c.json(await controller.state()));

  app.get("/probe/stream", (c) => {
    const signal = c.req.raw.signal;
    const stream = new ReadableStream<Uint8Array>({
      start(controllerStream) {
        const enc = new TextEncoder();
        const send = () => {
          if (signal.aborted) return;
          const payload = {
            traffic: traffic(),
            rateLimit: rateLimit(),
            telemetry: telemetryStore.recent(25),
          };
          try {
            controllerStream.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch {
            /* consumer gone */
          }
        };
        send();
        const id = setInterval(send, 1000);
        const onAbort = () => {
          clearInterval(id);
          try {
            controllerStream.close();
          } catch {
            /* */
          }
        };
        signal.addEventListener("abort", onAbort, { once: true });
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  app.get("/probe/catalog", async (c) => {
    const cat = await buildProbeCatalog(history, config.probeHistoryDir, Date.now());
    if (!cat.ok) return c.json({ error: cat.error }, 502);
    return c.json(cat);
  });

  app.post("/probe/catalog/refresh", async (c) => {
    await loadUpstreamModels();
    const snap = getUpstreamModelsSnapshot();
    if (!snap) return c.json({ error: "catalog_unavailable" }, 502);
    const dir = config.probeHistoryDir;
    const prev = await loadModelSeen(dir);
    const merged = mergeCatalogSnapshot(
      prev,
      snap.map((m) => m.id),
      new Date().toISOString(),
    );
    await saveModelSeen(dir, merged);
    const cat = await buildProbeCatalog(history, dir, Date.now());
    if (!cat.ok) return c.json({ error: cat.error }, 502);
    return c.json({ refreshed: true, ...cat });
  });

  app.get("/probe/aliases", (c) => c.json({ aliases: aliasEntries() }));

  app.put("/probe/aliases", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Body must be valid JSON" }, 400);
    }
    const aliases = (body as { aliases?: unknown }).aliases;
    if (!isAliasMap(aliases)) {
      return c.json({ error: "aliases must be an object of non-empty key/value strings" }, 400);
    }
    updateAliases(aliases);
    return c.json({ updated: true, aliases: aliasEntries() });
  });

  app.post("/probe/run", (c) => {
    const result = controller.triggerManual();
    if (!result.accepted) {
      return c.json({ error: "probe already running", run: result.run }, 409);
    }
    return c.json({ accepted: true, run: result.run }, 202);
  });
}
