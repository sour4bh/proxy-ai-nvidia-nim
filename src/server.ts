import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { config } from "./config.ts";
import { chatCompletions, limiter } from "./proxy.ts";
import { messages } from "./anthropic.ts";
import { listModels, loadUpstreamModels } from "./models.ts";
import { aliasEntries } from "./aliases.ts";
import { errors } from "./errors.ts";
import { log } from "./log.ts";
import { ProbeHistory } from "./probe/history.ts";
import { ProbeController } from "./probe/controller.ts";
import { mountProbeRoutes } from "./probe/routes.ts";
import { TrafficMonitor } from "./traffic.ts";

const app = new Hono();
const traffic = new TrafficMonitor();
const probeHistory = new ProbeHistory(config.probeHistoryDir, config.probeHistoryLimit);
const probeController = new ProbeController({
  history: probeHistory,
  nimBaseUrl: config.nimBaseUrl,
  nimApiKey: config.nimApiKey,
  timeoutMs: config.probeTimeoutMs,
  concurrency: config.probeConcurrency,
  intervalMs: config.probeIntervalMs,
  historyLimit: config.probeHistoryLimit,
  historyDir: config.probeHistoryDir,
  clientQuietMs: config.probeClientQuietMs,
  acquire: limiter.acquire.bind(limiter),
  waitForClientQuiet: (handlers) =>
    traffic.waitForQuiet({
      quietMs: config.probeClientQuietMs,
      onPause: handlers.onPause,
      onResume: handlers.onResume,
    }),
  traffic: () => traffic.snapshot(),
  rateLimit: () => limiter.snapshot(),
  aliases: aliasEntries,
  log,
});

app.get("/health", (c) =>
  c.json({
    ok: true,
    queueDepth: limiter.queueDepth,
    inUse: limiter.inUse,
    rateLimit: limiter.snapshot(),
    traffic: traffic.snapshot(),
  }),
);

mountProbeRoutes(app, probeController);

app.get("/v1/models", listModels);
app.post("/v1/chat/completions", (c) => traffic.track(() => chatCompletions(c)));
app.post("/v1/messages", (c) => traffic.track(() => messages(c)));
app.post("/v1/embeddings", (c) => c.json(errors.notImplemented("/v1/embeddings"), 501));
app.post("/v1/completions", (c) => c.json(errors.notImplemented("/v1/completions"), 501));

app.notFound((c) => c.json(errors.notFound(c.req.path), 404));

await loadUpstreamModels();

serve({ fetch: app.fetch, hostname: config.host, port: config.port }, (info) => {
  log({
    event: "boot",
    host: info.address,
    port: info.port,
    rateCapacity: config.rateCapacity,
    rateWindowMs: config.rateWindowMs,
    maxQueueWaitMs: config.maxQueueWaitMs,
    upstreamTimeoutMs: config.upstreamTimeoutMs,
    aliases: Object.fromEntries(aliasEntries().map((entry) => [entry.id, entry.resolved])),
  });
  probeController.startScheduler();
});
