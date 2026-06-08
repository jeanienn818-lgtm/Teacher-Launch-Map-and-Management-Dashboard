#!/bin/bash
# Create a private GitHub repo (if needed) and push this project.
# Prerequisites: GitHub CLI — install from https://cli.github.com/ then run: gh auth login
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_OWNER="${GITHUB_OWNER:-jeanienn818-lgtm}"
REPO_NAME="${1:-New}"
REMOTE_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is not installed."
  echo "Install: https://cli.github.com/  then run: gh auth login"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in to GitHub. Run: gh auth login"
  exit 1
fi

cd "$PROJECT_DIR"

if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  echo "No commits yet. Run: npm run install:local-server (or git add + commit) first."
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  CURRENT_URL="$(git remote get-url origin)"
  if [[ "$CURRENT_URL" != "$REMOTE_URL" ]]; then
    git remote set-url origin "$REMOTE_URL"
  fi
  echo "→ Pushing to ${REMOTE_URL} …"
  git push -u origin main
else
  echo "→ Creating GitHub repo: ${REPO_OWNER}/${REPO_NAME}"
  gh repo create "${REPO_OWNER}/${REPO_NAME}" --private --source=. --remote=origin --push
fi

echo ""
echo "✓ Done. Open your repo:"
gh repo view "${REPO_OWNER}/${REPO_NAME}" --web 2>/dev/null || echo "https://github.com/${REPO_OWNER}/${REPO_NAME}"
