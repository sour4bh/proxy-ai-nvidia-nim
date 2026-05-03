import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";

process.env.NVIDIA_NIM_API_KEY ??= "test-key";

test("OpenAI stream wrapper cancellation cancels the upstream reader", async () => {
  let cancelReason: unknown;
  const upstream = new ReadableStream<Uint8Array>({
    cancel(reason) {
      cancelReason = reason;
    },
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(upstream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
  try {
    const { chatCompletions } = await import("./proxy.ts");
    const app = new Hono();
    app.post("/v1/chat/completions", chatCompletions);

    const res = await app.request("/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta/llama-3.3-70b-instruct",
        stream: true,
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    assert.equal(res.status, 200);
    await res.body?.getReader().cancel("client-gone");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(cancelReason, "client-gone");
});
