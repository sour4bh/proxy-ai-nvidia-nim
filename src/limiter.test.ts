import assert from "node:assert/strict";
import test from "node:test";
import { Limiter } from "./limiter.ts";

test("Limiter snapshot reports rolling-window usage and expiry", async () => {
  const limiter = new Limiter(2, 100, 50);
  await limiter.acquire(new AbortController().signal);
  await limiter.acquire(new AbortController().signal);

  const now = Date.now() + 1;
  const full = limiter.snapshot(now);
  assert.equal(full.capacity, 2);
  assert.equal(full.windowMs, 100);
  assert.equal(full.maxQueueWaitMs, 50);
  assert.equal(full.inUse, 2);
  assert.equal(full.remaining, 0);
  assert.equal(full.usageRatio, 1);
  assert.equal(full.window.length, 2);
  assert.equal(full.window.every((entry) => entry.remainingMs > 0), true);
  assert.notEqual(full.nextAvailableAt, null);

  const expired = limiter.snapshot(now + 150);
  assert.equal(expired.inUse, 0);
  assert.equal(expired.remaining, 2);
  assert.equal(expired.usageRatio, 0);
  assert.equal(expired.window.length, 0);
});

test("Limiter snapshot reports upstream pause timing", () => {
  const limiter = new Limiter(40, 60_000, 30_000);
  const now = Date.now();
  limiter.pauseUntil(now + 5_000);

  const snapshot = limiter.snapshot(now);
  assert.notEqual(snapshot.pausedUntil, null);
  assert.equal(snapshot.pauseRemainingMs, 5_000);
  assert.equal(snapshot.nextAvailableInMs, 5_000);
});
