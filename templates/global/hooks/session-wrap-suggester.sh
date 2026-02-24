#!/bin/bash

# .claude/hooks/session-wrap-suggester.sh
# PR 생성 후 /session-wrap 실행을 제안하는 PostToolUse hook (Bash)

# Dedup: project 우선, global은 project 버전 존재 시 양보
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/_dedup.sh" ]; then
  source "$SCRIPT_DIR/_dedup.sh"
  _hook_dedup_check "${BASH_SOURCE[0]}" || exit 0
fi

INPUT=$(cat)

# tool_name 추출
TOOL_NAME=$(echo "$INPUT" | sed -n 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

# Bash가 아니면 스킵
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

# tool_input에서 command 추출
COMMAND=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

# gh pr create 명령이 포함되어 있는지 확인
if echo "$COMMAND" | grep -q "gh pr create"; then
  # tool_output에서 성공 여부 확인 (PR URL이 반환되면 성공)
  OUTPUT=$(echo "$INPUT" | sed -n 's/.*"tool_output"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  if echo "$OUTPUT" | grep -qE "https://github.com/.*/pull/[0-9]+"; then
    echo "[session-wrap] PR이 생성되었습니다. /session-wrap 을 실행하면 이번 세션의 반복 패턴, 학습 포인트, 후속 작업을 자동 분석할 수 있습니다." >&2
  fi
fi

exit 0
