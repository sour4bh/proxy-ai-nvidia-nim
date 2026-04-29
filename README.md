# proxyai

Local OpenAI-compatible HTTP proxy for NVIDIA NIM.

`proxyai` lets tools that speak OpenAI's Chat Completions API point at a local
server while the proxy forwards requests to NVIDIA NIM at
`https://integrate.api.nvidia.com/v1`. It is designed for local development,
coding agents, command-line clients, and applications that need an
OpenAI-shaped endpoint backed by NIM models.

The proxy also exposes a small Anthropic Messages compatibility endpoint. That
path translates Anthropic-shaped requests into OpenAI Chat Completions requests,
sends them to NIM, and translates the result back.

## What This Is

- A local HTTP proxy with OpenAI-compatible `/v1/chat/completions`.
- A shared rolling-window rate limiter tuned by default to 40 requests per
  60 seconds.
- CLI-driven model aliases, so clients can ask for names like `gpt-4o` while
  NIM receives a real model ID.
- An Anthropic Messages adapter at `/v1/messages`.
- A set of smoke scripts for direct NIM calls, local proxy calls, agent/tool
  calls, and upstream model probing.

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

- Node.js with built-in `fetch`, `AbortSignal.timeout`, and
  `AbortSignal.any`.
- pnpm 10.x.
- An NVIDIA NIM API key in `NVIDIA_NIM_API_KEY`.

Install dependencies:

```bash
pnpm install
```

Create a local `.env` file:

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

## Commands

```bash
pnpm start
pnpm start --alias gpt-4o=meta/llama-3.3-70b-instruct
pnpm typecheck

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
| `pnpm hello` | Smoke test the AI SDK directly against NIM. |
| `pnpm agent` | Smoke test an AI SDK `ToolLoopAgent` directly against NIM. |
| `src/via-proxy.ts` | Smoke test the AI SDK through the local proxy. |
| `pnpm probe` | Probe upstream NIM chat-capable models. |

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
| `GET` | `/health` | Returns `{ ok, queueDepth, inUse }`. |
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

  nim.ts         direct AI SDK NIM client for smoke scripts
  hello.ts       direct NIM text smoke test
  agent.ts       direct NIM tool-agent smoke test
  via-proxy.ts   AI SDK smoke test through the local proxy
  probe.ts       upstream NIM model probe
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
  +--> src/models.ts loads upstream models once
  +--> Hono serves routes on PROXY_HOST:PROXY_PORT
```

`src/server.ts` owns routing and boot. Before the HTTP server starts,
`loadUpstreamModels()` fetches NIM's `/models` endpoint and stores the result in
memory. If that upstream fetch fails, the cache becomes an empty list and the
server still boots.

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
- Run `pnpm typecheck` before publishing changes.

There are currently no automated `*.test.*` or `*.spec.*` files. Runtime
behavior is verified with typecheck and smoke scripts. For open-source growth,
the highest-value tests would cover limiter timing, abort cleanup, upstream 429
pause behavior, non-JSON error wrapping, OpenAI stream interruption framing, and
Anthropic request/response translation.
