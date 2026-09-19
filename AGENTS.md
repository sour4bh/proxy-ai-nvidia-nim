# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A local OpenAI-compatible HTTP proxy that fronts NVIDIA NIM's free tier (40 RPM, OpenAI-shaped Chat Completions at `https://integrate.api.nvidia.com/v1`). Also **`POST /v1/responses`** (OpenAI Responses → NIM) for **Codex CLI** and other Responses-only clients. Coding tools, curl, and Node/TS apps point at the proxy and use NIM transparently.

## Commands

```bash
pnpm typecheck                                    # tsc --noEmit, must be clean
pnpm start                                        # boot proxy on 127.0.0.1:3000
pnpm start --alias gpt-4o=meta/llama-3.3-70b-instruct
pnpm start --alias=foo=bar                        # = form also works
pnpm test                                         # probe subsystem tests
pnpm hello                                        # AI SDK → NIM directly (smoke test)
pnpm agent                                        # AI SDK ToolLoopAgent → NIM (smoke test)
pnpm exec tsx --env-file=.env src/via-proxy.ts    # AI SDK → local proxy (smoke test)
pnpm smoke:clis                                   # bash: claude + codex + cursor CLI smokes (see scripts/)
```

`tsx --env-file=.env` loads `.env` natively — `dotenv` is in deps for symmetry but not imported.

**HTTP route smoke:** `BASE_URL=http://127.0.0.1:3000 ./scripts/smoke-endpoints.sh` (curl-only; no CLIs).

## Architecture

### Two distinct surfaces in `src/`

1. **Smoke tests** — `nim.ts`, `hello.ts`, `agent.ts`, `via-proxy.ts`. Use the AI SDK (`@ai-sdk/openai-compatible` + `ai`). These are isolated examples; they are NOT imported by the proxy.
2. **Proxy** — `server.ts`, `proxy.ts`, `responses.ts`, `responses-input.ts`, `anthropic.ts`, `limiter.ts`, `models.ts`, `aliases.ts`, `config.ts`, `errors.ts`, `log.ts`, and `probe/`. Hono on `@hono/node-server`. The AI SDK is intentionally absent here.

### Proxy invariants (load-bearing — read before changing)

- **`POST /v1/chat/completions` — wire-format pass-through.** `chatCompletions` in `proxy.ts` parses JSON only enough for `{model, stream?}`, rewrites `model` via aliases, and forwards the rest byte-for-byte. Streaming returns `upstream.body` through `wrapStreamWithErrorFrame` (see below). Do **not** route this path through the AI SDK — breaks fidelity for Cursor/Aider-style clients.
- **`POST /v1/responses` — adapter, not passthrough.** `responses.ts` maps OpenAI Responses API (Codex `wire_api = "responses"`) → NIM `chat/completions`, then maps JSON or SSE back into Responses-shaped events (`response.created` … `response.completed`, `data: [DONE]`). Shares `upstreamOpenAIChatCompletion` in `proxy.ts` with `wrapChatSseErrors: false` so the translator can read raw chat SSE. Input → messages lives in `responses-input.ts` (unit-tested without booting `config`).
- **Limiter never refunds on upstream 429.** The request hit NIM, it counts. Refunding would over-send. See `proxy.ts:handleUpstreamPause` + `limiter.ts:pauseUntil`.
- **No retry on upstream 429.** Forward to caller verbatim, set `Retry-After`, set local `pausedUntil` for the next requests in the queue. Caller decides whether to retry.
- **Mid-stream failure (status 200 then error) on chat completions.** `proxy.ts:wrapStreamWithErrorFrame` emits a synthetic `data: {error...}\n\ndata: [DONE]\n\n` frame and closes. Status code can't be changed mid-stream. (`/v1/responses` streaming errors use Responses-style `error` events instead.)
- **Non-JSON upstream errors are wrapped.** `proxy.ts:ensureOpenAIShape` detects when upstream returns plain text (e.g. NIM's HTML 404 for unknown paths) and wraps it in OpenAI error shape so callers always parse cleanly.
- **Upstream deadline is separate from queue-wait.** `PROXY_MAX_QUEUE_WAIT_MS` (30s default) bounds how long a request waits for a *local* RPM slot. `PROXY_UPSTREAM_TIMEOUT_MS` (10 min default, generous for slow reasoners like GLM-5.1 or DeepSeek V4) bounds how long the upstream `fetch` itself can take. Combined with `c.req.raw.signal` via `AbortSignal.any`, so client disconnect and proxy timeout both abort the upstream cleanly.
- **No client auth.** The proxy is intended for Tailscale-only or localhost binds; Tailscale ACLs are the boundary. Any client `Authorization` header is overwritten — `proxy.ts` always injects `Bearer NVIDIA_NIM_API_KEY` toward upstream. `config.ts` throws at boot only if `NVIDIA_NIM_API_KEY` is unset. (`PROXY_API_KEY` may exist in `.env` for legacy reasons but is not read.)

### Limiter design (`limiter.ts`)

Custom rolling-window token bucket — `bottleneck`, `p-queue`, and AI SDK helpers were rejected. p-queue's fixed window leaks bursts at boundaries and would trip NIM's actual sliding window. The custom code is small enough to keep in your head. Behavior:

- Capacity 40 / 60s rolling, FIFO queue, `MAX_QUEUE_WAIT_MS=30s` per request.
- Client disconnect (via `AbortSignal` from `c.req.raw.signal`) removes queued waiters without burning a slot.
- One `setTimeout` wake-loop drains the queue on the next available slot or after `pausedUntil`.
- `limiter.snapshot()` is the read-only contract for live temporal rate-limit usage in `/health` and `/probe`: it reports current rolling-window entries, remaining slots, queue depth, upstream pause timing, and next-slot timing.

### Aliases (`config.ts`, `alias-map.ts`, `aliases.ts`, `probe/routes.ts`)

Startup aliases are still parsed from CLI flags via `config.ts` (`--alias key=value`, filtered `--` separator, no `-a` short flag). At runtime, aliases live in an in-memory map (`alias-map.ts`) and can be replaced without restart via the probe dashboard or edits to **`config.json`** (debounced reload).

Alias resolution stays pure (`aliases[model] ?? model`) for `/v1/chat/completions`, `/v1/messages`, and `/v1/responses`. Unknown models pass through unchanged.

Runtime alias API (dashboard-facing):
- `GET /probe/aliases` → current alias entries
- `GET /probe/config` → persisted JSON snapshot: `{ path, exists, parseError?, config }` (`config` is `null` when the file exists but JSON is invalid)

Persisted **`config.json`** (override path with **`PROXYAI_CONFIG_FILE`**, default `./config.json`):
- Top-level **`aliases`** object is merged at boot as `{ ...CLI aliases from startup, ...aliases from file }` (file wins on key overlap).
- Extra keys are preserved through dashboard saves so you can stash SSH-only metadata beside `aliases`.
- **`PUT /probe/aliases`** atomically rewrites the file (pretty-printed JSON) after updating memory; failed writes roll back the in-memory map.
- **`fs.watch`** on the file and its directory reapplies aliases ~300ms after external edits (SSH `vim`, `scp`, etc.), ignoring events from the proxy’s own writes briefly so loops don’t occur.

### Status code edge case

Hono's typed JSON helper rejects 499. The client-aborted-in-queue path uses `new Response(JSON.stringify(...), {status: 499})` directly. Don't try to "fix" this with `c.json` — it'll fail typecheck.

### Anthropic Messages API (`anthropic.ts`)

`POST /v1/messages` translates the Anthropic Messages API into an OpenAI Chat Completions request toward NIM and translates the response back. Reuses the shared `limiter` from `proxy.ts` — **`/v1/chat/completions`**, **`/v1/responses`**, and **`/v1/messages`** share the same 40 RPM budget.

Translation covers:
- **Messages**: string content plus `text`, `tool_use`, and `tool_result` content blocks; `tool_result` content blocks → `role: "tool"` messages; `tool_use` blocks → `tool_calls`; `system` string or text blocks → system message prepended. Unsupported content block types are ignored.
- **Tools**: `input_schema` → `parameters`; wrapped in `{type: "function"}`.
- **Tool choice**: `"any"` or `{type: "any"}` → `"required"`, `{type: "auto"}` / `{type: "none"}` → `"auto"` / `"none"`, `{type: "tool"}` → `{type: "function"}`.
- **Stop sequences**: `stop_sequences` → OpenAI `stop`.
- **Streaming**: requests OpenAI `stream_options.include_usage`, then converts OpenAI delta chunks → Anthropic SSE event sequence (`message_start`, `content_block_start/delta/stop`, `message_delta`, `message_stop`). Tool call argument deltas → `input_json_delta`; final upstream usage maps to Anthropic `input_tokens` / `output_tokens` in `message_delta`.
- **Stop reasons**: `"stop"` → `"end_turn"`, `"tool_calls"` → `"tool_use"`, `"length"` → `"max_tokens"`.
- **Errors**: returned in Anthropic error shape `{type: "error", error: {type, message}}` rather than OpenAI shape.

Outgoing `max_tokens` is capped by `MAX_COMPLETION_TOKENS_CAP` (default 8192), a conservative JSON-length estimate of input size, `ANTHROPIC_UPSTREAM_CONTEXT_TOKENS` (default 131072), and `ANTHROPIC_COMPLETION_SAFETY_MARGIN_TOKENS` (default 512). If NIM still returns a completion/context token error, `ANTHROPIC_RETRY_MAX_TOKENS_OVERFLOW` (default on) allows **one** retry with a reduced `max_tokens` parsed from the message when possible.

The adapter is intentionally permissive rather than a full Anthropic API clone:
unknown top-level fields and unsupported content block types are not rejected,
but only the fields listed above are translated toward NIM.

### Probe dashboard (`probe/`)

`GET /probe` serves the zero-build browser dashboard. `GET /probe/state` returns scheduler state, the active run, latest run, retained history summaries, live rate-limit usage, probe config, and current alias entries. `POST /probe/run` starts a manual run and returns 409 if another run is active.

The scheduler starts after server boot, runs once shortly after boot, then every `PROBE_INTERVAL_MS` (default 6 hours). Results are file-backed under `PROBE_HISTORY_DIR` (default `.probe-history`) with `latest.json` plus the last `PROBE_HISTORY_LIMIT` run files (default 30). `.probe-history/` is gitignored.

Probe requests fetch NIM `/models`, filter likely non-chat IDs, then call NIM `/chat/completions` with `max_tokens: 1024`. Dashboard and scheduled probes wait before each model until `TrafficMonitor` sees no active `/v1/chat/completions`, `/v1/messages`, or **`/v1/responses`** clients and `PROBE_CLIENT_QUIET_MS` has elapsed since the most recent client activity (default 30 seconds). `TrafficMonitor` tracks response body consumption, so streaming clients keep probes paused until the stream ends. After the quiet gate opens, probes still inject the shared `limiter.acquire(...)` before each chat-completions probe so health checks do not bypass the same NIM budget used by live proxy traffic. The CLI probe (`pnpm probe`) uses the same runner without the server limiter or client-traffic quiet gate.

Probe run JSON is stable around `{id, source, status, startedAt, finishedAt, durationMs, config, counts, results}`. Result categories are `alive`, `timeout`, `rate_limited`, `error`, and `skipped`; `skipped` is reserved for local probe conditions like limiter rejection.

Alias editor UX in dashboard:
- No raw JSON editing UI.
- Users select a model entry and open a modal to map it to an existing alias name or a new custom alias.
- Remove-mapping action is in the same modal.
- Dashboard HTML is served directly from `src/probe/page.ts`; if a host still shows the old UI, that host is running older code and needs deploy + service restart.

**Claude Code (via proxy):** `ANTHROPIC_BASE_URL` = proxy origin **without** trailing `/v1` (e.g. `http://127.0.0.1:3000`). Custom bases: set `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1` to avoid beta-header 400s. Repo helper: `scripts/claude-smoke.sh` (loads `~/.env.secrets`, `.env`, `.env.claude`; see `.env.claude.example`); optional `CLAUDE_SMOKE_MODEL` or fastest `alive` model from `GET …/probe/state`. `PROXYAI_SKIP_MISSING_CLIS=1` (default) skips if `claude` not on PATH.

```bash
ANTHROPIC_BASE_URL=http://127.0.0.1:3000 ANTHROPIC_API_KEY=unused claude
```

Aliases must map Claude model IDs to NIM ids (startup flags, not env):

```bash
pnpm start --alias claude-sonnet-4-6=meta/llama-3.3-70b-instruct \
           --alias claude-opus-4-7=meta/llama-3.3-70b-instruct \
           --alias claude-haiku-4-5-20251001=meta/llama-3.1-8b-instruct
```

Claude Code picks different **Anthropic model IDs** for “Sonnet-class” vs “Haiku-class” traffic; your **aliases** decide which NIM `meta/...` id actually runs. The examples map Sonnet and Opus names to a larger instruct model and Haiku to a smaller one—if you reverse that (e.g. point a Sonnet-named id at an 8B NIM model or leave a name unmapped), prompts plus `max_tokens` can exceed what that deployment allows, and the proxy forwards the upstream failure (including rare **HTTP 410 Gone** when a route or model revision is retired). Keep each Claude model name aliased to an NIM chat model you have access to; if you see 410 or context errors, confirm the target id in the NIM catalog and in `GET /probe/state` / latest probe results.

**Codex CLI:** Point `openai_base_url` at **`http://<host>:<port>/v1`** (includes `/v1`). Uses Responses API → proxy `POST /v1/responses`. Helper: `scripts/codex-smoke.sh` (`-c openai_base_url=…`, `codex exec`, read-only sandbox). Optional `CODEX_SMOKE_MODEL`.

**Cursor Agent CLI:** `scripts/cursor-smoke.sh` exercises **`cursor agent -p`** (Cursor **cloud**, subscription key — **not** routed through this NIM proxy). Optional `CURSOR_SMOKE_MODEL` (default `auto`).

**Shared bash:** `scripts/smoke-lib.sh` (`smoke_proxy_http_base`, `smoke_openai_v1_base`, `smoke_pick_fastest_probe_model`, `require_cli_or_skip`). **`pnpm smoke:clis`** runs `scripts/cli-smoke.sh` (all three; fails if any hard failure).

### Out of scope (intentional)

- **No multi-provider failover, no Redis, no metrics stack, no Docker, no auth providers, no DB.** Single-process runtime with file-backed probe history only.

## Convention notes

- `tsconfig.json` has `allowImportingTsExtensions: true`. Imports use `.ts` suffixes (`import { x } from "./foo.ts"`).
- ESM only (`"type": "module"`).
- `src/` is mostly flat. The `probe/` subtree is the owning home for the dashboard, scheduler, history, tests, and shared probe runner because the probe is now a concept family rather than one script.
