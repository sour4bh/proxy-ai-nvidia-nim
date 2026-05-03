#!/usr/bin/env bash
# Smoke-test Cursor Agent CLI in headless mode (uses Cursor cloud + your subscription, not this proxy).
# Validates `cursor agent` works beside Claude/Codex smokes for the same repo checkout.
#
# Requires: CURSOR_API_KEY or `cursor login`, `cursor` on PATH.
# Optional: CURSOR_SMOKE_MODEL (default gpt-5-mini), PROXYAI_SKIP_MISSING_CLIS (default 1).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/scripts/smoke-lib.sh"

require_cli_or_skip cursor "cursor-smoke"

_cfg="$(mktemp -d "${TMPDIR:-/tmp}/proxyai-cursor-smoke.XXXXXX")"
cleanup() { rm -rf "$_cfg"; }
trap cleanup EXIT

# Minimal CLI config: deny built-in tools and network fetch; no blanket bypass flags.
printf '%s\n' '{"version":1,"editor":{"vimMode":false},"permissions":{"allow":[],"deny":["Shell(*)","Write(**)","Read(**)","WebFetch(*)","Mcp(*:*)"]}}' >"$_cfg/cli-config.json"
export CURSOR_CONFIG_DIR="$_cfg"

_model="${CURSOR_SMOKE_MODEL:-auto}"
_word="$(smoke_random_word)"
printf 'cursor-smoke: model=%s random_word=%s (Cursor cloud; not the NIM proxy)\n' "$_model" "$_word"
printf '%s\n' "--- cursor-smoke: Cursor Agent output (stdout+stderr) ---"
set +e
cursor agent \
  -p "Write a very short poem (at most 4 lines). The poem must include the word \"${_word}\" exactly (same spelling). Output only the poem lines as plain text." \
  --trust \
  --workspace "$ROOT" \
  --mode ask \
  --model "${_model}" \
  --output-format text \
  2>&1
_ec=$?
set -e
printf '%s\n' "--- cursor-smoke: exit ${_ec} ---"
exit "${_ec}"
