#!/bin/bash
# Creates Teacher Launch Map Server.app — add to Login Items for auto-start after reboot.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="Teacher Launch Map Server.app"
APP_PATH="$PROJECT_DIR/$APP_NAME"
MACOS_DIR="$APP_PATH/Contents/MacOS"
LOG_DIR="$HOME/Library/Logs/onboarding-summit-map"

mkdir -p "$MACOS_DIR" "$LOG_DIR"

cat > "$APP_PATH/Contents/Info.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>launcher</string>
  <key>CFBundleIdentifier</key>
  <string>com.jennysun.onboarding-summit-map.server</string>
  <key>CFBundleName</key>
  <string>Teacher Launch Map Server</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>LSUIElement</key>
  <true/>
</dict>
</plist>
EOF

cat > "$MACOS_DIR/launcher" <<LAUNCHER
#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
PROJECT_DIR="$PROJECT_DIR"
LOG_DIR="$LOG_DIR"
mkdir -p "\$LOG_DIR"

is_listening() {
  lsof -nP -iTCP:5179 -sTCP:LISTEN >/dev/null 2>&1
}

if [[ ! -d "\$PROJECT_DIR/dist" ]]; then
  osascript -e 'display alert "Teacher Launch Map" message "dist/ not found. Open Terminal and run:\ncd \"'"$PROJECT_DIR"'\" && npm run build"' as critical
  exit 1
fi

if ! is_listening; then
  nohup /bin/bash "\$PROJECT_DIR/scripts/local-server.sh" >> "\$LOG_DIR/server.log" 2>> "\$LOG_DIR/server.err.log" &
  for i in {1..20}; do
    sleep 0.25
    is_listening && break
  done
fi

if is_listening; then
  open "http://localhost:5179/"
else
  osascript -e 'display alert "Teacher Launch Map" message "Could not start server on port 5179. Check logs in ~/Library/Logs/onboarding-summit-map/"' as critical
  exit 1
fi
LAUNCHER

chmod +x "$MACOS_DIR/launcher"

echo "✓ Created: $APP_PATH"
echo ""
echo "To keep http://localhost:5179/ available after reboot:"
echo "  1. Open System Settings → General → Login Items"
echo "  2. Click + and choose:"
echo "     $APP_PATH"
echo "  3. Double-click the app once now to start the server and open the page."
