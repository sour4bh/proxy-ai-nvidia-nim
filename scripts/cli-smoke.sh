#!/usr/bin/env bash
# Run Claude Code, Codex, and Cursor Agent CLI smokes in sequence (see individual scripts).
# Exit 1 if any non-skip script exits non-zero.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0
run() {
  local name="$1"
  shift
  printf '\n========== %s ==========\n' "$name"
  if "$@"; then
    printf 'OK %s\n' "$name"
  else
    local c=$?
    printf 'FAIL %s (exit %s)\n' "$name" "$c" >&2
    fail=1
  fi
}

run "claude-smoke" "$ROOT/scripts/claude-smoke.sh"
run "codex-smoke" "$ROOT/scripts/codex-smoke.sh"
run "cursor-smoke" "$ROOT/scripts/cursor-smoke.sh"

if [[ "$fail" -eq 0 ]]; then
  printf '\nAll CLI smokes passed (skipped CLIs count as pass).\n'
  exit 0
fi
exit 1
