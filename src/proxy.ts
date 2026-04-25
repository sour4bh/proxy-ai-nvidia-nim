import type { Context } from "hono";
import { z } from "zod";
import { config } from "./config.ts";
import { resolveModel } from "./aliases.ts";
import { Limiter, QueueTimeoutError, AbortedError } from "./limiter.ts";
import { errors, openaiError } from "./errors.ts";
import { log, reqId } from "./log.ts";

export const limiter = new Limiter(
  config.rateCapacity,
  config.rateWindowMs,
  config.maxQueueWaitMs,
);

const requestSchema = z
  .object({ model: z.string(), stream: z.boolean().optional() })
  .passthrough();

export async function chatCompletions(c: Context): Promise<Response> {
  const id = reqId();
  const start = Date.now();
  const signal = c.req.raw.signal;

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json(errors.invalidRequest("Body is not valid JSON"), 400);
  }
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json(errors.invalidRequest("Missing or invalid 'model'"), 400);
  }
  const requested = parsed.data.model;
  const resolved = resolveModel(requested);
  const stream = parsed.data.stream === true;

  const body = { ...(raw as Record<string, unknown>), model: resolved };

  const queueEnter = Date.now();
  try {
    await limiter.acquire(signal);
  } catch (e) {
    const totalMs = Date.now() - start;
    const queueWaitMs = Date.now() - queueEnter;
    if (e instanceof QueueTimeoutError) {
      log({
        reqId: id,
        path: "/v1/chat/completions",
        model: requested,
        resolvedModel: resolved,
        status: 429,
        queueWaitMs,
        totalMs,
        stream,
        reason: "queue_timeout",
      });
      const r = c.json(errors.queueTimeout(e.waitedMs), 429);
      r.headers.set("Retry-After", "5");
      r.headers.set("x-request-id", id);
      return r;
    }
    if (e instanceof AbortedError) {
      log({
        reqId: id,
        path: "/v1/chat/completions",
        status: 499,
        queueWaitMs,
        totalMs,
        stream,
        reason: "client_aborted_in_queue",
      });
      return new Response(JSON.stringify(errors.clientAborted()), {
        status: 499,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw e;
  }
  const queueWaitMs = Date.now() - queueEnter;

  let upstream: Response;
  const upstreamStart = Date.now();
  const timeoutSignal = AbortSignal.timeout(config.upstreamTimeoutMs);
  const fetchSignal = AbortSignal.any([signal, timeoutSignal]);
  try {
    upstream = await fetch(`${config.nimBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.nimApiKey}`,
        "Content-Type": "application/json",
        Accept: stream ? "text/event-stream" : "application/json",
      },
      body: JSON.stringify(body),
      signal: fetchSignal,
    });
  } catch (e) {
    const totalMs = Date.now() - start;
    const upstreamMs = Date.now() - upstreamStart;
    if (timeoutSignal.aborted) {
      log({
        reqId: id,
        path: "/v1/chat/completions",
        model: requested,
        resolvedModel: resolved,
        status: 504,
        queueWaitMs,
        upstreamMs,
        totalMs,
        stream,
        reason: "upstream_timeout",
      });
      const r = c.json(errors.upstreamTimeout(config.upstreamTimeoutMs), 504);
      r.headers.set("x-request-id", id);
      return r;
    }
    if (signal.aborted) {
      log({
        reqId: id,
        path: "/v1/chat/completions",
        status: 499,
        queueWaitMs,
        upstreamMs,
        totalMs,
        stream,
        reason: "client_aborted_upstream",
      });
      return new Response(JSON.stringify(errors.clientAborted()), {
        status: 499,
        headers: { "Content-Type": "application/json" },
      });
    }
    log({
      reqId: id,
      path: "/v1/chat/completions",
      model: requested,
      resolvedModel: resolved,
      status: 502,
      queueWaitMs,
      upstreamMs,
      totalMs,
      stream,
      error: (e as Error).message,
    });
    return c.json(errors.upstreamUnavailable((e as Error).message), 502);
  }

  if (upstream.status === 429) {
    handleUpstreamPause(upstream);
  }

  if (!stream) {
    const rawText = await upstream.text();
    const { body, contentType } = ensureOpenAIShape(rawText, upstream);
    const upstreamMs = Date.now() - upstreamStart;
    const totalMs = Date.now() - start;
    log({
      reqId: id,
      path: "/v1/chat/completions",
      model: requested,
      resolvedModel: resolved,
      status: upstream.status,
      queueDepth: limiter.queueDepth,
      queueWaitMs,
      upstreamMs,
      totalMs,
      stream: false,
      usage: extractUsage(body),
      upstream429: upstream.status === 429,
    });
    const r = new Response(body, { status: upstream.status });
    r.headers.set("Content-Type", contentType);
    if (upstream.status === 429) r.headers.set("Retry-After", retryAfter(upstream));
    r.headers.set("x-request-id", id);
    return r;
  }

  if (upstream.status !== 200 || !upstream.body) {
    const rawText = await upstream.text();
    const { body, contentType } = ensureOpenAIShape(rawText, upstream);
    const upstreamMs = Date.now() - upstreamStart;
    const totalMs = Date.now() - start;
    log({
      reqId: id,
      path: "/v1/chat/completions",
      model: requested,
      resolvedModel: resolved,
      status: upstream.status,
      queueWaitMs,
      upstreamMs,
      totalMs,
      stream: true,
      reason: "stream_request_rejected",
    });
    const r = new Response(body, { status: upstream.status });
    r.headers.set("Content-Type", contentType);
    if (upstream.status === 429) r.headers.set("Retry-After", retryAfter(upstream));
    r.headers.set("x-request-id", id);
    return r;
  }

  const wrapped = wrapStreamWithErrorFrame(upstream.body, id);
  const upstreamMs = Date.now() - upstreamStart;
  const totalMs = Date.now() - start;
  log({
    reqId: id,
    path: "/v1/chat/completions",
    model: requested,
    resolvedModel: resolved,
    status: 200,
    queueDepth: limiter.queueDepth,
    queueWaitMs,
    upstreamMs,
    totalMs,
    stream: true,
  });
  return new Response(wrapped, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "x-request-id": id,
    },
  });
}

function retryAfter(r: Response): string {
  const ra = r.headers.get("retry-after");
  if (ra && /^\d+$/.test(ra)) return ra;
  return "5";
}

function handleUpstreamPause(r: Response): void {
  const ra = r.headers.get("retry-after");
  const seconds = ra && /^\d+$/.test(ra) ? Number(ra) : 2;
  limiter.pauseUntil(Date.now() + seconds * 1000);
  log({ event: "upstream_429_pause", seconds });
}

function ensureOpenAIShape(
  rawText: string,
  upstream: Response,
): { body: string; contentType: string } {
  if (upstream.ok) return { body: rawText, contentType: "application/json" };
  try {
    const parsed = JSON.parse(rawText) as { error?: unknown };
    if (parsed && typeof parsed === "object" && "error" in parsed) {
      return { body: rawText, contentType: "application/json" };
    }
  } catch {
    // fall through
  }
  const wrapped = openaiError(
    rawText.trim().slice(0, 500) || `Upstream returned ${upstream.status}`,
    "upstream_error",
    `upstream_${upstream.status}`,
  );
  return { body: JSON.stringify(wrapped), contentType: "application/json" };
}

function extractUsage(body: string): unknown {
  try {
    const j = JSON.parse(body) as { usage?: unknown };
    return j.usage;
  } catch {
    return undefined;
  }
}

function wrapStreamWithErrorFrame(
  upstream: ReadableStream<Uint8Array>,
  id: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) controller.enqueue(value);
        }
      } catch (e) {
        const err = openaiError(
          `Upstream error mid-stream: ${(e as Error).message}`,
          "upstream_error",
          "stream_interrupted",
        );
        controller.enqueue(encoder.encode(`\ndata: ${JSON.stringify(err)}\n\ndata: [DONE]\n\n`));
        log({ event: "stream_interrupted", reqId: id, error: (e as Error).message });
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
    cancel() {
      upstream.cancel().catch(() => {});
    },
  });
}
