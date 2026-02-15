#!/bin/bash
# _dedup.sh - Hook deduplication guard
# global과 project 양쪽에 hooks가 설치된 경우 중복 실행을 방지합니다.
# project-level hook이 우선이며, global hook은 project 버전이 존재하면 양보합니다.
#
# Usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/_dedup.sh"
#   _hook_dedup_check "${BASH_SOURCE[0]}" || exit 0

_hook_dedup_check() {
  local caller_path="$1"
  local hook_name
  hook_name="$(basename "$caller_path")"

  local self_dir
  self_dir="$(cd "$(dirname "$caller_path")" && pwd)"

  local global_dir
  global_dir="$(cd "$HOME/.claude/hooks" 2>/dev/null && pwd 2>/dev/null)"

  # 내가 global 버전인지 확인
  if [ "$self_dir" = "$global_dir" ]; then
    # project-level 동일 hook이 존재하면 → global은 skip
    local project_hook
    project_hook="$(pwd)/.claude/hooks/$hook_name"
    if [ -f "$project_hook" ]; then
      return 1  # global yields to project → skip
    fi
  fi

  return 0  # project version 또는 global-only → proceed
}
