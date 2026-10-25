#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${APPLE_TEAM_ID:?Set APPLE_TEAM_ID to your real 10-character developer team ID}"
./scripts/prepare-mac.sh
mkdir -p .build
xcodebuild -project PIKOPIA.xcodeproj -scheme PIKOPIA \
 -configuration Release -destination 'generic/platform=iOS' \
 -archivePath "$PWD/.build/PIKOPIA.xcarchive" \
 DEVELOPMENT_TEAM="$APPLE_TEAM_ID" CODE_SIGN_STYLE=Automatic \
 -allowProvisioningUpdates archive
printf '\nArchive ready: %s\n' "$PWD/.build/PIKOPIA.xcarchive"
printf 'In Xcode Organizer: Distribute App > TestFlight & App Store > Upload.\n'
open "$PWD/.build/PIKOPIA.xcarchive"
