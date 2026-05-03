import assert from "node:assert/strict";
import test from "node:test";
import { probePage } from "./page.ts";

test("probe dashboard maps every result category to an explicit color token", () => {
  const html = probePage();
  assert.match(
    html,
    /const CATEGORY_COLOR = \{ alive: "alive", timeout: "timeout", rate_limited: "rate", error: "error", skipped: "skipped" \}/,
  );
  assert.equal(html.includes('style="background:var(--\' + esc(r.category)'), false);
  assert.equal(html.includes('style="background:var(--\' + k'), false);
});
