#!/bin/bash
# Serves the built app at http://localhost:5179/ (used by LaunchAgent).
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [[ ! -d dist ]]; then
  echo "[local-server] dist/ missing — run: npm run build" >&2
  exit 1
fi

exec /usr/local/bin/node "$PROJECT_DIR/node_modules/vite/bin/vite.js" preview --host 127.0.0.1 --port 5179 --strictPort
