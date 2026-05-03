import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { listAliases, replaceAliases } from "./alias-map.ts";
import {
  bootstrapPersistedConfig,
  mergeWritePersistedAliases,
  sanitizeAliases,
  shutdownPersistedConfig,
} from "./persisted-config.ts";

function noopLog(_record: Record<string, unknown>): void {}

function snapshotAliases(): Record<string, string> {
  return Object.fromEntries(listAliases().map((e) => [e.id, e.resolved]));
}

test("sanitizeAliases keeps only non-empty string pairs", () => {
  assert.deepEqual(sanitizeAliases({ a: "b", bad: 1, "": "x", c: "" }), { a: "b" });
});

test("mergeWritePersistedAliases preserves unrelated keys", async (t) => {
  const before = snapshotAliases();
  const dir = mkdtempSync(join(tmpdir(), "proxyai-pcfg-"));
  const path = join(dir, "config.json");
  writeFileSync(path, JSON.stringify({ note: "ssh", aliases: { x: "y" } }));
  bootstrapPersistedConfig({ path, log: noopLog });
  t.after(() => {
    shutdownPersistedConfig();
    replaceAliases(before);
  });
  mergeWritePersistedAliases({ a: "meta/llama" });
  const raw = JSON.parse(readFileSync(path, "utf8")) as { note?: string; aliases?: Record<string, string> };
  assert.equal(raw.note, "ssh");
  assert.deepEqual(raw.aliases, { a: "meta/llama" });
});

test("bootstrap merges file aliases over CLI defaults", async (t) => {
  const before = snapshotAliases();
  const dir = mkdtempSync(join(tmpdir(), "proxyai-pcfg-"));
  const path = join(dir, "config.json");
  writeFileSync(path, JSON.stringify({ aliases: { fromfile: "nvidia/foo-v1" } }));
  bootstrapPersistedConfig({ path, log: noopLog });
  t.after(() => {
    shutdownPersistedConfig();
    replaceAliases(before);
  });
  const ids = new Set(listAliases().map((e) => e.id));
  assert.ok(ids.has("fromfile"));
});
