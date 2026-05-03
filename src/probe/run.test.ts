import assert from "node:assert/strict";
import test from "node:test";
import { chatModelIds, probeOne, runProbe } from "./run.ts";

const base = {
  nimBaseUrl: "https://example.test/v1",
  nimApiKey: "test-key",
  timeoutMs: 1000,
};

test("chatModelIds filters non-chat model ids", () => {
  const result = chatModelIds([
    { id: "meta/llama-3.3-70b-instruct" },
    { id: "nvidia/embed-qa" },
    { id: "moonshotai/kimi-k2.5" },
  ]);
  assert.deepEqual(result, {
    ids: ["meta/llama-3.3-70b-instruct", "moonshotai/kimi-k2.5"],
    skipped: 1,
  });
});

test("probeOne classifies a 200 response as alive", async () => {
  const result = await probeOne("model-a", {
    ...base,
    fetchImpl: async () => new Response("{}", { status: 200 }),
  });
  assert.equal(result.category, "alive");
  assert.equal(result.status, 200);
  assert.equal(result.note, "ok");
});

test("probeOne classifies a 429 response as rate_limited", async () => {
  const result = await probeOne("model-a", {
    ...base,
    fetchImpl: async () => new Response("too many requests", { status: 429 }),
  });
  assert.equal(result.category, "rate_limited");
  assert.equal(result.status, 429);
  assert.equal(result.note, "too many requests");
});

test("probeOne classifies non-200 non-429 responses as error", async () => {
  const result = await probeOne("model-a", {
    ...base,
    fetchImpl: async () => new Response("bad gateway", { status: 502 }),
  });
  assert.equal(result.category, "error");
  assert.equal(result.status, 502);
  assert.equal(result.note, "bad gateway");
});

test("probeOne classifies timeout errors as timeout", async () => {
  const timeout = new Error("deadline");
  timeout.name = "TimeoutError";
  const result = await probeOne("model-a", {
    ...base,
    fetchImpl: async () => {
      throw timeout;
    },
  });
  assert.equal(result.category, "timeout");
  assert.equal(result.status, 0);
});

test("probeOne classifies thrown fetch errors as error", async () => {
  const result = await probeOne("model-a", {
    ...base,
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(result.category, "error");
  assert.equal(result.status, 0);
  assert.equal(result.note, "network down");
});

test("probeOne classifies local limiter rejection as skipped", async () => {
  let fetched = false;
  const result = await probeOne("model-a", {
    ...base,
    acquire: async () => {
      throw new Error("queue timeout");
    },
    fetchImpl: async () => {
      fetched = true;
      return new Response("{}", { status: 200 });
    },
  });
  assert.equal(result.category, "skipped");
  assert.equal(fetched, false);
});

test("runProbe fails instead of hanging when model discovery times out", async () => {
  const run = await runProbe({
    source: "cli",
    nimBaseUrl: "https://example.test/v1",
    nimApiKey: "test-key",
    timeoutMs: 1,
    concurrency: 1,
    fetchImpl: async (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      }),
  });

  assert.equal(run.status, "failed");
  assert.match(run.error ?? "", /\/v1\/models timed out after 1ms/);
});
