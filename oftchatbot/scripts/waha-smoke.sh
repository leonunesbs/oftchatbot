#!/usr/bin/env bash

set -euo pipefail

APP_BASE_URL="${APP_BASE_URL:-http://localhost:3030}"

echo "Running WAHA smoke tests against: ${APP_BASE_URL}"

check_endpoint() {
  local name="$1"
  local url="$2"
  local code

  code="$(curl -s -o /dev/null -w "%{http_code}" "${url}")"
  if [[ "${code}" -lt 200 || "${code}" -ge 400 ]]; then
    echo "FAIL ${name} (${url}) -> HTTP ${code}"
    exit 1
  fi
  echo "PASS ${name} -> HTTP ${code}"
}

check_endpoint "health" "${APP_BASE_URL}/api/waha/health"
check_endpoint "session" "${APP_BASE_URL}/api/chat/session"
check_endpoint "list-chats" "${APP_BASE_URL}/api/chat/conversations"

echo "Smoke tests finished successfully."
