import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { config } from "./config.ts";
import { requireApiKey } from "./auth.ts";
import { chatCompletions, limiter } from "./proxy.ts";
import { listModels, loadUpstreamModels } from "./models.ts";
import { errors } from "./errors.ts";
import { log } from "./log.ts";

const app = new Hono();

app.get("/health", (c) =>
  c.json({ ok: true, queueDepth: limiter.queueDepth, inUse: limiter.inUse }),
);

app.use("/v1/*", requireApiKey);

app.get("/v1/models", listModels);
app.post("/v1/chat/completions", chatCompletions);
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
    aliases: config.aliases,
  });
});
