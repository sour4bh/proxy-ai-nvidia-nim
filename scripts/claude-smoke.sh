#!/usr/bin/env bash
# Check that Claude Code CLI can use this repo's proxy as Anthropic API (not curl smoke tests).
# Each run picks a random vocabulary word and asks for a very short poem that must include it.
#
# Loads env the same way as ~/.zshrc + this app:
#   ~/.env.secrets   — ANTHROPIC_API_KEY (and optional ANTHROPIC_BASE_URL, e.g. Tailscale like `ccn`)
#   .env             — PROXY_HOST, PROXY_PORT, NVIDIA_NIM_API_KEY, …
#
# If ANTHROPIC_BASE_URL is unset, sets it from PROXY_HOST:PROXY_PORT (local proxy).
# Claude Code still sends Authorization; the proxy ignores client Bearer and uses NVIDIA_NIM_API_KEY upstream.
#
# Optional:
#   CLAUDE_SMOKE_MODEL — `claude --model` (if unset, picks fastest "alive" model from GET $ANTHROPIC_BASE_URL/probe/state, else meta/llama-3.1-8b-instruct)
#   CLAUDE_SMOKE_MAX_USD — budget cap (default 1.0)
#   PROXYAI_SKIP_MISSING_CLIS — default 1: exit 0 if `claude` is not installed
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/scripts/smoke-lib.sh"

require_cli_or_skip claude "claude-smoke"

smoke_load_standard_env "$ROOT"

if [[ -z "${ANTHROPIC_BASE_URL:-}" ]]; then
  export ANTHROPIC_BASE_URL="$(smoke_proxy_http_base)"
fi

if [[ -z "${ANTHROPIC_API_KEY:-}" && -n "${NVIDIA_NIM_API_KEY:-}" ]]; then
  export ANTHROPIC_API_KEY="$NVIDIA_NIM_API_KEY"
fi

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "Missing ANTHROPIC_API_KEY (set in ~/.env.secrets or repo .env / .env.claude)." >&2
  exit 1
fi

# Custom Anthropic-compatible endpoints often reject experimental beta headers.
if [[ -n "${ANTHROPIC_BASE_URL:-}" ]]; then
  export CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS="${CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS:-1}"
fi

if [[ -n "${CLAUDE_SMOKE_MODEL:-}" ]]; then
  _model="$CLAUDE_SMOKE_MODEL"
else
  _model="$(smoke_pick_fastest_probe_model "${ANTHROPIC_BASE_URL%/}")"
fi

_word="$(smoke_random_word)"
printf 'claude-smoke: model=%s random_word=%s\n' "$_model" "$_word"
# Default permission mode (no bypass). No built-in tools — smoke stays a plain text completion via the proxy.
printf '%s\n' "--- claude-smoke: Claude Code output (stdout+stderr) ---"
set +e
claude \
  -p "Write a very short poem (at most 4 lines). The poem must include the word \"${_word}\" exactly (same spelling). Output only the poem lines as plain text. Do not use tools. Do not output JSON." \
  --bare \
  --model "${_model}" \
  --output-format text \
  --max-budget-usd="${CLAUDE_SMOKE_MAX_USD:-1.0}" \
  --permission-mode=default \
  --tools "" \
  2>&1
_ec=$?
set -e
printf '%s\n' "--- claude-smoke: exit ${_ec} ---"
exit "${_ec}"
