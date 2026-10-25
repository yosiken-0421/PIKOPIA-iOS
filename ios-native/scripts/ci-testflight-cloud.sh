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
export KEY_FILE
# Normalize PEM copied through iOS text viewers (CRLF, literal \\n or lost line breaks).
# Never echo the key into Actions logs.
python3 - <<'PY'
import base64
import os
import re
import sys
from pathlib import Path

secret = os.environ['ASC_PRIVATE_KEY'].strip()
secret = secret.replace('\\\\r\\\\n', '\\n').replace('\\\\n', '\\n').replace('\\r', '\\n')
begin = '-----BEGIN PRIVATE KEY-----'
end = '-----END PRIVATE KEY-----'
start = secret.find(begin)
finish = secret.find(end, start + len(begin))
if start < 0 or finish < 0:
    print('Invalid ASC_PRIVATE_KEY: missing BEGIN/END PRIVATE KEY markers. Re-copy the full AuthKey .p8 file contents into GitHub Environment secrets.', file=sys.stderr)
    sys.exit(1)
body = re.sub(r'\\s+', '', secret[start + len(begin):finish])
try:
    der = base64.b64decode(body, validate=True)
    if not der or der[0] != 0x30:
        raise ValueError('not an ASN.1 private key')
except (ValueError, base64.binascii.Error):
    print('Invalid ASC_PRIVATE_KEY: encoded key body is incomplete or malformed. Re-copy the full .p8 file.', file=sys.stderr)
    sys.exit(1)
pem = begin + '\\n' + '\\n'.join(body[i:i+64] for i in range(0, len(body), 64)) + '\\n' + end + '\\n'
p = Path(os.environ['KEY_FILE'])
p.write_text(pem)
p.chmod(0o600)
PY
if ! openssl pkey -in "$KEY_FILE" -noout >/dev/null 2>&1; then
  echo 'Invalid ASC_PRIVATE_KEY: OpenSSL could not parse the key. Re-copy the .p8 contents into the GitHub secret.' >&2
  exit 1
fi

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
