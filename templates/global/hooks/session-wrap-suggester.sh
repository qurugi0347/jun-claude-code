#!/bin/bash

# .claude/hooks/session-wrap-suggester.sh
# PR 생성 후 /session-wrap 실행을 제안하는 PostToolUse hook (Bash)

INPUT=$(cat)

# JSON 파싱 (jq 우선, sed fallback)
if command -v jq &>/dev/null; then
  TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
  OUTPUT=$(echo "$INPUT" | jq -r '.tool_output // empty')
else
  TOOL_NAME=$(echo "$INPUT" | sed -n 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  COMMAND=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  OUTPUT=$(echo "$INPUT" | sed -n 's/.*"tool_output"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
fi

# Bash가 아니면 스킵
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

# gh pr create 명령이 포함되어 있는지 확인
if echo "$COMMAND" | grep -q "gh pr create"; then
  # tool_output에서 성공 여부 확인 (PR URL이 반환되면 성공)
  if echo "$OUTPUT" | grep -qE "https://github.com/.*/pull/[0-9]+"; then
    echo "[session-wrap] PR이 생성되었습니다. /session-wrap 을 실행하면 이번 세션의 반복 패턴, 학습 포인트, 후속 작업을 자동 분석할 수 있습니다." >&2
  fi
fi

exit 0
