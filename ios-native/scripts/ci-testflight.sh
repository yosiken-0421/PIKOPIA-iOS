#!/usr/bin/env bash
# Manual distribution signing. Never changes or revokes Apple certificates.
set -euo pipefail
set +x
for required in APPLE_TEAM_ID ASC_KEY_ID ASC_ISSUER_ID ASC_PRIVATE_KEY IOS_DISTRIBUTION_P12_BASE64 IOS_DISTRIBUTION_P12_PASSWORD IOS_PROVISION_PROFILE_BASE64 BUILD_NUMBER; do
  if [[ -z "${!required:-}" ]]; then echo "Missing required signing setting: $required" >&2; exit 1; fi
done
[[ "$BUILD_NUMBER" =~ ^[1-9][0-9]*$ ]] || exit 1
cd "$(dirname "$0")/.."
./scripts/prepare-mac.sh
SIGNING_DIR=$(mktemp -d)
export SIGNING_DIR
KEYCHAIN_PATH="$SIGNING_DIR/pikopia.keychain-db"
KEYCHAIN_PASSWORD=$(openssl rand -hex 24)
PROFILE_DEST=""
cleanup() {
 security delete-keychain "$KEYCHAIN_PATH" >/dev/null 2>&1 || true
 if [[ -n "$PROFILE_DEST" ]]; then rm -f "$PROFILE_DEST"; fi
 rm -rf "$SIGNING_DIR"
}
trap cleanup EXIT
python3 - <<'PY'
import base64, os
from pathlib import Path
p=Path(os.environ['SIGNING_DIR'])
(p/'distribution.p12').write_bytes(base64.b64decode(os.environ['IOS_DISTRIBUTION_P12_BASE64'],validate=True))
(p/'profile.mobileprovision').write_bytes(base64.b64decode(os.environ['IOS_PROVISION_PROFILE_BASE64'],validate=True))
(p/'AuthKey.p8').write_text(os.environ['ASC_PRIVATE_KEY'])
for f in p.iterdir(): f.chmod(0o600)
PY
security cms -D -i "$SIGNING_DIR/profile.mobileprovision" > "$SIGNING_DIR/profile.plist"
PROFILE_UUID=$(python3 - <<'PY'
import datetime,os,plistlib
from pathlib import Path
p=plistlib.loads((Path(os.environ['SIGNING_DIR'])/'profile.plist').read_bytes())
team=os.environ['APPLE_TEAM_ID']; e=p['Entitlements']
assert p['TeamIdentifier']==[team], 'Provisioning team mismatch'
assert e['application-identifier'].endswith('.com.yosiken0421.pikopia'), 'Not a PIKOPIA profile'
assert not e.get('get-task-allow',False), 'Development profile is not allowed'
assert 'ProvisionedDevices' not in p and not p.get('ProvisionsAllDevices'), 'App Store profile required'
assert p['ExpirationDate']>datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), 'Profile expired'
print(p['UUID'])
PY
)
mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
PROFILE_DEST="$HOME/Library/MobileDevice/Provisioning Profiles/$PROFILE_UUID.mobileprovision"
# Runs only on a fresh ephemeral hosted runner; never a user's shared keychain.
cp "$SIGNING_DIR/profile.mobileprovision" "$PROFILE_DEST"
security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
security import "$SIGNING_DIR/distribution.p12" -P "$IOS_DISTRIBUTION_P12_PASSWORD" -A -t cert -f pkcs12 -k "$KEYCHAIN_PATH" >/dev/null
security set-key-partition-list -S apple-tool:,apple:,codesign: -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH" >/dev/null
security list-keychains -d user -s "$KEYCHAIN_PATH"
export PROFILE_UUID
mkdir -p .build
python3 - <<'PY'
import os,plistlib
from pathlib import Path
options={'method':'app-store-connect','destination':'upload','teamID':os.environ['APPLE_TEAM_ID'],'signingStyle':'manual','signingCertificate':'Apple Distribution','provisioningProfiles':{'com.yosiken0421.pikopia':os.environ['PROFILE_UUID']},'testFlightInternalTestingOnly':True,'uploadSymbols':True}
Path('.build/ExportOptions.plist').write_bytes(plistlib.dumps(options))
PY
xcodebuild -project PIKOPIA.xcodeproj -scheme PIKOPIA -configuration Release \
 -destination 'generic/platform=iOS' -archivePath "$PWD/.build/PIKOPIA.xcarchive" \
 DEVELOPMENT_TEAM="$APPLE_TEAM_ID" CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
 CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY='Apple Distribution' \
 PROVISIONING_PROFILE_SPECIFIER="$PROFILE_UUID" archive
APP_PATH="$PWD/.build/PIKOPIA.xcarchive/Products/Applications/PIKOPIA.app"
[[ $(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$APP_PATH/Info.plist") == com.yosiken0421.pikopia ]]
codesign --verify --deep --strict "$APP_PATH"
xcodebuild -exportArchive -archivePath "$PWD/.build/PIKOPIA.xcarchive" \
 -exportOptionsPlist "$PWD/.build/ExportOptions.plist" -exportPath "$PWD/.build/export" \
 -authenticationKeyPath "$SIGNING_DIR/AuthKey.p8" \
 -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID"
echo 'Upload command succeeded. App Store Connect processing and tester assignment still require verification.'
