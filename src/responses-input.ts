/** Pure mapping from OpenAI Responses `input` to chat `messages` (no server config). */

export type ResponsesChatMsg = { role: "system" | "user" | "assistant"; content: string };

export function flattenOpenAiContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const part of content) {
    if (typeof part === "string") {
      parts.push(part);
      continue;
    }
    if (part && typeof part === "object") {
      const o = part as Record<string, unknown>;
      if (typeof o.text === "string") parts.push(o.text);
      else if (typeof o.content === "string") parts.push(o.content);
    }
  }
  return parts.join("");
}

function pushMessage(out: ResponsesChatMsg[], role: string, content: unknown): void {
  const text = flattenOpenAiContent(content).trim();
  if (!text) return;
  const r = role === "assistant" || role === "system" || role === "user" ? role : "user";
  out.push({ role: r, content: text });
}

function inputItemToMessages(item: unknown, out: ResponsesChatMsg[]): void {
  if (item === null || item === undefined) return;
  if (typeof item === "string") {
    out.push({ role: "user", content: item });
    return;
  }
  if (typeof item !== "object") return;
  const o = item as Record<string, unknown>;
  const typ = typeof o.type === "string" ? o.type : "";
  if (typ === "message" || o.role) {
    const role = typeof o.role === "string" ? o.role : "user";
    pushMessage(out, role, o.content ?? o);
    return;
  }
  if (typ === "input_text" && typeof o.text === "string") {
    out.push({ role: "user", content: o.text });
  }
}

/** Build chat messages from Responses `input` + optional `instructions`. */
export function responsesInputToMessages(
  input: unknown,
  instructions: string | null | undefined,
): ResponsesChatMsg[] {
  const out: ResponsesChatMsg[] = [];
  if (instructions && instructions.trim()) {
    out.push({ role: "system", content: instructions.trim() });
  }
  if (input === undefined || input === null) {
    return out;
  }
  if (typeof input === "string") {
    out.push({ role: "user", content: input });
    return out;
  }
  if (Array.isArray(input)) {
    for (const item of input) inputItemToMessages(item, out);
    return out;
  }
  if (typeof input === "object") {
    inputItemToMessages(input, out);
  }
  return out;
}
