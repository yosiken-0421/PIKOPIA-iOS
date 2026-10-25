#!/usr/bin/env bash
# PIKOPIA TestFlight distribution via Apple cloud-managed signing.
# Requires only the Apple team ID and an App Store Connect Team API key.
# No distribution certificate or provisioning profile is stored in GitHub.
set -euo pipefail
set +x

for required in APPLE_TEAM_ID ASC_KEY_ID ASC_ISSUER_ID ASC_PRIVATE_KEY BUILD_NUMBER; do
  if [[ -z "${!required:-}" ]]; then
    echo "Missing cloud signing setting: $required" >&2
    exit 1
  fi
done
[[ "$BUILD_NUMBER" =~ ^[1-9][0-9]*$ ]] || { echo "Invalid build number" >&2; exit 1; }
cd "$(dirname "$0")/.."
./scripts/prepare-mac.sh

SIGNING_DIR="$(mktemp -d)"
KEY_FILE="$SIGNING_DIR/AuthKey_${ASC_KEY_ID}.p8"
cleanup() { rm -rf "$SIGNING_DIR"; }
trap cleanup EXIT
umask 077
printf '%s\n' "$ASC_PRIVATE_KEY" > "$KEY_FILE"
chmod 600 "$KEY_FILE"

mkdir -p .build
export APPLE_TEAM_ID
python3 - <<'PY'
import os, plistlib
from pathlib import Path
export_options = {
    'method': 'app-store-connect',
    'destination': 'upload',
    'teamID': os.environ['APPLE_TEAM_ID'],
    'signingStyle': 'automatic',
    'manageAppVersionAndBuildNumber': False,
    'uploadSymbols': True,
}
Path('.build/CloudExportOptions.plist').write_bytes(plistlib.dumps(export_options))
PY

# The API key authorizes Xcode to manage profiles and cloud signing.
# A key with insufficient cloud-signing permissions will fail clearly.
xcodebuild -project PIKOPIA.xcodeproj -scheme PIKOPIA \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$PWD/.build/PIKOPIA.xcarchive" \
  DEVELOPMENT_TEAM="$APPLE_TEAM_ID" CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
  CODE_SIGN_STYLE=Automatic \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$KEY_FILE" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID" \
  archive

APP_PATH="$PWD/.build/PIKOPIA.xcarchive/Products/Applications/PIKOPIA.app"
[[ "$(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$APP_PATH/Info.plist")" == 'com.yosiken0421.pikopia' ]] || {
  echo 'Unexpected bundle identifier, upload aborted.' >&2
  exit 1
}

xcodebuild -exportArchive \
  -archivePath "$PWD/.build/PIKOPIA.xcarchive" \
  -exportOptionsPlist "$PWD/.build/CloudExportOptions.plist" \
  -exportPath "$PWD/.build/cloud-export" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$KEY_FILE" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID"

echo 'Cloud-signing upload command succeeded; confirm processing in App Store Connect.'
