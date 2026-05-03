/**
 * Minimal OpenAI Responses API adapter for Codex CLI (wire_api = responses).
 * Maps /v1/responses → NIM /v1/chat/completions and translates streaming/non-streaming bodies.
 */
import type { Context } from "hono";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { resolveModel } from "./aliases.ts";
import { errors } from "./errors.ts";
import { log, reqId } from "./log.ts";
import { responsesInputToMessages, flattenOpenAiContent } from "./responses-input.ts";
import { instrument } from "./telemetry.ts";
import { upstreamOpenAIChatCompletion } from "./proxy.ts";

const responsesSchema = z
  .object({
    model: z.string(),
    input: z.unknown().optional(),
    stream: z.boolean().optional(),
    instructions: z.union([z.string(), z.null()]).optional(),
    max_output_tokens: z.number().optional(),
    temperature: z.number().optional(),
  })
  .passthrough();

function newRespId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function sseEvent(event: string, data: unknown): Uint8Array {
  const enc = new TextEncoder();
  return enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function transformChatSseToResponsesSse(
  upstream: ReadableStream<Uint8Array>,
  meta: {
    respId: string;
    msgId: string;
    model: string;
    instructions: string | null;
  },
): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const decoder = new TextDecoder();
  let buf = "";
  let fullText = "";
  let usage: Record<string, unknown> | null = null;
  const { respId, msgId, model, instructions } = meta;

  const createdShell = {
    id: respId,
    object: "response",
    created_at: Math.floor(Date.now() / 1000),
    status: "in_progress",
    error: null,
    incomplete_details: null,
    instructions: instructions ?? null,
    max_output_tokens: null,
    model,
    output: [],
    parallel_tool_calls: true,
    previous_response_id: null,
    reasoning: { effort: null, summary: null },
    store: true,
    temperature: 1,
    text: { format: { type: "text" } },
    tool_choice: "auto",
    tools: [],
    top_p: 1,
    truncation: "disabled",
    usage: null,
    user: null,
    metadata: {},
  };

  return new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: unknown) => controller.enqueue(sseEvent(event, data));
      try {
        emit("response.created", { type: "response.created", response: { ...createdShell } });
        emit("response.in_progress", { type: "response.in_progress", response: { ...createdShell } });
        emit("response.output_item.added", {
          type: "response.output_item.added",
          output_index: 0,
          item: {
            id: msgId,
            type: "message",
            status: "in_progress",
            role: "assistant",
            content: [],
          },
        });
        emit("response.content_part.added", {
          type: "response.content_part.added",
          item_id: msgId,
          output_index: 0,
          content_index: 0,
          part: { type: "output_text", text: "", annotations: [] },
        });

        const reader = upstream.getReader();
        const handleDataPayload = (payload: string) => {
          if (payload === "[DONE]") return;
          let j: Record<string, unknown>;
          try {
            j = JSON.parse(payload) as Record<string, unknown>;
          } catch {
            return;
          }
          if (j.usage && typeof j.usage === "object") {
            usage = j.usage as Record<string, unknown>;
          }
          const choices = j.choices as unknown;
          if (!Array.isArray(choices) || !choices[0]) return;
          const c0 = choices[0] as Record<string, unknown>;
          const delta = c0.delta as Record<string, unknown> | undefined;
          const piece = typeof delta?.content === "string" ? delta.content : "";
          if (piece) {
            fullText += piece;
            emit("response.output_text.delta", {
              type: "response.output_text.delta",
              item_id: msgId,
              output_index: 0,
              content_index: 0,
              delta: piece,
            });
          }
        };

        const flushLine = (line: string) => {
          const t = line.trim();
          if (!t || t.startsWith(":")) return;
          if (!t.startsWith("data:")) return;
          handleDataPayload(t.slice(5).trim());
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;
            buf += decoder.decode(value, { stream: true });
            let idx: number;
            while ((idx = buf.indexOf("\n")) >= 0) {
              const line = buf.slice(0, idx);
              buf = buf.slice(idx + 1);
              flushLine(line);
            }
          }
          buf += decoder.decode();
          for (const line of buf.split("\n")) flushLine(line);
        } finally {
          reader.releaseLock();
        }

        emit("response.output_text.done", {
          type: "response.output_text.done",
          item_id: msgId,
          output_index: 0,
          content_index: 0,
          text: fullText,
        });
        emit("response.content_part.done", {
          type: "response.content_part.done",
          item_id: msgId,
          output_index: 0,
          content_index: 0,
          part: { type: "output_text", text: fullText, annotations: [] },
        });
        emit("response.output_item.done", {
          type: "response.output_item.done",
          output_index: 0,
          item: {
            id: msgId,
            type: "message",
            status: "completed",
            role: "assistant",
            content: [{ type: "output_text", text: fullText, annotations: [] }],
          },
        });

        const pt = usage?.prompt_tokens;
        const ct = usage?.completion_tokens;
        const it = typeof pt === "number" ? pt : 0;
        const ot = typeof ct === "number" ? ct : 0;
        const completed = {
          ...createdShell,
          status: "completed",
          output: [
            {
              id: msgId,
              type: "message",
              status: "completed",
              role: "assistant",
              content: [{ type: "output_text", text: fullText, annotations: [] }],
            },
          ],
          usage: {
            input_tokens: it,
            output_tokens: ot,
            output_tokens_details: { reasoning_tokens: 0 },
            total_tokens: it + ot,
          },
        };
        emit("response.completed", { type: "response.completed", response: completed });
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
      } catch (e) {
        log({ event: "responses_stream_error", error: (e as Error).message });
        controller.enqueue(
          sseEvent("error", {
            type: "error",
            error: { message: (e as Error).message, type: "proxy_error" },
          }),
        );
      } finally {
        controller.close();
      }
    },
    cancel(reason) {
      return upstream.cancel(reason);
    },
  });
}

function assistantTextFromChatJson(raw: string): { text: string; usage: Record<string, unknown> | null } {
  try {
    const j = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: unknown } }>;
      usage?: Record<string, unknown>;
    };
    const content = j.choices?.[0]?.message?.content;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? flattenOpenAiContent(content)
          : "";
    return { text, usage: j.usage ?? null };
  } catch {
    return { text: "", usage: null };
  }
}

export async function openaiResponses(c: Context): Promise<Response> {
  const id = reqId();
  const start = Date.now();
  const inst = instrument(c);

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json(errors.invalidRequest("Body is not valid JSON"), 400);
  }

  const parsed = responsesSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json(errors.invalidRequest("Missing or invalid 'model' for /v1/responses"), 400);
  }
  const requested = parsed.data.model;
  const resolved = resolveModel(requested);
  const clientStream = parsed.data.stream === true;
  const instructions = parsed.data.instructions ?? null;
  const messages = responsesInputToMessages(parsed.data.input, instructions);
  if (messages.length === 0) {
    return c.json(errors.invalidRequest("Missing or empty 'input' for /v1/responses"), 400);
  }

  const maxTok = parsed.data.max_output_tokens ?? 1024;
  const upstreamBody: Record<string, unknown> = {
    model: resolved,
    messages,
    stream: clientStream,
    max_tokens: maxTok,
  };
  if (typeof parsed.data.temperature === "number") upstreamBody.temperature = parsed.data.temperature;

  const up = await upstreamOpenAIChatCompletion(c, {
    inst,
    reqId: id,
    start,
    logPath: "/v1/responses",
    requestedModel: requested,
    resolvedModel: resolved,
    stream: clientStream,
    upstreamBody,
    wrapChatSseErrors: false,
  });

  if (!clientStream) {
    const txt = await up.text();
    if (!up.ok) {
      const r = new Response(txt, { status: up.status, headers: { "x-request-id": id } });
      r.headers.set("Content-Type", up.headers.get("Content-Type") ?? "application/json");
      return r;
    }
    const { text, usage } = assistantTextFromChatJson(txt);
    const respId = newRespId("resp");
    const msgId = newRespId("msg");
    const pt = usage?.prompt_tokens;
    const ct = usage?.completion_tokens;
    const it = typeof pt === "number" ? pt : 0;
    const ot = typeof ct === "number" ? ct : 0;
    const body = {
      id: respId,
      object: "response",
      created_at: Math.floor(Date.now() / 1000),
      status: "completed",
      model: requested,
      output: [
        {
          id: msgId,
          type: "message",
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text, annotations: [] }],
        },
      ],
      usage: {
        input_tokens: it,
        output_tokens: ot,
        output_tokens_details: { reasoning_tokens: 0 },
        total_tokens: it + ot,
      },
    };
    const r = c.json(body, 200);
    r.headers.set("x-request-id", id);
    return r;
  }

  if (!up.ok || !up.body) {
    const txt = await up.text();
    const r = new Response(txt, { status: up.status, headers: { "x-request-id": id } });
    r.headers.set("Content-Type", up.headers.get("Content-Type") ?? "application/json");
    return r;
  }

  const respId = newRespId("resp");
  const msgId = newRespId("msg");
  const outStream = transformChatSseToResponsesSse(up.body, {
    respId,
    msgId,
    model: requested,
    instructions,
  });

  return new Response(outStream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "x-request-id": id,
    },
  });
}
