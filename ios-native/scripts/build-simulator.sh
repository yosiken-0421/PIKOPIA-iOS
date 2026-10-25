#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
./scripts/prepare-mac.sh
xcodebuild -project PIKOPIA.xcodeproj -scheme PIKOPIA -configuration Release \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath .build \
  CODE_SIGNING_ALLOWED=NO build
