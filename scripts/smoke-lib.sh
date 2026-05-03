#!/usr/bin/env bash
# shellcheck shell=bash
# Shared helpers for CLI smoke scripts. Source after: ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"; source "$ROOT/scripts/smoke-lib.sh"

smoke_load_env_file() {
  local f="$1"
  if [[ -f "$f" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$f"
    set +a
  fi
}

# Same order as ~/.zshrc: personal secrets (optional), then app .env / .env.claude
smoke_load_standard_env() {
  local root="$1"
  if [[ -f "$HOME/.env.secrets" ]]; then
    smoke_load_env_file "$HOME/.env.secrets"
  fi
  smoke_load_env_file "$root/.env"
  smoke_load_env_file "$root/.env.claude"
}

# Base URL without path, e.g. http://127.0.0.1:3000 (for /probe/state and ANTHROPIC_BASE_URL).
smoke_proxy_http_base() {
  if [[ -n "${ANTHROPIC_BASE_URL:-}" ]]; then
    printf "%s" "${ANTHROPIC_BASE_URL%/}"
    return 0
  fi
  local ph="${PROXY_HOST:-127.0.0.1}"
  local pp="${PROXY_PORT:-3000}"
  if [[ "$ph" == "0.0.0.0" ]]; then
    ph="127.0.0.1"
  fi
  printf "http://%s:%s" "$ph" "$pp"
}

# OpenAI-style base including /v1 (Codex `openai_base_url`).
smoke_openai_v1_base() {
  printf "%s/v1" "$(smoke_proxy_http_base)"
}

# Fastest alive chat model from GET {base}/probe/state (same jq filter as claude-smoke).
smoke_pick_fastest_probe_model() {
  local base="${1%/}"
  local url="${base}/probe/state"
  local id=""
  id="$(
    curl -fsS --max-time 5 "$url" 2>/dev/null | jq -r '
      [.latest.results[]?
        | select(.category == "alive" and (.ms | type == "number") and (.id | type == "string"))
        | select(.id | test("(^nvidia/gliner|^nvidia/ising-calibration)"; "i") | not)]
      | sort_by(.ms)
      | (.[0].id // empty)
    ' 2>/dev/null || true
  )"
  if [[ -n "$id" ]]; then
    printf "%s" "$id"
    return 0
  fi
  printf "%s" "meta/llama-3.1-8b-instruct"
}

smoke_random_word() {
  local words=(
    lichen aurora velcro semaphore thimble quasar parchment harbor velvet labyrinth
    nutmeg echo granite marigold compass whittle orbit lantern cobble tide
  )
  printf "%s" "${words[$((RANDOM % ${#words[@]}))]}"
}

# Skip if CLI is missing: exit 0 when PROXYAI_SKIP_MISSING_CLIS=1 (default), else 127.
require_cli_or_skip() {
  local bin="$1"
  local label="$2"
  if command -v "$bin" >/dev/null 2>&1; then
    return 0
  fi
  printf '%s: SKIP (%s not in PATH). Set PROXYAI_SKIP_MISSING_CLIS=0 to fail instead.\n' "$label" "$bin" >&2
  if [[ "${PROXYAI_SKIP_MISSING_CLIS:-1}" == "1" ]]; then
    exit 0
  fi
  exit 127
}
