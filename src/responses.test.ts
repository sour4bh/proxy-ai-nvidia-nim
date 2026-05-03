import assert from "node:assert/strict";
import test from "node:test";
import { responsesInputToMessages } from "./responses-input.ts";

test("responsesInputToMessages handles string input and instructions", () => {
  const m = responsesInputToMessages("Hello", "Be brief.");
  assert.deepEqual(m, [
    { role: "system", content: "Be brief." },
    { role: "user", content: "Hello" },
  ]);
});

test("responsesInputToMessages maps message-shaped array items", () => {
  const m = responsesInputToMessages(
    [
      { type: "message", role: "user", content: "One" },
      { type: "message", role: "assistant", content: "Two" },
    ],
    null,
  );
  assert.deepEqual(m, [
    { role: "user", content: "One" },
    { role: "assistant", content: "Two" },
  ]);
});
