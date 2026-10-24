#!/usr/bin/env bash
# Runs all self-checks (src/**/*.check.ts) with node. Exit 1 on the first failure.
# Usage: bash scripts/test.sh   (or: npm test)
set -e
cd "$(dirname "$0")/.."
export NODE_NO_WARNINGS=1
for f in $(find src -name '*.check.ts' | sort); do
  node "$f"
  echo "✅ $f"
done
