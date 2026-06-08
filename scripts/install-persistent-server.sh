#!/bin/bash
# Build, create login app, and try LaunchAgent (or print Login Items steps).
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.jennysun.onboarding-summit-map"
PLIST_DEST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="$HOME/Library/Logs/onboarding-summit-map"
SERVER_SCRIPT="$PROJECT_DIR/scripts/local-server.sh"

chmod +x "$PROJECT_DIR/scripts/"*.sh
mkdir -p "$LOG_DIR"

echo "→ Building production bundle…"
cd "$PROJECT_DIR"
npm run build

bash "$PROJECT_DIR/scripts/create-login-app.sh"

echo "→ Writing LaunchAgent to $PLIST_DEST"
cat > "$PLIST_DEST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${SERVER_SCRIPT}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${PROJECT_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/server.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/server.err.log</string>
</dict>
</plist>
EOF

AGENT_OK=0
if launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null; then true; fi
if launchctl bootstrap "gui/$(id -u)" "$PLIST_DEST" 2>/dev/null; then
  launchctl enable "gui/$(id -u)/${LABEL}" 2>/dev/null || true
  launchctl kickstart -k "gui/$(id -u)/${LABEL}" 2>/dev/null || true
  AGENT_OK=1
elif launchctl load -w "$PLIST_DEST" 2>/dev/null; then
  AGENT_OK=1
fi

echo ""
if [[ "$AGENT_OK" -eq 1 ]]; then
  echo "✓ LaunchAgent installed — server will start automatically at login."
else
  echo "⚠ LaunchAgent could not be registered from this environment."
  echo "  Run this in the macOS Terminal app (not Cursor):"
  echo "    launchctl bootstrap gui/\$(id -u) \"$PLIST_DEST\""
  echo "  Or use Login Items with:"
  echo "    $PROJECT_DIR/Teacher Launch Map Server.app"
fi

echo ""
echo "Permanent URL:  http://localhost:5179/"
echo "Bookmark:       $PROJECT_DIR/Open Teacher Launch Map.webloc"
echo "After code changes:  npm run build  (then restart server if needed)"
