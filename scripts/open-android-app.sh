#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRADLE_FILE="$ROOT_DIR/android/app/build.gradle"

if [[ ! -f "$GRADLE_FILE" ]]; then
  echo "Could not find android/app/build.gradle"
  exit 1
fi

APP_ID="$(sed -nE 's/^[[:space:]]*applicationId[[:space:]]+"([^"]+)".*$/\1/p' "$GRADLE_FILE" | head -n1)"

if [[ -z "${APP_ID:-}" ]]; then
  echo "Could not detect applicationId from $GRADLE_FILE"
  exit 1
fi

DEVICE_SERIAL="${1:-}"

adb_cmd() {
  if [[ -n "$DEVICE_SERIAL" ]]; then
    adb -s "$DEVICE_SERIAL" "$@"
    return
  fi
  adb "$@"
}

if ! adb_cmd shell pm path "$APP_ID" >/dev/null 2>&1; then
  echo "App not installed on target device: $APP_ID"
  exit 1
fi

LAUNCH_COMPONENT="$(adb_cmd shell cmd package resolve-activity --brief "$APP_ID" 2>/dev/null | tail -n1 | tr -d '\r')"

if [[ -z "${LAUNCH_COMPONENT:-}" || "$LAUNCH_COMPONENT" == "No activity found" ]]; then
  echo "Could not resolve launcher activity for $APP_ID"
  exit 1
fi

echo "Launching $LAUNCH_COMPONENT"
adb_cmd shell am start -n "$LAUNCH_COMPONENT"
