# proxyai

**OpenAI-compatible NVIDIA NIM proxy for local AI tools, coding agents, and TypeScript apps.**

[![CI](https://github.com/sour4bh/proxyai/actions/workflows/ci.yml/badge.svg)](https://github.com/sour4bh/proxyai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6)
![Hono](https://img.shields.io/badge/Hono-HTTP%20proxy-ff5b11)
![NVIDIA NIM](https://img.shields.io/badge/NVIDIA%20NIM-compatible-76b900)
![OpenAI API](https://img.shields.io/badge/OpenAI%20API-compatible-111827)

`proxyai` is a small TypeScript/Hono AI gateway that turns NVIDIA NIM into a
local OpenAI-compatible and Anthropic-compatible endpoint. Point Cursor, Aider,
Claude-compatible clients, shell scripts, AI SDK apps, or your own local tools
at one private proxy and let it handle model aliases, request shaping, rolling
rate limits, upstream 429 pauses, and model health probes.

Use it when you want NVIDIA NIM's free-tier API behind a local LLM proxy with
OpenAI Chat Completions compatibility, an Anthropic Messages adapter, a live
rate-limit dashboard, and zero Redis, database, Docker, or hosted gateway
requirements.

## Why proxyai

- **OpenAI-compatible Chat Completions** at `/v1/chat/completions`, with
  wire-format pass-through for clients that depend on OpenAI-shaped behavior.
- **Anthropic Messages compatibility** at `/v1/messages`, backed by NIM's
  OpenAI-compatible Chat Completions endpoint.
- **Shared rolling-window limiter** tuned for NIM's free-tier budget, including
  FIFO queueing, client-abort cleanup, and upstream `Retry-After` pauses.
- **Model aliases** from CLI flags, so local clients can ask for names like
  `gpt-4o` or `claude-sonnet` while NIM receives real model IDs.
- **Probe dashboard** at `/probe` with scheduled model checks, retained history,
  live client traffic, and temporal rate-limit usage.
- **Local-first runtime** with one Node.js process and in-memory state.

## Common Use Cases

- Run coding agents and OpenAI-compatible tools against NVIDIA NIM models.
- Give Anthropic-shaped clients a local compatibility endpoint backed by NIM.
- Share one local/Tailscale NIM budget across multiple clients without
  accidentally bursting past the upstream rate limit.
- Discover which public NIM chat models are alive, slow, timing out, or failing.
- Build a minimal OpenAI-compatible proxy without adopting a full multi-provider
  gateway stack.

## What This Is Not

- Not a multi-provider gateway.
- Not a production multi-tenant service.
- Not an auth server.
- Not a Redis-backed distributed limiter.
- Not a Dockerized deployment stack.
- Not an npm package intended for publication today.

The runtime is intentionally single-process and in-memory.

## Security Model

By default the proxy binds to `127.0.0.1:3000`. Keep it there unless you have a
real private network boundary such as Tailscale, a VPN, or a locked-down
firewall.

There is no client authentication. Any client `Authorization` header is ignored
for upstream purposes; the proxy always sends its own
`Bearer NVIDIA_NIM_API_KEY` header to NIM. Do not expose this process directly
to the public internet.

## Requirements

- Node.js 20 or newer with built-in `fetch`, `AbortSignal.timeout`, and
  `AbortSignal.any`.
- pnpm 10.x.
- An NVIDIA NIM API key in `NVIDIA_NIM_API_KEY`.

Install dependencies:

```bash
pnpm install
```

Create a local `.env` file:

```bash
cp .env.example .env
```

Then set your NIM key:

```bash
NVIDIA_NIM_API_KEY=your_nim_key_here
```

The scripts use `tsx --env-file=.env`, so `.env` is loaded by `tsx`. The
`dotenv` package is installed but not imported by the runtime.

## Quick Start

Start the proxy:

```bash
pnpm start
```

Start with model aliases:

```bash
pnpm start --alias gpt-4o=meta/llama-3.3-70b-instruct \
           --alias claude-sonnet=meta/llama-3.3-70b-instruct
```

Call the OpenAI-compatible endpoint:

```bash
curl http://127.0.0.1:3000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer unused' \
  -d '{
    "model": "gpt-4o",
    "messages": [
      { "role": "user", "content": "Say hello in one sentence." }
    ]
  }'
```

Call the Anthropic Messages endpoint:

```bash
curl http://127.0.0.1:3000/v1/messages \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: unused' \
  -d '{
    "model": "claude-sonnet",
    "max_tokens": 256,
    "messages": [
      { "role": "user", "content": "Say hello in one sentence." }
    ]
  }'
```

List models:

```bash
curl http://127.0.0.1:3000/v1/models
```

Check health and limiter state:

```bash
curl http://127.0.0.1:3000/health
```

Open the probe dashboard:

```text
http://127.0.0.1:3000/probe
```

## Commands

```bash
pnpm start
pnpm start --alias gpt-4o=meta/llama-3.3-70b-instruct
pnpm typecheck
pnpm test

pnpm hello
pnpm agent
pnpm exec tsx --env-file=.env src/via-proxy.ts
pnpm probe
```

Command purposes:

| Command | Purpose |
| --- | --- |
| `pnpm start` | Start the local proxy. |
| `pnpm typecheck` | Run `tsc --noEmit`. |
| `pnpm test` | Run probe subsystem tests with Node's test runner through `tsx`. |
| `pnpm hello` | Smoke test the AI SDK directly against NIM. |
| `pnpm agent` | Smoke test an AI SDK `ToolLoopAgent` directly against NIM. |
| `src/via-proxy.ts` | Smoke test the AI SDK through the local proxy. |
| `pnpm probe` | Run the CLI version of the upstream NIM model probe. |

## Configuration

Runtime configuration is owned by `src/config.ts`.

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NVIDIA_NIM_API_KEY` | Yes | none | API key sent to NVIDIA NIM. |
| `PROXY_HOST` | No | `127.0.0.1` | Hostname/interface to bind. |
| `PROXY_PORT` | No | `3000` | Port to bind. |
| `PROXY_RATE_CAPACITY` | No | `40` | Requests allowed per rolling window. |
| `PROXY_RATE_WINDOW_MS` | No | `60000` | Rolling rate-limit window. |
| `PROXY_MAX_QUEUE_WAIT_MS` | No | `30000` | Max local queue wait before 429. |
| `PROXY_UPSTREAM_TIMEOUT_MS` | No | `600000` | Max upstream fetch duration. |
| `PROBE_TIMEOUT_MS` | No | `30000` | Probe-only per-model timeout. |
| `PROBE_CONCURRENCY` | No | `3` | Probe-only upstream concurrency. |
| `PROBE_INTERVAL_MS` | No | `21600000` | Scheduled dashboard probe interval. |
| `PROBE_HISTORY_LIMIT` | No | `30` | Retained probe run count. |
| `PROBE_HISTORY_DIR` | No | `.probe-history` | File-backed probe history directory. |
| `PROBE_CLIENT_QUIET_MS` | No | `30000` | Quiet window after client traffic before dashboard probes resume. |

The NIM base URL is currently fixed in code:

```text
https://integrate.api.nvidia.com/v1
```

Aliases are CLI flags, not environment variables:

```bash
pnpm start --alias local-name=upstream/model-id
pnpm start --alias=another-name=upstream/model-id
```

Unknown model names pass through unchanged.

## HTTP API

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/health` | Returns limiter state, rolling-window usage, and live client traffic. |
| `GET` | `/probe` | Browser dashboard for scheduled and manual probes. |
| `GET` | `/probe/state` | JSON scheduler state, active run, latest run, history, rate-limit usage, and probe config. |
| `POST` | `/probe/run` | Starts a manual probe, or returns 409 if another probe is active. |
| `GET` | `/v1/models` | Returns alias model entries plus cached upstream NIM models. |
| `POST` | `/v1/chat/completions` | OpenAI-compatible Chat Completions proxy. |
| `POST` | `/v1/messages` | Anthropic Messages adapter over NIM Chat Completions. |
| `POST` | `/v1/embeddings` | Explicit 501. |
| `POST` | `/v1/completions` | Explicit 501. |
| any | any other path | OpenAI-shaped 404. |

## Project Layout

```text
src/
  server.ts      HTTP routes and process boot
  config.ts      environment and CLI configuration
  aliases.ts     model alias resolution
  limiter.ts     rolling-window FIFO limiter
  proxy.ts       OpenAI Chat Completions proxy
  anthropic.ts   Anthropic Messages translation
  models.ts      upstream model cache and /v1/models response
  errors.ts      OpenAI-shaped error helpers
  log.ts         request IDs and JSON logs
  probe/         probe runner, history, scheduler, routes, dashboard, tests

  nim.ts         direct AI SDK NIM client for smoke scripts
  hello.ts       direct NIM text smoke test
  agent.ts       direct NIM tool-agent smoke test
  via-proxy.ts   AI SDK smoke test through the local proxy
  probe.ts       CLI entry for the upstream NIM model probe
```

The runtime proxy files do not import the AI SDK. The AI SDK is isolated to
smoke/example scripts.

## How It Works

### Startup

```text
pnpm start
  |
  v
tsx --env-file=.env src/server.ts
  |
  +--> src/config.ts parses env and CLI aliases
  +--> src/proxy.ts creates the shared limiter
  +--> src/traffic.ts tracks live proxy client activity
  +--> src/models.ts loads upstream models once
  +--> src/probe/controller.ts schedules probe runs after boot
  +--> Hono serves routes on PROXY_HOST:PROXY_PORT
```

`src/server.ts` owns routing and boot. Before the HTTP server starts,
`loadUpstreamModels()` fetches NIM's `/models` endpoint and stores the result in
memory. If that upstream fetch fails, the cache becomes an empty list and the
server still boots.

The probe scheduler starts from the server listen callback. It runs once shortly
after boot and then every `PROBE_INTERVAL_MS`. Results are written under
`PROBE_HISTORY_DIR` and bounded by `PROBE_HISTORY_LIMIT`.

`src/traffic.ts` watches real proxy traffic on `/v1/chat/completions` and
`/v1/messages`. It counts a client as active until the response body is fully
consumed, so long streaming responses keep background probes paused.

### OpenAI Chat Completions Pipeline

```text
client POST /v1/chat/completions
  |
  v
src/proxy.ts
  |
  +--> parse JSON
  +--> validate only { model, stream? }
  +--> resolve alias
  +--> preserve all other request fields
  +--> acquire shared limiter slot
  +--> fetch NIM /chat/completions
  |
  +--> non-stream: return upstream status/body
  +--> stream: return SSE stream with mid-stream error framing
```

This pipeline is intentionally close to wire-format pass-through. The handler
parses JSON only so it can read `model` and `stream`; the forwarded body keeps
the caller's fields and overwrites only `model` with its resolved NIM model ID.

That matters for tools that depend on exact OpenAI-shaped request and response
behavior. Running this path through an SDK would add another layer of
serialization, defaulting, and validation, which is not what the proxy owns.

### Anthropic Messages Pipeline

```text
client POST /v1/messages
  |
  v
src/anthropic.ts
  |
  +--> parse Anthropic request
  +--> resolve alias
  +--> translate Anthropic messages/tools/tool_choice to OpenAI
  +--> acquire shared limiter slot
  +--> fetch NIM /chat/completions
  |
  +--> non-stream: translate OpenAI response to Anthropic message
  +--> stream: translate OpenAI SSE chunks to Anthropic SSE events
```

This path exists because some clients are built around the Anthropic Messages
API, while NIM exposes OpenAI-compatible Chat Completions. The adapter keeps
that translation in one file and still sends the actual model request through
NIM's `/chat/completions`.

Request translation includes:

| Anthropic input | OpenAI request |
| --- | --- |
| `system` string or text blocks | Prepended `system` message. |
| user/assistant text | `content` on chat messages. |
| assistant `tool_use` blocks | `tool_calls`. |
| user `tool_result` blocks | `role: "tool"` messages. |
| tool `input_schema` | function `parameters`. |
| `tool_choice: "any"` | `tool_choice: "required"`. |
| `{ "type": "tool", "name": ... }` | OpenAI function tool choice. |

Response translation includes:

| OpenAI response | Anthropic response |
| --- | --- |
| assistant text | `content` text block. |
| `tool_calls` | `tool_use` content blocks. |
| `finish_reason: "tool_calls"` | `stop_reason: "tool_use"`. |
| `finish_reason: "length"` | `stop_reason: "max_tokens"`. |
| token usage | `input_tokens` and `output_tokens`. |

Streaming translation asks upstream for OpenAI streaming usage with
`stream_options.include_usage`, reads OpenAI SSE `data:` chunks, and emits
Anthropic SSE events such as `message_start`, `content_block_start`,
`content_block_delta`, `content_block_stop`, `message_delta`, and
`message_stop`. Final upstream `prompt_tokens` and `completion_tokens` are
forwarded as Anthropic `input_tokens` and `output_tokens` in `message_delta`.

### Shared Limiter

Both `/v1/chat/completions` and `/v1/messages` share the same limiter instance.
That is important because both routes spend the same upstream NIM request
budget.

The limiter keeps four pieces of in-memory state:

- `timestamps`: admitted request times inside the rolling window.
- `queue`: FIFO waiters that could not be admitted immediately.
- `pausedUntil`: local pause set after upstream 429 responses.
- `wakeTimer`: one timer that drains the queue when capacity becomes available.

`limiter.snapshot()` exposes this state as a read-only temporal view for
`/health` and the probe dashboard: capacity, window length, admitted request
timestamps inside the current rolling window, remaining slots, queue depth,
pause timing, and next-slot timing. The dashboard polls `/health` every second
for the small live rate-limit view and polls `/probe/state` separately for the
larger probe result payload.

Flow:

```text
request reaches handler
  |
  v
limiter.acquire(clientAbortSignal)
  |
  +--> if signal already aborted: reject as AbortedError
  +--> prune timestamps older than the window
  +--> if capacity is available and not paused: admit immediately
  +--> otherwise enqueue waiter
          |
          +--> max queue wait timer can reject with QueueTimeoutError
          +--> client abort can reject with AbortedError
          +--> wake timer drains FIFO when a slot opens
```

When NIM returns 429, the proxy does not retry and does not refund the local
slot. The request already reached NIM, so refunding it would let the proxy
oversend. Instead, the handler forwards the upstream response to the caller and
pauses future queue admission based on `Retry-After` when available.

### Timeouts And Abort Behavior

There are two separate clocks:

- `PROXY_MAX_QUEUE_WAIT_MS`: how long a request may wait locally for a limiter
  slot.
- `PROXY_UPSTREAM_TIMEOUT_MS`: how long the upstream NIM fetch may run after a
  slot is acquired.

The upstream fetch combines the client disconnect signal with the proxy timeout
signal. If the caller disconnects, queued waiters are removed without burning a
slot. If the upstream fetch times out, the proxy returns a timeout error to the
caller.

### Error Shapes

The OpenAI-compatible route returns OpenAI-shaped errors:

```json
{
  "error": {
    "message": "Request timed out in proxy queue after 30000ms.",
    "type": "rate_limit_exceeded",
    "code": "queue_timeout",
    "param": null
  }
}
```

The Anthropic Messages route returns Anthropic-shaped errors:

```json
{
  "type": "error",
  "error": {
    "type": "rate_limit_error",
    "message": "Request timed out in proxy queue after 30000ms."
  }
}
```

Notable cases:

| Case | OpenAI route | Anthropic route |
| --- | --- | --- |
| Invalid JSON | 400 invalid request | 400 invalid request |
| Missing required fields | 400 invalid request | 400 invalid request |
| Local queue timeout | 429 plus `Retry-After` | 429 plus `Retry-After` |
| Client abort while queued | 499 raw `Response` | 499 raw `Response` |
| Upstream timeout | 504 | 504 |
| Upstream unavailable | 502 | 502 |
| Upstream 429 | Forwarded, limiter paused | Forwarded, limiter paused |
| Unsupported endpoint | 501 | not applicable |

The OpenAI route wraps non-JSON upstream errors into an OpenAI error object so
clients can parse failures consistently.

### Probe Dashboard Pipeline

```text
server boot
  |
  +--> ProbeController schedules first run after boot
  |
  v
scheduled or manual probe
  |
  +--> fetch NIM /models
  +--> filter likely non-chat models
  +--> for each chat candidate:
          wait until no live clients and PROBE_CLIENT_QUIET_MS has elapsed
          acquire shared limiter slot
          POST NIM /chat/completions with max_tokens=1024
          classify alive, timeout, rate_limited, error, or skipped
  +--> persist run JSON to PROBE_HISTORY_DIR
  +--> update latest.json and retain last PROBE_HISTORY_LIMIT runs
```

The dashboard lives at `/probe`. It polls `/probe/state`, shows the active run
or latest run, summarizes counts by category, lists failed/slow/rate-limited
models, shows retained history, and renders live rolling-window rate-limit
usage from `/health`. The Run Now button calls `POST /probe/run`; if a probe is
already active, the route returns 409 with the current run.

Probe run JSON uses this shape:

```ts
type ProbeRun = {
  id: string;
  source: "scheduled" | "manual" | "cli";
  status: "running" | "completed" | "failed";
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  config: {
    timeoutMs: number;
    concurrency: number;
    maxTokens: number;
    clientQuietMs: number;
    modelCount: number;
    skippedModelCount: number;
  };
  counts: Record<"alive" | "timeout" | "rate_limited" | "error" | "skipped", number>;
  results: ProbeResult[];
};
```

Dashboard probes are background traffic. Before each model probe, the server
waits until no proxy clients are active and the most recent client activity is
older than `PROBE_CLIENT_QUIET_MS`; if a client starts using the proxy mid-run,
the next model probe pauses again. Once quiet, dashboard probes still acquire
the same shared limiter as `/v1/chat/completions` and `/v1/messages`, so
model-health traffic does not bypass the upstream NIM budget.

## Client Examples

### OpenAI-Compatible Tools

Point the client at:

```text
http://127.0.0.1:3000/v1
```

Use any API key value on the client side. It is ignored by the proxy.

Use a real NIM model ID directly, or start the proxy with aliases that match the
model names expected by your tool.

### AI SDK Through The Proxy

```ts
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

const proxy = createOpenAICompatible({
  name: "proxy",
  baseURL: "http://127.0.0.1:3000/v1",
  apiKey: "unused",
});

const { text } = await generateText({
  model: proxy.chatModel("gpt-4o"),
  prompt: "Explain proxyai in one sentence.",
});

console.log(text);
```

### Anthropic-Compatible Tools

Point the client at:

```text
http://127.0.0.1:3000
```

Use any API key value on the client side. Start the proxy with aliases that map
the client's Anthropic model names to NIM model IDs.

For example:

```bash
pnpm start --alias claude-sonnet=meta/llama-3.3-70b-instruct
```

## Development Notes

- ESM only. `package.json` has `"type": "module"`.
- TypeScript uses `moduleResolution: "NodeNext"`.
- Imports include `.ts` suffixes.
- `src/` is intentionally flat: one file per concept, no generic handler or
  service folders.
- Keep the runtime proxy path free of AI SDK imports.
- Preserve pass-through behavior in `src/proxy.ts`.
- Run `pnpm typecheck` and `pnpm test` before publishing changes.

The probe subsystem has focused tests for result classification, file-history
retention, and overlapping manual run rejection. Other runtime behavior is
verified with typecheck and smoke scripts.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md)
before changing proxy behavior, especially the pass-through request path,
limiter semantics, or Anthropic translation layer.

## Security

`proxyai` intentionally has no client authentication. Run it on localhost or a
private network boundary, and do not expose it directly to the public internet.
See [SECURITY.md](SECURITY.md) for vulnerability reporting and deployment
guidance.

## License

MIT. See [LICENSE](LICENSE).
