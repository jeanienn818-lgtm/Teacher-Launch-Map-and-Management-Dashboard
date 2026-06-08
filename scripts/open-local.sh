#!/bin/bash
# Start local server if needed, then open the page in your browser.
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$HOME/Library/Logs/onboarding-summit-map"
mkdir -p "$LOG_DIR"

is_listening() {
  lsof -nP -iTCP:5179 -sTCP:LISTEN >/dev/null 2>&1
}

if [[ ! -d "$PROJECT_DIR/dist" ]]; then
  echo "Building…"
  (cd "$PROJECT_DIR" && npm run build)
fi

if ! is_listening; then
  echo "Starting server on http://localhost:5179/ …"
  nohup /bin/bash "$PROJECT_DIR/scripts/local-server.sh" >> "$LOG_DIR/server.log" 2>> "$LOG_DIR/server.err.log" &
  for i in {1..20}; do
    sleep 0.25
    is_listening && break
  done
fi

if is_listening; then
  open "http://localhost:5179/"
else
  echo "Failed to start server. Logs: $LOG_DIR/" >&2
  exit 1
fi
