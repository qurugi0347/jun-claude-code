#!/bin/bash

# .claude/hooks/code-quality-reminder.sh
# 코드 수정 후 품질 체크 리마인더 - PostToolUse hook (Edit/Write)

# Dedup: project 우선, global은 project 버전 존재 시 양보
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/_dedup.sh" ]; then
  source "$SCRIPT_DIR/_dedup.sh"
  _hook_dedup_check "${BASH_SOURCE[0]}" || exit 0
fi

INPUT=$(cat)

# tool_name 추출
TOOL_NAME=$(echo "$INPUT" | sed -n 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

# Edit 또는 Write가 아니면 스킵
if [ "$TOOL_NAME" != "Edit" ] && [ "$TOOL_NAME" != "Write" ]; then
  exit 0
fi

# file_path 추출
FILE_PATH=$(echo "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# 확장자 추출
EXT="${FILE_PATH##*.}"

# 코드 파일 확장자 매칭
case "$EXT" in
  ts|tsx|js|jsx|py|go|rs|java|rb|php|swift|kt|sh)
    echo "[code-quality] 수정된 파일의 에러 핸들링, 불변성 패턴, 입력 검증을 확인하세요." >&2
    ;;
esac

exit 0
