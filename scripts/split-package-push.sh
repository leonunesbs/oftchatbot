#!/usr/bin/env bash
# Pushes a monorepo subdirectory to a standalone repo via git subtree split.
# Used by .github/workflows/split-repositories.yml
# Requires: TARGET_TOKEN (PAT with repo write), pnpm on PATH, full git history (fetch-depth: 0).
set -euo pipefail

PREFIX="${1:?first arg: package directory prefix (e.g. oftagenda)}"
TARGET_REPO="${2:?second arg: target GitHub repo as owner/name (e.g. leonunesbs/oftagenda)}"
CHORE_MSG="${3:-chore(${PREFIX}): sync pnpm config and lockfile}"

if [[ -z "${TARGET_TOKEN:-}" ]]; then
  echo "Missing env TARGET_TOKEN (repository PAT with contents: write)"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "${REPO_ROOT}"

TMP_WS="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"

awk '
  /^onlyBuiltDependencies:/ { print; copy = 1; next }
  copy == 1 && /^  - / { print; next }
  copy == 1 { exit }
' pnpm-workspace.yaml >"${TMP_WS}/pnpm-workspace.yaml"

if [[ ! -s "${TMP_WS}/pnpm-workspace.yaml" ]]; then
  echo "Missing onlyBuiltDependencies in root pnpm-workspace.yaml"
  exit 1
fi

BRANCH_NAME="split-${PREFIX}"
git subtree split --prefix="${PREFIX}" --branch "${BRANCH_NAME}"
git checkout "${BRANCH_NAME}"

cp "${TMP_WS}/pnpm-workspace.yaml" pnpm-workspace.yaml
pnpm install --lockfile-only --ignore-scripts

if [[ ! -s pnpm-lock.yaml ]]; then
  echo "Failed to generate pnpm-lock.yaml"
  exit 1
fi

git add pnpm-workspace.yaml pnpm-lock.yaml
if ! git diff --cached --quiet; then
  git -c user.name="github-actions[bot]" -c user.email="github-actions[bot]@users.noreply.github.com" commit -m "${CHORE_MSG}"
else
  echo "No changes detected in ${PREFIX} pnpm files"
fi

# Point local `main` at the split tip so we push main→main (avoids a remote split-<pkg>
# branch being newer than main if something ever created it).
git branch -f main HEAD
git checkout main

GIT_PUSH_URL="https://x-access-token:${TARGET_TOKEN}@github.com/${TARGET_REPO}.git"
REMOTE_MAIN="refs/heads/main"

echo "Pushing refs/heads/main -> ${REMOTE_MAIN} on ${TARGET_REPO}"
git push --force "${GIT_PUSH_URL}" "refs/heads/main:${REMOTE_MAIN}"

# Drop stray split-* branch on the mirror so only main carries the export history.
if git ls-remote "${GIT_PUSH_URL}" "refs/heads/${BRANCH_NAME}" | grep -q .; then
  echo "Deleting stale refs/heads/${BRANCH_NAME} on ${TARGET_REPO}"
  git push "${GIT_PUSH_URL}" --delete "${BRANCH_NAME}"
fi

LOCAL_TIP="$(git rev-parse main)"
REMOTE_TIP="$(git ls-remote "${GIT_PUSH_URL}" "${REMOTE_MAIN}" | awk '{print $1}')"
if [[ -z "${REMOTE_TIP}" ]]; then
  echo "ERROR: could not read ${REMOTE_MAIN} on ${TARGET_REPO} after push"
  exit 1
fi
if [[ "${LOCAL_TIP}" != "${REMOTE_TIP}" ]]; then
  echo "ERROR: ${REMOTE_MAIN} (${REMOTE_TIP}) does not match local main (${LOCAL_TIP})"
  exit 1
fi
echo "OK: ${TARGET_REPO}@${REMOTE_MAIN} = ${LOCAL_TIP}"
