#!/usr/bin/env bash
set -euo pipefail

# Assert that a prebuilds directory holds a binary for every platform the
# package ships, plus the musl build. The deploy and publish jobs in
# .github/workflows/builds.yml and bin/deploy.sh all run this, so the
# platform list lives in one place.
# Usage: bin/check-prebuilds.sh [dir]   (default: prebuilds)

DIR="${1:-prebuilds}"
missing=0

for p in darwin-arm64 linux-x64 linux-arm64 win32-x64 win32-arm64; do
  if [[ -z "$(find "$DIR/$p" -name '*.node' -print -quit 2>/dev/null)" ]]; then
    echo "MISSING: $DIR/$p"
    missing=1
  fi
done

# Alpine builds into linux-x64 alongside the glibc build, so assert the
# musl-tagged file specifically rather than just the directory.
if [[ -z "$(find "$DIR" -name '*.musl.node' -print -quit 2>/dev/null)" ]]; then
  echo "MISSING: any musl-tagged prebuild"
  missing=1
fi

exit "$missing"
