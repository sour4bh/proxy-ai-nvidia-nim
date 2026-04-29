import assert from "node:assert/strict";
import test from "node:test";
import { TrafficMonitor } from "./traffic.ts";

test("TrafficMonitor tracks active clients until response body is consumed", async () => {
  const traffic = new TrafficMonitor();
  const response = await traffic.track(() => new Response("ok"));
  assert.equal(traffic.snapshot().activeClients, 1);
  assert.equal(await response.text(), "ok");
  assert.equal(traffic.snapshot().activeClients, 0);
  assert.notEqual(traffic.snapshot().lastClientActivityAt, null);
});

test("TrafficMonitor waits for active clients and a quiet window", async () => {
  const traffic = new TrafficMonitor();
  let release!: () => void;
  const responsePromise = traffic.track(
    () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            release = () => {
              controller.enqueue(new TextEncoder().encode("done"));
              controller.close();
            };
          },
        }),
      ),
  );

  await responsePromise;
  let resumed = false;
  const waiting = traffic.waitForQuiet({
    quietMs: 10,
    pollMs: 2,
    onResume: () => {
      resumed = true;
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(resumed, false);
  release();
  const response = await responsePromise;
  await response.text();
  await waiting;
  assert.equal(resumed, true);
});
