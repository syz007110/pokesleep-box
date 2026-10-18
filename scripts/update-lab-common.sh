#!/usr/bin/env bash
# Refresh the vendored Neroli's Lab common/ package.
# Usage: bash scripts/update-lab-common.sh [ref]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="${1:-}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Cloning nerolis-lab..."
git clone --depth 1 ${REF:+--branch "$REF"} https://github.com/nerolis-lab/nerolis-lab.git "$TMP/nerolis-lab"
COMMIT="$(git -C "$TMP/nerolis-lab" rev-parse HEAD)"
TAG="$(git -C "$TMP/nerolis-lab" describe --tags --always)"

DEST="$ROOT/vendor/nerolis-lab"
rm -rf "$DEST/common/src"
mkdir -p "$DEST/common"
cp -a "$TMP/nerolis-lab/common/src" "$DEST/common/src"
find "$DEST/common/src" -name '*.test.ts' -delete
find "$DEST/common/src" -type d -name '__snapshots__' -exec rm -rf {} + 2>/dev/null || true
rm -rf "$DEST/common/src/vitest"
cp "$TMP/nerolis-lab/LICENSE" "$DEST/LICENSE"
cp "$TMP/nerolis-lab/NOTICE" "$DEST/NOTICE"

cat > "$DEST/SOURCE.txt" <<EOF
Source: https://github.com/nerolis-lab/nerolis-lab
Package: common/ (sleepapi-common)
Commit: ${COMMIT}
Tag: ${TAG}
License: Apache-2.0
Copied: $(date -u +%Y-%m-%d)
Update: run scripts/update-lab-common.sh
EOF

echo "Updated vendor/nerolis-lab to ${COMMIT} (${TAG})"
echo "Run tests afterwards: npm test"
