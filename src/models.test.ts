import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";

process.env.NVIDIA_NIM_API_KEY ??= "test-key";

test("loadUpstreamModels times out and leaves /v1/models fail-open", async () => {
  const { listModels, loadUpstreamModels } = await import("./models.ts");
  await loadUpstreamModels({
    timeoutMs: 1,
    fetchImpl: async (_url, init) => {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, 25);
        init?.signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(t);
            reject(new Error("aborted"));
          },
          { once: true },
        );
      });
      return new Response(JSON.stringify({ data: [] }));
    },
  });

  const app = new Hono();
  app.get("/v1/models", listModels);
  const res = await app.request("/v1/models");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.object, "list");
  assert.ok(Array.isArray(body.data));
  assert.equal(body.data.length, 0);
});
