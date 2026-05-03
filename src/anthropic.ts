import type { Context } from "hono";
import { z } from "zod";
import { config } from "./config.ts";
import { resolveModel } from "./aliases.ts";
import { limiter } from "./proxy.ts";
import { QueueTimeoutError, AbortedError } from "./limiter.ts";
import { log, reqId } from "./log.ts";
import { appendTelemetry, instrument, type RequestInstrument } from "./telemetry.ts";

// --- Anthropic wire types ---

type TextBlock = { type: "text"; text: string };
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string | TextBlock[] };

type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | { type: string };

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
}

class InvalidAnthropicRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAnthropicRequestError";
  }
}

// --- Zod schema (permissive — validate only what we need) ---

const requestSchema = z
  .object({
    model: z.string(),
    messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.unknown() })),
    system: z.union([z.string(), z.array(z.unknown())]).optional(),
    max_tokens: z.number().optional(),
    stop_sequences: z.array(z.string()).optional(),
    stream: z.boolean().optional(),
    tools: z.array(z.unknown()).optional(),
    tool_choice: z.unknown().optional(),
    temperature: z.number().optional(),
    top_p: z.number().optional(),
  })
  .passthrough();

type AnthropicRequest = z.infer<typeof requestSchema>;

// --- OpenAI message types (internal) ---

interface OAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

// --- Request translation: Anthropic → OpenAI ---

function hasType(value: unknown): value is { type: string } {
  return Boolean(value && typeof value === "object" && typeof (value as { type?: unknown }).type === "string");
}

function isTextBlock(value: unknown): value is TextBlock {
  return hasType(value) && value.type === "text" && typeof (value as { text?: unknown }).text === "string";
}

function isToolUseBlock(value: unknown): value is ToolUseBlock {
  return (
    hasType(value) &&
    value.type === "tool_use" &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { name?: unknown }).name === "string"
  );
}

function isToolResultBlock(value: unknown): value is ToolResultBlock {
  return (
    hasType(value) &&
    value.type === "tool_result" &&
    typeof (value as { tool_use_id?: unknown }).tool_use_id === "string" &&
    (typeof (value as { content?: unknown }).content === "string" ||
      Array.isArray((value as { content?: unknown }).content))
  );
}

function normalizeMessages(messages: AnthropicRequest["messages"]): AnthropicMessage[] {
  return messages.map((message, index) => {
    const { content } = message;
    if (typeof content !== "string" && !Array.isArray(content)) {
      throw new InvalidAnthropicRequestError(
        `messages.${index}.content must be a string or an array of content blocks.`,
      );
    }
    return { role: message.role, content: content as string | ContentBlock[] };
  });
}

function extractSystem(system: AnthropicRequest["system"]): string | undefined {
  if (!system) return undefined;
  if (typeof system === "string") return system;
  return system
    .filter(isTextBlock)
    .map((b) => b.text!)
    .join("\n");
}

function translateMessages(messages: AnthropicMessage[], system?: string): OAIMessage[] {
  const result: OAIMessage[] = [];
  if (system) result.push({ role: "system", content: system });

  for (const { role, content } of messages) {
    if (typeof content === "string") {
      result.push({ role, content });
      continue;
    }

    if (role === "assistant") {
      const texts = content
        .filter(isTextBlock)
        .map((b) => b.text)
        .join("");
      const toolUses = content.filter(isToolUseBlock);
      const msg: OAIMessage = { role: "assistant", content: texts || null };
      if (toolUses.length > 0) {
        msg.tool_calls = toolUses.map((b) => ({
          id: b.id,
          type: "function" as const,
          function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) },
        }));
      }
      result.push(msg);
      continue;
    }

    // role === "user": tool_results → "tool" messages, then text → "user" message
    for (const b of content) {
      if (isToolResultBlock(b)) {
        const tr = b;
        const trContent =
          typeof tr.content === "string"
            ? tr.content
            : tr.content
                .filter(isTextBlock)
                .map((tb) => tb.text)
                .join("");
        result.push({ role: "tool", tool_call_id: tr.tool_use_id, content: trContent });
      }
    }
    const userText = content
      .filter(isTextBlock)
      .map((b) => b.text)
      .join("");
    if (userText.trim()) result.push({ role: "user", content: userText });
  }

  return result;
}

function translateTools(
  tools?: unknown[],
): { type: "function"; function: Record<string, unknown> }[] | undefined {
  if (!tools?.length) return undefined;
  return tools.map((t) => {
    const tool = t as AnthropicTool;
    return {
      type: "function" as const,
      function: {
        name: tool.name,
        ...(tool.description ? { description: tool.description } : {}),
        parameters: tool.input_schema,
      },
    };
  });
}

function translateToolChoice(tc: unknown): unknown {
  if (tc === "any") return "required";
  if (tc === "auto" || tc === "none") return tc;
  if (tc && typeof tc === "object") {
    const type = (tc as { type?: unknown }).type;
    if (type === "any") return "required";
    if (type === "auto" || type === "none") return type;
    if (type === "tool" && typeof (tc as { name?: unknown }).name === "string") {
      return { type: "function", function: { name: (tc as { name: string }).name } };
    }
  }
  return undefined;
}

function buildOAIRequest(body: AnthropicRequest, resolvedModel: string): Record<string, unknown> {
  const messages = translateMessages(
    normalizeMessages(body.messages),
    extractSystem(body.system),
  );
  const tools = translateTools(body.tools);
  const toolChoice = translateToolChoice(body.tool_choice);

  const req: Record<string, unknown> = {
    model: resolvedModel,
    messages,
    max_tokens: body.max_tokens ?? 8096,
    stream: body.stream ?? false,
  };
  if (body.stream === true) req.stream_options = { include_usage: true };
  if (body.temperature !== undefined) req.temperature = body.temperature;
  if (body.top_p !== undefined) req.top_p = body.top_p;
  if (body.stop_sequences !== undefined) req.stop = body.stop_sequences;
  if (tools) req.tools = tools;
  if (toolChoice !== undefined) req.tool_choice = toolChoice;
  return req;
}

// --- Response translation: OpenAI → Anthropic ---

function oaiFinishToStopReason(r: string | null): string {
  if (r === "tool_calls") return "tool_use";
  if (r === "length") return "max_tokens";
  return "end_turn";
}

function translateResponse(oai: Record<string, unknown>, requestedModel: string): Record<string, unknown> {
  type Choice = {
    message: {
      content: string | null;
      tool_calls?: { id: string; function: { name: string; arguments: string } }[];
    };
    finish_reason: string | null;
  };
  const choice = (oai.choices as Choice[])?.[0];
  if (!choice) throw new Error("No choices in upstream response");

  const content: Record<string, unknown>[] = [];
  if (choice.message.content) content.push({ type: "text", text: choice.message.content });
  for (const tc of choice.message.tool_calls ?? []) {
    let input: Record<string, unknown> = {};
    try { input = JSON.parse(tc.function.arguments) as Record<string, unknown>; } catch { /**/ }
    content.push({ type: "tool_use", id: tc.id, name: tc.function.name, input });
  }

  const usage = oai.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
  return {
    id: (oai.id as string) ?? `msg_${Date.now()}`,
    type: "message",
    role: "assistant",
    model: requestedModel,
    content,
    stop_reason: oaiFinishToStopReason(choice.finish_reason),
    stop_sequence: null,
    usage: { input_tokens: usage?.prompt_tokens ?? 0, output_tokens: usage?.completion_tokens ?? 0 },
  };
}

// --- Streaming translation: OpenAI SSE → Anthropic SSE ---

function translateStream(
  upstream: ReadableStream<Uint8Array>,
  requestedModel: string,
  msgId: string,
  streamMeta: {
    inst?: RequestInstrument;
    reqId: string;
    resolvedModel: string;
    queueWaitMs: number;
    start: number;
  },
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let canceled = false;
  let catchError = false;

  function ev(event: string, data: unknown): Uint8Array {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      reader = upstream.getReader();
      let buf = "";
      let started = false;
      let contentIdx = 0;
      let inTextBlock = false;
      // OAI tool-call index → our content block index
      const toolBlocks = new Map<number, { blockIdx: number }>();
      let finalStopReason = "end_turn";
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") continue;

            type Chunk = {
              id?: string;
              choices?: {
                delta?: {
                  content?: string | null;
                  tool_calls?: {
                    index: number;
                    id?: string;
                    function?: { name?: string; arguments?: string };
                  }[];
                };
                finish_reason?: string | null;
              }[];
              usage?: { prompt_tokens?: number; completion_tokens?: number };
            };
            let chunk: Chunk;
            try { chunk = JSON.parse(payload) as Chunk; } catch { continue; }

            if (typeof chunk.usage?.prompt_tokens === "number") {
              inputTokens = chunk.usage.prompt_tokens;
            }
            if (typeof chunk.usage?.completion_tokens === "number") {
              outputTokens = chunk.usage.completion_tokens;
            }

            const choice = chunk.choices?.[0];
            if (!choice) continue;
            const delta = choice.delta ?? {};

            if (!started) {
              started = true;
              controller.enqueue(ev("message_start", {
                type: "message_start",
                message: {
                  id: msgId,
                  type: "message",
                  role: "assistant",
                  content: [],
                  model: requestedModel,
                  stop_reason: null,
                  stop_sequence: null,
                  usage: { input_tokens: 0, output_tokens: 0 },
                },
              }));
              controller.enqueue(ev("ping", { type: "ping" }));
            }

            // Text content
            if (delta.content !== null && delta.content !== undefined) {
              if (!inTextBlock) {
                controller.enqueue(ev("content_block_start", {
                  type: "content_block_start",
                  index: contentIdx,
                  content_block: { type: "text", text: "" },
                }));
                inTextBlock = true;
              }
              if (delta.content) {
                controller.enqueue(ev("content_block_delta", {
                  type: "content_block_delta",
                  index: contentIdx,
                  delta: { type: "text_delta", text: delta.content },
                }));
              }
            }

            // Tool calls
            for (const tc of delta.tool_calls ?? []) {
              const oaiIdx = tc.index;
              if (!toolBlocks.has(oaiIdx)) {
                if (inTextBlock) {
                  controller.enqueue(ev("content_block_stop", { type: "content_block_stop", index: contentIdx }));
                  contentIdx++;
                  inTextBlock = false;
                }
                toolBlocks.set(oaiIdx, { blockIdx: contentIdx });
                controller.enqueue(ev("content_block_start", {
                  type: "content_block_start",
                  index: contentIdx,
                  content_block: {
                    type: "tool_use",
                    id: tc.id ?? `toolu_${msgId}_${oaiIdx}`,
                    name: tc.function?.name ?? "",
                    input: {},
                  },
                }));
                contentIdx++;
              }
              if (tc.function?.arguments) {
                controller.enqueue(ev("content_block_delta", {
                  type: "content_block_delta",
                  index: toolBlocks.get(oaiIdx)!.blockIdx,
                  delta: { type: "input_json_delta", partial_json: tc.function.arguments },
                }));
              }
            }

            if (choice.finish_reason) {
              finalStopReason = oaiFinishToStopReason(choice.finish_reason);
            }
          }
        }

        // Close open blocks
        if (inTextBlock) {
          controller.enqueue(ev("content_block_stop", { type: "content_block_stop", index: contentIdx }));
        }
        for (const { blockIdx } of [...toolBlocks.values()].sort((a, b) => a.blockIdx - b.blockIdx)) {
          controller.enqueue(ev("content_block_stop", { type: "content_block_stop", index: blockIdx }));
        }

        controller.enqueue(ev("message_delta", {
          type: "message_delta",
          delta: { stop_reason: finalStopReason, stop_sequence: null },
          usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        }));
        controller.enqueue(ev("message_stop", { type: "message_stop" }));
      } catch (e) {
        catchError = true;
        if (!canceled) {
          appendTelemetry(streamMeta.inst, {
            reqId: streamMeta.reqId,
            path: "/v1/messages",
            requestedModel,
            resolvedModel: streamMeta.resolvedModel,
            stream: true,
            queueWaitMs: streamMeta.queueWaitMs,
            upstreamStatus: 200,
            totalMs: Date.now() - streamMeta.start,
            phase: "anthropic_stream_error",
          });
          log({ event: "anthropic_stream_error", error: (e as Error).message });
        }
      } finally {
        if (streamMeta.inst && !canceled && !catchError) {
          appendTelemetry(streamMeta.inst, {
            reqId: streamMeta.reqId,
            path: "/v1/messages",
            requestedModel,
            resolvedModel: streamMeta.resolvedModel,
            stream: true,
            queueWaitMs: streamMeta.queueWaitMs,
            upstreamStatus: 200,
            totalMs: Date.now() - streamMeta.start,
            phase: "stream_done",
          });
        }
        if (!canceled) controller.close();
        reader?.releaseLock();
      }
    },
    cancel(reason) {
      canceled = true;
      appendTelemetry(streamMeta.inst, {
        reqId: streamMeta.reqId,
        path: "/v1/messages",
        requestedModel,
        resolvedModel: streamMeta.resolvedModel,
        stream: true,
        queueWaitMs: streamMeta.queueWaitMs,
        upstreamStatus: 200,
        totalMs: Date.now() - streamMeta.start,
        phase: "stream_canceled",
      });
      return reader?.cancel(reason) ?? upstream.cancel(reason);
    },
  });
}

// --- Error helpers ---

function err(type: string, message: string, status: number, headers?: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ type: "error", error: { type, message } }),
    { status, headers: { "Content-Type": "application/json", ...headers } },
  );
}

function upstreamErrToAnthropic(rawText: string, upstream: Response): Response {
  let message = `Upstream returned ${upstream.status}`;
  try {
    const j = JSON.parse(rawText) as { error?: { message?: string } };
    if (j.error?.message) message = j.error.message;
  } catch { /**/ }
  return err("api_error", message, upstream.status);
}

// --- Handler ---

export async function messages(c: Context): Promise<Response> {
  const id = reqId();
  const start = Date.now();
  const signal = c.req.raw.signal;
  const inst = instrument(c);

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return err("invalid_request_error", "Body is not valid JSON", 400);
  }
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return err("invalid_request_error", "Missing or invalid 'model' or 'messages'", 400);
  }
  const body = parsed.data;
  const requested = body.model;
  const resolved = resolveModel(requested);
  const isStream = body.stream === true;

  let oaiBody: Record<string, unknown>;
  try {
    oaiBody = buildOAIRequest(body, resolved);
  } catch (e) {
    if (e instanceof InvalidAnthropicRequestError) {
      return err("invalid_request_error", e.message, 400);
    }
    throw e;
  }

  const queueEnter = Date.now();
  try {
    await limiter.acquire(signal);
  } catch (e) {
    const totalMs = Date.now() - start;
    const queueWaitMs = Date.now() - queueEnter;
    if (e instanceof QueueTimeoutError) {
      log({ reqId: id, path: "/v1/messages", model: requested, status: 429, queueWaitMs, totalMs, reason: "queue_timeout" });
      appendTelemetry(inst, {
        reqId: id,
        path: "/v1/messages",
        requestedModel: requested,
        resolvedModel: resolved,
        stream: isStream,
        queueWaitMs,
        upstreamStatus: 429,
        totalMs,
        phase: "queue_timeout",
      });
      return err("rate_limit_error", `Request timed out in proxy queue after ${e.waitedMs}ms.`, 429, { "Retry-After": "5", "x-request-id": id });
    }
    if (e instanceof AbortedError) {
      log({ reqId: id, path: "/v1/messages", status: 499, queueWaitMs, totalMs, reason: "client_aborted_in_queue" });
      appendTelemetry(inst, {
        reqId: id,
        path: "/v1/messages",
        requestedModel: requested,
        resolvedModel: resolved,
        stream: isStream,
        queueWaitMs,
        upstreamStatus: 499,
        totalMs,
        phase: "client_aborted_in_queue",
      });
      return new Response(JSON.stringify({ type: "error", error: { type: "request_canceled", message: "Request aborted by client." } }), {
        status: 499,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw e;
  }
  const queueWaitMs = Date.now() - queueEnter;

  const timeoutSignal = AbortSignal.timeout(config.upstreamTimeoutMs);
  const fetchSignal = AbortSignal.any([signal, timeoutSignal]);
  let upstream: Response;
  const upstreamStart = Date.now();
  try {
    upstream = await fetch(`${config.nimBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.nimApiKey}`,
        "Content-Type": "application/json",
        Accept: isStream ? "text/event-stream" : "application/json",
      },
      body: JSON.stringify(oaiBody),
      signal: fetchSignal,
    });
  } catch (e) {
    const totalMs = Date.now() - start;
    const upstreamMs = Date.now() - upstreamStart;
    if (timeoutSignal.aborted) {
      log({ reqId: id, path: "/v1/messages", model: requested, status: 504, queueWaitMs, upstreamMs, totalMs, reason: "upstream_timeout" });
      appendTelemetry(inst, {
        reqId: id,
        path: "/v1/messages",
        requestedModel: requested,
        resolvedModel: resolved,
        stream: isStream,
        queueWaitMs,
        upstreamStatus: 504,
        totalMs,
        phase: "upstream_timeout",
      });
      return err("overloaded_error", `Upstream did not respond within ${config.upstreamTimeoutMs}ms.`, 504, { "x-request-id": id });
    }
    if (signal.aborted) {
      log({ reqId: id, path: "/v1/messages", status: 499, queueWaitMs, upstreamMs, totalMs, reason: "client_aborted_upstream" });
      appendTelemetry(inst, {
        reqId: id,
        path: "/v1/messages",
        requestedModel: requested,
        resolvedModel: resolved,
        stream: isStream,
        queueWaitMs,
        upstreamStatus: 499,
        totalMs,
        phase: "client_aborted_upstream",
      });
      return new Response(JSON.stringify({ type: "error", error: { type: "request_canceled", message: "Request aborted by client." } }), {
        status: 499,
        headers: { "Content-Type": "application/json" },
      });
    }
    log({ reqId: id, path: "/v1/messages", model: requested, status: 502, queueWaitMs, upstreamMs, totalMs, error: (e as Error).message });
    appendTelemetry(inst, {
      reqId: id,
      path: "/v1/messages",
      requestedModel: requested,
      resolvedModel: resolved,
      stream: isStream,
      queueWaitMs,
      upstreamStatus: 502,
      totalMs,
      phase: "upstream_fetch_error",
    });
    return err("api_error", (e as Error).message, 502, { "x-request-id": id });
  }

  if (upstream.status === 429) {
    const ra = upstream.headers.get("retry-after");
    const seconds = ra && /^\d+$/.test(ra) ? Number(ra) : 2;
    limiter.pauseUntil(Date.now() + seconds * 1000);
    log({ event: "upstream_429_pause", seconds });
  }

  const upstreamMs = Date.now() - upstreamStart;
  const totalMs = Date.now() - start;

  if (!isStream) {
    const rawText = await upstream.text();
    if (!upstream.ok) {
      log({ reqId: id, path: "/v1/messages", model: requested, resolvedModel: resolved, status: upstream.status, queueWaitMs, upstreamMs, totalMs });
      appendTelemetry(inst, {
        reqId: id,
        path: "/v1/messages",
        requestedModel: requested,
        resolvedModel: resolved,
        stream: false,
        queueWaitMs,
        upstreamStatus: upstream.status,
        totalMs,
        phase: "upstream_error",
      });
      const r = upstreamErrToAnthropic(rawText, upstream);
      if (upstream.status === 429) r.headers.set("Retry-After", upstream.headers.get("retry-after") ?? "5");
      r.headers.set("x-request-id", id);
      return r;
    }
    try {
      const oai = JSON.parse(rawText) as Record<string, unknown>;
      const anthropicResp = translateResponse(oai, requested);
      log({ reqId: id, path: "/v1/messages", model: requested, resolvedModel: resolved, status: 200, queueWaitMs, upstreamMs, totalMs, stream: false });
      appendTelemetry(inst, {
        reqId: id,
        path: "/v1/messages",
        requestedModel: requested,
        resolvedModel: resolved,
        stream: false,
        queueWaitMs,
        upstreamStatus: 200,
        totalMs,
        phase: "completed",
      });
      const r = new Response(JSON.stringify(anthropicResp), { status: 200, headers: { "Content-Type": "application/json", "x-request-id": id } });
      return r;
    } catch (e) {
      log({ reqId: id, path: "/v1/messages", model: requested, status: 502, error: (e as Error).message });
      appendTelemetry(inst, {
        reqId: id,
        path: "/v1/messages",
        requestedModel: requested,
        resolvedModel: resolved,
        stream: false,
        queueWaitMs,
        upstreamStatus: 502,
        totalMs: Date.now() - start,
        phase: "parse_error",
      });
      return err("api_error", `Failed to parse upstream response: ${(e as Error).message}`, 502, { "x-request-id": id });
    }
  }

  if (upstream.status !== 200 || !upstream.body) {
    const rawText = await upstream.text();
    log({ reqId: id, path: "/v1/messages", model: requested, resolvedModel: resolved, status: upstream.status, queueWaitMs, upstreamMs, totalMs, stream: true, reason: "stream_request_rejected" });
    appendTelemetry(inst, {
      reqId: id,
      path: "/v1/messages",
      requestedModel: requested,
      resolvedModel: resolved,
      stream: true,
      queueWaitMs,
      upstreamStatus: upstream.status,
      totalMs,
      phase: "stream_request_rejected",
    });
    const r = upstreamErrToAnthropic(rawText, upstream);
    if (upstream.status === 429) r.headers.set("Retry-After", upstream.headers.get("retry-after") ?? "5");
    r.headers.set("x-request-id", id);
    return r;
  }

  log({ reqId: id, path: "/v1/messages", model: requested, resolvedModel: resolved, status: 200, queueWaitMs, upstreamMs, totalMs, stream: true });
  appendTelemetry(inst, {
    reqId: id,
    path: "/v1/messages",
    requestedModel: requested,
    resolvedModel: resolved,
    stream: true,
    queueWaitMs,
    upstreamStatus: 200,
    totalMs: upstreamMs,
    phase: "stream_open",
  });
  const msgId = `msg_${id}`;
  return new Response(translateStream(upstream.body, requested, msgId, { inst, reqId: id, resolvedModel: resolved, queueWaitMs, start }), {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "x-request-id": id,
    },
  });
}
