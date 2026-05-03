#!/usr/bin/env bash
# Smoke-test all HTTP routes exposed by src/server.ts + src/probe/routes.ts
# Usage: BASE_URL=http://127.0.0.1:3000 ./scripts/smoke-endpoints.sh
set -euo pipefail
BASE="${BASE_URL:-http://127.0.0.1:3000}"
fail=0
pass() { printf 'PASS %s\n' "$1"; }
failx() { printf 'FAIL %s — %s\n' "$1" "$2"; fail=1; }
code() { curl -sS -o /tmp/smoke_body -w '%{http_code}' "$@" || echo "000"; }

c=$(code "$BASE/health")
[[ "$c" == "200" ]] && pass "GET /health ($c)" || failx "GET /health" "got $c"

c=$(code "$BASE/probe")
[[ "$c" == "200" ]] && grep -q "ProxyAI Probe" /tmp/smoke_body && pass "GET /probe HTML ($c)" || failx "GET /probe" "got $c or wrong title"

c=$(code "$BASE/probe/state")
[[ "$c" == "200" ]] && jq -e . >/dev/null 2>&1 </tmp/smoke_body && pass "GET /probe/state JSON ($c)" || failx "GET /probe/state" "got $c or invalid JSON"

# Avoid pipefail SIGPIPE from curl when head closes the pipe early
if ( set +o pipefail; curl -sS -N --max-time 2.5 "$BASE/probe/stream" 2>/dev/null | head -1 | grep -q '^data:' ); then
  pass "GET /probe/stream (SSE first line)"
else
  failx "GET /probe/stream" "no data: line in first chunk"
fi

c=$(code "$BASE/probe/catalog")
if [[ "$c" == "200" ]] || [[ "$c" == "502" ]]; then
  pass "GET /probe/catalog ($c)"
else
  failx "GET /probe/catalog" "got $c"
fi

c=$(code -X POST "$BASE/probe/catalog/refresh")
if [[ "$c" == "200" ]] || [[ "$c" == "502" ]]; then
  pass "POST /probe/catalog/refresh ($c)"
else
  failx "POST /probe/catalog/refresh" "got $c"
fi

c=$(code "$BASE/probe/aliases")
[[ "$c" == "200" ]] && jq -e .aliases >/dev/null 2>&1 </tmp/smoke_body && pass "GET /probe/aliases ($c)" || failx "GET /probe/aliases" "got $c or bad shape"

c=$(code "$BASE/probe/config")
[[ "$c" == "200" ]] && jq -e '(.path | type) == "string"' >/dev/null 2>&1 </tmp/smoke_body && pass "GET /probe/config ($c)" || failx "GET /probe/config" "got $c or bad shape"

c=$(code -X PUT "$BASE/probe/aliases" -H 'Content-Type: application/json' -d '{"aliases":{"__smoke__":"__smoke_target__"}}')
if [[ "$c" == "200" ]]; then
  pass "PUT /probe/aliases set smoke alias ($c)"
else
  failx "PUT /probe/aliases" "got $c body=$(cat /tmp/smoke_body | head -c200)"
fi
# restore: remove only our smoke alias if others existed
aliases_json=$(curl -sS "$BASE/probe/aliases")
if echo "$aliases_json" | jq -e '.aliases | has("__smoke__")' >/dev/null 2>&1; then
  restored=$(echo "$aliases_json" | jq -c '.aliases | del(.__smoke__)')
  curl -sS -X PUT "$BASE/probe/aliases" -H 'Content-Type: application/json' -d "{\"aliases\":$restored}" -o /dev/null
fi

c=$(code -X PUT "$BASE/probe/aliases" -H 'Content-Type: application/json' -d '{"aliases":"bad"}')
[[ "$c" == "400" ]] && pass "PUT /probe/aliases invalid ($c)" || failx "PUT /probe/aliases invalid" "expected 400 got $c"

c=$(code -X POST "$BASE/probe/run")
if [[ "$c" == "202" ]] || [[ "$c" == "409" ]]; then
  pass "POST /probe/run ($c)"
else
  failx "POST /probe/run" "expected 202 or 409 got $c"
fi

c=$(code -X POST "$BASE/v1/responses" -H 'Content-Type: application/json' -d '{}')
[[ "$c" == "400" ]] && pass "POST /v1/responses invalid ($c)" || failx "POST /v1/responses invalid" "expected 400 got $c"

c=$(code "$BASE/v1/models")
[[ "$c" == "200" ]] && pass "GET /v1/models ($c)" || failx "GET /v1/models" "got $c"

c=$(code -X POST "$BASE/v1/chat/completions" -H 'Content-Type: application/json' -d '{}')
[[ "$c" == "400" ]] && pass "POST /v1/chat/completions invalid ($c)" || failx "POST /v1/chat/completions invalid" "expected 400 got $c"

c=$(code -X POST "$BASE/v1/messages" -H 'Content-Type: application/json' -d '{}')
[[ "$c" == "400" ]] && pass "POST /v1/messages invalid ($c)" || failx "POST /v1/messages invalid" "expected 400 got $c"

c=$(code -X POST "$BASE/v1/embeddings" -H 'Content-Type: application/json' -d '{}')
[[ "$c" == "501" ]] && pass "POST /v1/embeddings ($c)" || failx "POST /v1/embeddings" "expected 501 got $c"

c=$(code -X POST "$BASE/v1/completions" -H 'Content-Type: application/json' -d '{}')
[[ "$c" == "501" ]] && pass "POST /v1/completions ($c)" || failx "POST /v1/completions" "expected 501 got $c"

c=$(code "$BASE/__no_such_route__")
[[ "$c" == "404" ]] && pass "GET unknown ($c)" || failx "GET unknown" "expected 404 got $c"

if [[ "$fail" -eq 0 ]]; then
  printf '\nAll smoke checks passed.\n'
  exit 0
else
  printf '\nSome checks failed.\n'
  exit 1
fi
