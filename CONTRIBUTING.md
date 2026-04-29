# Contributing

Thanks for helping improve proxyai. This project is intentionally small:
a local OpenAI-compatible proxy for NVIDIA NIM with one process, in-memory
state, and clear HTTP contracts.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm typecheck
pnpm test
```

Set `NVIDIA_NIM_API_KEY` in `.env` before running live smoke tests or starting
the proxy.

## Development Commands

```bash
pnpm start
pnpm typecheck
pnpm test
pnpm probe
pnpm exec tsx --env-file=.env src/via-proxy.ts
```

## Pull Request Expectations

- Keep the proxy path wire-compatible with OpenAI Chat Completions.
- Do not route `/v1/chat/completions` through the AI SDK.
- Do not refund limiter slots after upstream 429 responses.
- Keep `/v1/chat/completions`, `/v1/messages`, and probe dashboard traffic on
  the shared limiter budget.
- Preserve the localhost/private-network security model unless the change is
  explicitly about adding a real auth layer.
- Add or update focused tests for behavior changes.
- Run `pnpm typecheck` and `pnpm test` before opening a PR.

## Good First Issues

Good starter work usually touches one contained surface:

- README examples and client setup notes.
- Probe dashboard display polish.
- Additional probe result tests.
- Small Anthropic translation edge cases with fixtures.
- Better diagnostics around queue wait, upstream timeout, or model aliases.

Avoid large rewrites, provider failover, Redis, Docker stacks, or auth systems
unless the issue is explicitly scoped that way.
