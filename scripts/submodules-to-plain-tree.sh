#!/usr/bin/env bash
# One-time migration: replace git submodules with normal tracked directories so the
# monorepo is the single source of truth (CI subtree split remains the only mirror path).
#
# Prerequisites: network access; submodules must be fetchable (git submodule update --init).
# Run from the oftcore repo root:
#   bash scripts/submodules-to-plain-tree.sh                    # migrate all submodules
#   bash scripts/submodules-to-plain-tree.sh oftleonardo        # migrate only listed paths
#
# Partial migration updates .gitmodules in place; migrating all removes .gitmodules when empty.
#
# If `git submodule deinit` cannot remove the work tree (e.g. huge node_modules on some disks),
# use: `git rm --cached <path>`, move the folder aside with `mv`, then `git add <path>` after
# restoring files via `git -C <clone> archive HEAD | tar -x` (tracked files only, no node_modules).
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
if [[ $# -gt 0 ]]; then
  PATHS=("$@")
else
  while IFS= read -r line; do
    [[ -z "${line}" ]] && continue
    PATHS+=("${line}")
  done < <(git config --file .gitmodules --get-regexp path | awk '{ print $2 }' | sort -u)
fi

submodule_name_for_path() {
  local path="$1"
  local key p
  while IFS= read -r line; do
    key="${line%% *}"
    p="${line#* }"
    if [[ "${p}" == "${path}" ]]; then
      key="${key#submodule.}"
      key="${key%.path}"
      echo "${key}"
      return 0
    fi
  done < <(git config --file .gitmodules --get-regexp path 2>/dev/null || true)
  echo ""
  return 1
}

for path in "${PATHS[@]}"; do
  echo "Migrating ${path}..."
  if [[ ! -d "${path}" ]]; then
    echo "Path ${path} missing; run: git submodule update --init --recursive"
    exit 1
  fi
  name="$(submodule_name_for_path "${path}")"

  TMP="$(mktemp -d)"
  # Export only tracked files (avoids copying node_modules / broken pnpm symlinks on some filesystems).
  if [[ -f "${path}/.git" ]] || [[ -d "${path}/.git" ]]; then
    git -C "${path}" archive HEAD | tar -x -C "${TMP}"
  else
    cp -a "${path}/." "${TMP}/"
    rm -f "${TMP}/.git"
    rm -rf "${TMP}/.git" 2>/dev/null || true
  fi

  git submodule deinit -f -- "${path}" 2>/dev/null || true
  git rm -f -- "${path}"
  rm -rf "${REPO_ROOT}/.git/modules/${path}"

  mkdir -p "${path}"
  cp -a "${TMP}/." "${path}/"
  rm -rf "${TMP}"

  git add -- "${path}"

  # git rm may already drop the submodule section; ensure .gitmodules matches intent.
  if [[ -n "${name}" ]] && [[ -f .gitmodules ]] && git config -f .gitmodules --get "submodule.${name}.path" &>/dev/null; then
    git config -f .gitmodules --remove-section "submodule.${name}"
  fi
  if [[ -f .gitmodules ]]; then
    if git config -f .gitmodules --get-regexp path 2>/dev/null | head -1 | grep -q .; then
      git add .gitmodules
    else
      git rm -f .gitmodules
    fi
  fi
done

echo "Done. Review with git status, then commit from repo root (e.g. chore(git): track oftleonardo in-tree for subtree split)."
