const NIM_BASE = "https://integrate.api.nvidia.com/v1";
const apiKey = process.env.NVIDIA_NIM_API_KEY;
if (!apiKey) throw new Error("NVIDIA_NIM_API_KEY not set");

const NON_CHAT =
  /embed|guard|retriever|reward|safety|translate|streampetr|vila|deplot|paligemma|kosmos|recurrentgemma|fuyu|starcoder|mamba|mathstral|nemotron-parse|nvclip|neva-/i;

const TIMEOUT_MS = Number(process.env.PROBE_TIMEOUT_MS ?? 30_000);
const CONCURRENCY = Number(process.env.PROBE_CONCURRENCY ?? 3);

type Result = {
  id: string;
  status: number;
  ms: number;
  note: string;
  category: "alive" | "timeout" | "rate_limited" | "error";
};

async function probeOne(id: string): Promise<Result> {
  const start = Date.now();
  try {
    const r = await fetch(`${NIM_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: id,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ms = Date.now() - start;
    if (r.status === 200) return { id, status: 200, ms, note: "ok", category: "alive" };
    const body = (await r.text()).replace(/\s+/g, " ").trim().slice(0, 100);
    if (r.status === 429) return { id, status: 429, ms, note: body, category: "rate_limited" };
    return { id, status: r.status, ms, note: body, category: "error" };
  } catch (e) {
    const ms = Date.now() - start;
    const err = e as Error;
    if (err.name === "TimeoutError") {
      return { id, status: 0, ms, note: `no bytes in ${TIMEOUT_MS}ms`, category: "timeout" };
    }
    return { id, status: 0, ms, note: err.message.slice(0, 100), category: "error" };
  }
}

const C = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

function mark(r: Result): string {
  if (r.category === "alive") return C.green("✓");
  if (r.category === "timeout") return C.red("✗");
  if (r.category === "rate_limited") return C.yellow("·");
  return C.yellow("?");
}

const listRes = await fetch(`${NIM_BASE}/models`, {
  headers: { Authorization: `Bearer ${apiKey}` },
});
if (!listRes.ok) throw new Error(`/v1/models returned ${listRes.status}`);
const list = (await listRes.json()) as { data: Array<{ id: string }> };
const ids = list.data.map((m) => m.id).filter((id) => !NON_CHAT.test(id));
console.log(
  `Probing ${ids.length} chat models (skipping ${list.data.length - ids.length} non-chat) — concurrency=${CONCURRENCY}, timeout=${TIMEOUT_MS}ms\n`,
);

const results: Result[] = [];
let cursor = 0;
async function worker(): Promise<void> {
  while (cursor < ids.length) {
    const id = ids[cursor++]!;
    const r = await probeOne(id);
    results.push(r);
    console.log(`${mark(r)} ${id.padEnd(60)} ${`${r.ms}ms`.padStart(8)}  ${C.dim(r.note)}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const alive = results.filter((r) => r.category === "alive").sort((a, b) => a.ms - b.ms);
const timeout = results.filter((r) => r.category === "timeout");
const rateLimited = results.filter((r) => r.category === "rate_limited");
const errored = results.filter((r) => r.category === "error");

console.log(
  `\n${C.green(`${alive.length} alive`)}, ${C.red(`${timeout.length} hung`)}, ${C.yellow(`${rateLimited.length} 429`)}, ${C.yellow(`${errored.length} errored`)} of ${results.length}`,
);
if (alive.length) {
  console.log(`\nfastest 10:`);
  for (const r of alive.slice(0, 10)) {
    console.log(`  ${`${r.ms}ms`.padStart(7)}  ${r.id}`);
  }
}
if (timeout.length) {
  console.log(`\nhung:`);
  for (const r of timeout) console.log(`  ${r.id}`);
}
