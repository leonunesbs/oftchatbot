#!/usr/bin/env bash
# One-time migration: replace git submodules with normal tracked directories so the
# monorepo is the single source of truth (CI subtree split remains the only mirror path).
#
# Prerequisites: network access; submodules must be fetchable (git submodule update --init).
# Run from the oftcore repo root: bash scripts/submodules-to-plain-tree.sh
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "${REPO_ROOT}"

if [[ ! -f .gitmodules ]]; then
  echo "No .gitmodules found; nothing to migrate."
  exit 0
fi

if [[ -z "${SKIP_CONFIRM:-}" ]]; then
  echo "This will remove submodule metadata and commit package files in-tree."
  echo "Ensure you have committed or stashed local work. Press Enter to continue."
  read -r _
fi

PATHS=()
while IFS= read -r line; do
  [[ -z "${line}" ]] && continue
  PATHS+=("${line}")
done < <(git config --file .gitmodules --get-regexp path | awk '{ print $2 }' | sort -u)

for path in "${PATHS[@]}"; do
  echo "Migrating ${path}..."
  if [[ ! -d "${path}" ]]; then
    echo "Path ${path} missing; run: git submodule update --init --recursive"
    exit 1
  fi
  TMP="$(mktemp -d)"
  cp -a "${path}/." "${TMP}/"

  git submodule deinit -f -- "${path}" 2>/dev/null || true
  git rm -f -- "${path}"
  rm -rf "${REPO_ROOT}/.git/modules/${path}"

  mkdir -p "${path}"
  cp -a "${TMP}/." "${path}/"
  rm -rf "${TMP}"

  git add -- "${path}"
done

if [[ -f .gitmodules ]]; then
  git rm -f .gitmodules
fi

echo "Done. Review with git status, then commit from repo root (e.g. chore(git): remove submodules, track packages in-tree)."
