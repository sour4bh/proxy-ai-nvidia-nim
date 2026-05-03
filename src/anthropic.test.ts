import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";

process.env.NVIDIA_NIM_API_KEY ??= "test-key";

type FetchMock = typeof fetch;

async function withMessagesApp<T>(
  fetchImpl: FetchMock,
  run: (app: Hono) => Promise<T>,
): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    const { messages } = await import("./anthropic.ts");
    const app = new Hono();
    app.post("/v1/messages", messages);
    return await run(app);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function upstreamJson(): Response {
  return new Response(
    JSON.stringify({
      id: "chatcmpl-test",
      choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 1, completion_tokens: 1 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

test("Anthropic messages maps object tool_choice any and stop_sequences", async () => {
  const capture: { body?: Record<string, unknown> } = {};
  await withMessagesApp(
    async (_url, init) => {
      capture.body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return upstreamJson();
    },
    async (app) => {
      const res = await app.request("/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet",
          max_tokens: 16,
          stop_sequences: ["END"],
          tools: [{ name: "lookup", input_schema: { type: "object" } }],
          tool_choice: { type: "any" },
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      assert.equal(res.status, 200);
    },
  );

  assert.equal(capture.body?.tool_choice, "required");
  assert.deepEqual(capture.body?.stop, ["END"]);
});

test("Anthropic messages maps supported object tool_choice variants", async () => {
  const cases: Array<{ input: unknown; expected: unknown }> = [
    { input: { type: "auto" }, expected: "auto" },
    { input: { type: "none" }, expected: "none" },
    { input: { type: "tool", name: "lookup" }, expected: { type: "function", function: { name: "lookup" } } },
  ];

  for (const { input, expected } of cases) {
    const capture: { body?: Record<string, unknown> } = {};
    await withMessagesApp(
      async (_url, init) => {
        capture.body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return upstreamJson();
      },
      async (app) => {
        const res = await app.request("/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet",
            max_tokens: 16,
            tools: [{ name: "lookup", input_schema: { type: "object" } }],
            tool_choice: input,
            messages: [{ role: "user", content: "hi" }],
          }),
        });
        assert.equal(res.status, 200);
      },
    );
    assert.deepEqual(capture.body?.tool_choice, expected);
  }
});

test("Anthropic messages returns invalid_request_error for non-string non-array content", async () => {
  for (const content of [null, 123]) {
    let fetched = false;
    await withMessagesApp(
      async () => {
        fetched = true;
        return upstreamJson();
      },
      async (app) => {
        const res = await app.request("/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet",
            max_tokens: 16,
            messages: [{ role: "user", content }],
          }),
        });
        assert.equal(res.status, 400);
        const body = (await res.json()) as { error: { type: string } };
        assert.equal(body.error.type, "invalid_request_error");
      },
    );
    assert.equal(fetched, false);
  }
});

test("Anthropic messages still translates text, tool_use, and tool_result blocks", async () => {
  const capture: { body?: { messages?: unknown[] } } = {};
  await withMessagesApp(
    async (_url, init) => {
      capture.body = JSON.parse(String(init?.body)) as { messages?: unknown[] };
      return upstreamJson();
    },
    async (app) => {
      const res = await app.request("/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet",
          max_tokens: 16,
          system: [{ type: "text", text: "system prompt" }, { type: "image", source: {} }],
          messages: [
            {
              role: "assistant",
              content: [
                { type: "text", text: "Need data" },
                { type: "tool_use", id: "toolu_1", name: "lookup", input: { q: "x" } },
              ],
            },
            {
              role: "user",
              content: [
                { type: "tool_result", tool_use_id: "toolu_1", content: [{ type: "text", text: "result" }] },
                { type: "text", text: "continue" },
                { type: "unsupported", value: true },
              ],
            },
          ],
        }),
      });
      assert.equal(res.status, 200);
    },
  );

  assert.deepEqual(capture.body?.messages, [
    { role: "system", content: "system prompt" },
    {
      role: "assistant",
      content: "Need data",
      tool_calls: [
        {
          id: "toolu_1",
          type: "function",
          function: { name: "lookup", arguments: JSON.stringify({ q: "x" }) },
        },
      ],
    },
    { role: "tool", tool_call_id: "toolu_1", content: "result" },
    { role: "user", content: "continue" },
  ]);
});

test("Anthropic messages clamps max_tokens to MAX_COMPLETION_TOKENS_CAP", async () => {
  const capture: { body?: Record<string, unknown> } = {};
  await withMessagesApp(
    async (_url, init) => {
      capture.body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return upstreamJson();
    },
    async (app) => {
      const res = await app.request("/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet",
          max_tokens: 200_000,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      assert.equal(res.status, 200);
    },
  );

  assert.equal(capture.body?.max_tokens, 8192);
});

test("Anthropic messages retries once when upstream reports context completion overflow", async () => {
  let calls = 0;
  const seenMax: number[] = [];
  await withMessagesApp(
    async (_url, init) => {
      calls++;
      const b = JSON.parse(String(init?.body)) as { max_tokens: number };
      seenMax.push(b.max_tokens);
      if (calls === 1) {
        return new Response(
          JSON.stringify({
            error: {
              message:
                "maximum context length is 8192 tokens, but you sent 7000 input tokens and max_tokens is too large",
            },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      return upstreamJson();
    },
    async (app) => {
      const res = await app.request("/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet",
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      assert.equal(res.status, 200);
    },
  );

  assert.equal(calls, 2);
  assert.equal(seenMax[0], 8096);
  assert.equal(seenMax[1], 680);
});

test("Anthropic streaming cancellation cancels the upstream reader", async () => {
  let cancelReason: unknown;
  const upstream = new ReadableStream<Uint8Array>({
    cancel(reason) {
      cancelReason = reason;
    },
  });

  await withMessagesApp(
    async () => new Response(upstream, { status: 200, headers: { "Content-Type": "text/event-stream" } }),
    async (app) => {
      const res = await app.request("/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet",
          max_tokens: 16,
          stream: true,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      assert.equal(res.status, 200);
      await res.body?.getReader().cancel("client-gone");
    },
  );

  assert.equal(cancelReason, "client-gone");
});
