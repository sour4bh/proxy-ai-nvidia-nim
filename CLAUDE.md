# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A local OpenAI-compatible HTTP proxy that fronts NVIDIA NIM's free tier (40 RPM, OpenAI-shaped Chat Completions at `https://integrate.api.nvidia.com/v1`). Coding tools (Cursor, Aider), curl, and Node/TS apps point at the proxy and use NIM transparently.

## Commands

```bash
pnpm typecheck                                    # tsc --noEmit, must be clean
pnpm start                                        # boot proxy on 127.0.0.1:3000
pnpm start --alias gpt-4o=meta/llama-3.3-70b-instruct
pnpm start --alias=foo=bar                        # = form also works
pnpm hello                                        # AI SDK → NIM directly (smoke test)
pnpm agent                                        # AI SDK ToolLoopAgent → NIM (smoke test)
pnpm exec tsx --env-file=.env src/via-proxy.ts    # AI SDK → local proxy (smoke test)
```

`tsx --env-file=.env` loads `.env` natively — `dotenv` is in deps for symmetry but not imported.

## Architecture

### Two distinct surfaces in `src/`

1. **Smoke tests** — `nim.ts`, `hello.ts`, `agent.ts`, `via-proxy.ts`. Use the AI SDK (`@ai-sdk/openai-compatible` + `ai`). These are isolated examples; they are NOT imported by the proxy.
2. **Proxy** — `server.ts`, `proxy.ts`, `anthropic.ts`, `limiter.ts`, `models.ts`, `aliases.ts`, `config.ts`, `errors.ts`, `log.ts`. Hono on `@hono/node-server`. The AI SDK is intentionally absent here.

### Proxy invariants (load-bearing — read before changing)

- **Wire-format pass-through.** `proxy.ts` parses request JSON only enough to read `{model, stream?}`, rewrites `model` via aliases, and forwards everything else byte-for-byte. Streaming responses return `upstream.body` directly via `new Response(...)`. Do **not** route the proxy path through the AI SDK — that breaks fidelity that Cursor/Aider depend on.
- **Limiter never refunds on upstream 429.** The request hit NIM, it counts. Refunding would over-send. See `proxy.ts:handleUpstreamPause` + `limiter.ts:pauseUntil`.
- **No retry on upstream 429.** Forward to caller verbatim, set `Retry-After`, set local `pausedUntil` for the next requests in the queue. Caller decides whether to retry.
- **Mid-stream failure (status 200 then error).** `proxy.ts:wrapStreamWithErrorFrame` emits a synthetic `data: {error...}\n\ndata: [DONE]\n\n` frame and closes. Status code can't be changed mid-stream.
- **Non-JSON upstream errors are wrapped.** `proxy.ts:ensureOpenAIShape` detects when upstream returns plain text (e.g. NIM's HTML 404 for unknown paths) and wraps it in OpenAI error shape so callers always parse cleanly.
- **Upstream deadline is separate from queue-wait.** `PROXY_MAX_QUEUE_WAIT_MS` (30s default) bounds how long a request waits for a *local* RPM slot. `PROXY_UPSTREAM_TIMEOUT_MS` (10 min default, generous for slow reasoners like GLM-5.1 or DeepSeek V4) bounds how long the upstream `fetch` itself can take. Combined with `c.req.raw.signal` via `AbortSignal.any`, so client disconnect and proxy timeout both abort the upstream cleanly.
- **No client auth.** The proxy is intended for Tailscale-only or localhost binds; Tailscale ACLs are the boundary. Any client `Authorization` header is overwritten — `proxy.ts` always injects `Bearer NVIDIA_NIM_API_KEY` toward upstream. `config.ts` throws at boot only if `NVIDIA_NIM_API_KEY` is unset. (`PROXY_API_KEY` may exist in `.env` for legacy reasons but is not read.)

### Limiter design (`limiter.ts`)

Custom rolling-window token bucket — `bottleneck`, `p-queue`, and AI SDK helpers were rejected. p-queue's fixed window leaks bursts at boundaries and would trip NIM's actual sliding window. The custom code is small enough to keep in your head. Behavior:

- Capacity 40 / 60s rolling, FIFO queue, `MAX_QUEUE_WAIT_MS=30s` per request.
- Client disconnect (via `AbortSignal` from `c.req.raw.signal`) removes queued waiters without burning a slot.
- One `setTimeout` wake-loop drains the queue on the next available slot or after `pausedUntil`.

### Aliases (`aliases.ts`, `config.ts`)

CLI-driven only. No env var, no defaults baked in. Parsed via `node:util` `parseArgs` from `process.argv`. The `--` separator that pnpm sometimes forwards is filtered out before parsing. Short flag `-a` was dropped because it collides with pnpm's own `-a`.

Aliases are pure resolution — `body.model = aliases[body.model] ?? body.model`. Unknown models pass through unchanged.

### Status code edge case

Hono's typed JSON helper rejects 499. The client-aborted-in-queue path uses `new Response(JSON.stringify(...), {status: 499})` directly. Don't try to "fix" this with `c.json` — it'll fail typecheck.

### Anthropic Messages API (`anthropic.ts`)

`POST /v1/messages` translates the Anthropic Messages API into an OpenAI Chat Completions request toward NIM and translates the response back. Reuses the shared `limiter` from `proxy.ts` — both surfaces share the same 40 RPM budget.

Translation covers:
- **Messages**: `tool_result` content blocks → `role: "tool"` messages; `tool_use` blocks → `tool_calls`; `system` string or block array → system message prepended.
- **Tools**: `input_schema` → `parameters`; wrapped in `{type: "function"}`.
- **Tool choice**: `"any"` → `"required"`, `{type: "tool"}` → `{type: "function"}`.
- **Streaming**: requests OpenAI `stream_options.include_usage`, then converts OpenAI delta chunks → Anthropic SSE event sequence (`message_start`, `content_block_start/delta/stop`, `message_delta`, `message_stop`). Tool call argument deltas → `input_json_delta`; final upstream usage maps to Anthropic `input_tokens` / `output_tokens` in `message_delta`.
- **Stop reasons**: `"stop"` → `"end_turn"`, `"tool_calls"` → `"tool_use"`, `"length"` → `"max_tokens"`.
- **Errors**: returned in Anthropic error shape `{type: "error", error: {type, message}}` rather than OpenAI shape.

**Claude Code usage (session-scoped):**
```bash
ANTHROPIC_BASE_URL=http://100.73.92.10:3000 ANTHROPIC_API_KEY=unused claude
```
Aliases must map the claude model name to a NIM model (CLI flags, not env):
```bash
pnpm start --alias claude-sonnet-4-6=meta/llama-3.3-70b-instruct \
           --alias claude-opus-4-7=meta/llama-3.3-70b-instruct \
           --alias claude-haiku-4-5-20251001=meta/llama-3.1-8b-instruct
```

### Out of scope (intentional)

- **No multi-provider failover, no Redis, no metrics stack, no Docker, no auth providers, no DB.** Single-process, in-memory state only.

## Convention notes

- `tsconfig.json` has `allowImportingTsExtensions: true`. Imports use `.ts` suffixes (`import { x } from "./foo.ts"`).
- ESM only (`"type": "module"`).
- `src/` is flat — no `handlers/`, `services/`, `routes/` subdirs. One file per concept, named after the domain it owns.
