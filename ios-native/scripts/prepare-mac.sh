#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'Xcode builds require macOS. Use GitHub Actions macos-26 or a Mac.' >&2
  exit 1
fi
if ! command -v xcodegen >/dev/null 2>&1; then
  echo 'Install XcodeGen (brew install xcodegen) and rerun.' >&2
  exit 1
fi
rsync -a --delete ../www/ PIKOPIA/www/
xcodegen generate --spec project.yml
printf '\nCreated %s/PIKOPIA.xcodeproj\n' "$PWD"
