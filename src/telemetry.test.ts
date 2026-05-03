import assert from "node:assert/strict";
import test from "node:test";
import { TelemetryStore } from "./telemetry.ts";

test("TelemetryStore keeps max size and evicts oldest", () => {
  const t = new TelemetryStore(3, true);
  for (let i = 0; i < 5; i += 1) {
    t.append({
      reqId: `r${i}`,
      path: "/p",
      requestedModel: `m${i}`,
      resolvedModel: `m${i}`,
      stream: false,
      phase: "x",
      userAgent: "ua",
    });
  }
  const r = t.recent(10);
  assert.equal(r.length, 3);
  assert.equal(r[0]!.requestedModel, "m4");
  assert.equal(r[1]!.requestedModel, "m3");
  assert.equal(r[2]!.requestedModel, "m2");
});

test("TelemetryStore append is no-op when disabled", () => {
  const t = new TelemetryStore(10, false);
  t.append({
    reqId: "a",
    path: "/p",
    requestedModel: "x",
    resolvedModel: "x",
    stream: false,
    phase: "x",
    userAgent: "",
  });
  assert.equal(t.recent(5).length, 0);
});
