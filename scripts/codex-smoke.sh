#!/usr/bin/env bash
# Smoke-test OpenAI Codex CLI against this repo's proxy (Responses API → NIM via POST /v1/responses).
#
# Requires: running proxy, NVIDIA_NIM_API_KEY (or OPENAI_API_KEY), `codex` on PATH.
# Optional: CODEX_SMOKE_MODEL, PROXYAI_SKIP_MISSING_CLIS (default 1: skip if codex missing).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/scripts/smoke-lib.sh"

require_cli_or_skip codex "codex-smoke"

smoke_load_standard_env "$ROOT"

export OPENAI_API_KEY="${OPENAI_API_KEY:-${NVIDIA_NIM_API_KEY:-}}"
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "codex-smoke: Missing OPENAI_API_KEY or NVIDIA_NIM_API_KEY." >&2
  exit 1
fi

_openai_base="$(smoke_openai_v1_base)"
if [[ -n "${CODEX_SMOKE_MODEL:-}" ]]; then
  _model="$CODEX_SMOKE_MODEL"
else
  _model="$(smoke_pick_fastest_probe_model "$(smoke_proxy_http_base)")"
fi

_word="$(smoke_random_word)"
printf 'codex-smoke: openai_base_url=%s model=%s random_word=%s\n' "$_openai_base" "$_model" "$_word"
printf '%s\n' "--- codex-smoke: Codex output (stdout+stderr) ---"
set +e
codex exec --ignore-user-config --skip-git-repo-check --sandbox read-only \
  -c "openai_base_url=\"${_openai_base}\"" \
  -c "model=\"${_model}\"" \
  "Write a very short poem (at most 4 lines). The poem must include the word \"${_word}\" exactly (same spelling). Output only the poem lines as plain text. Do not run shell commands or edit files." \
  2>&1
_ec=$?
set -e
printf '%s\n' "--- codex-smoke: exit ${_ec} ---"
exit "${_ec}"
