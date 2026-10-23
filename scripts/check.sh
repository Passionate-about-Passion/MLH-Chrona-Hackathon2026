#!/usr/bin/env bash
# One-shot health check for the bug routine. Prints a short summary per step.
# Usage: bash scripts/check.sh            (exit 0 = all green)
set -u
cd "$(dirname "$0")/.."
fail=0
run() {
  local name="$1"; shift
  local out
  if out=$("$@" 2>&1); then
    echo "✅ $name"
  else
    fail=1
    echo "❌ $name"
    echo "$out" | grep -E "error|Error|warning|✗|failed|Type error|\.tsx?:[0-9]+" | head -25 | sed 's/^/   /'
  fi
}
git pull --quiet --rebase 2>/dev/null || echo "⚠️  git pull failed (local changes?) – checking local state"
echo "Commit: $(git log -1 --format='%h %s' 2>/dev/null)"
run "lint" npm run --silent lint
run "typecheck" npm run --silent typecheck
run "build" npm run --silent build
if grep -q '^MOCK=1' .env.local 2>/dev/null; then echo "ℹ️  MOCK=1 aktiv (vor der Demo auf 0 stellen)"; fi
exit $fail
