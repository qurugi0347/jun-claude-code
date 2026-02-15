#!/bin/bash

# .claude/hooks/dangerous-command-blocker.sh
# Dangerous Command Blocker - PreToolUse Hook
# Bash 도구 실행 전 위험한 명령어를 감지하여 차단합니다.

# Dedup: project 우선, global은 project 버전 존재 시 양보
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_dedup.sh"
_hook_dedup_check "${BASH_SOURCE[0]}" || exit 0

INPUT=$(cat)

# jq가 있으면 jq로, 없으면 grep/sed로 command 추출
if command -v jq &>/dev/null; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
else
  # jq 없이 JSON에서 command 값 추출 (fallback)
  COMMAND=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/p' | head -1)
  # 이스케이프된 따옴표 복원
  COMMAND=$(echo "$COMMAND" | sed 's/\\"/"/g')
fi

# command가 비어있으면 허용
if [ -z "$COMMAND" ]; then
  exit 0
fi

# 차단 함수
block() {
  echo "{\"decision\": \"block\", \"reason\": \"$1\"}"
  exit 0
}

# 1. 위험한 rm 명령어 (루트/홈/현재 디렉토리 전체 삭제)
if echo "$COMMAND" | grep -qE 'rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|(-[a-zA-Z]*f[a-zA-Z]*r))\s+/[[:space:]]*($|;|\||&)'; then
  block "rm -rf / 는 시스템 전체를 삭제합니다. 이 명령어는 차단됩니다."
fi
if echo "$COMMAND" | grep -qE 'rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|(-[a-zA-Z]*f[a-zA-Z]*r))\s+~/?\s*($|;|\||&)'; then
  block "rm -rf ~ 는 홈 디렉토리 전체를 삭제합니다. 이 명령어는 차단됩니다."
fi
if echo "$COMMAND" | grep -qE 'rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|(-[a-zA-Z]*f[a-zA-Z]*r))\s+\./?\s*($|;|\||&)'; then
  block "rm -rf . 는 현재 디렉토리 전체를 삭제합니다. 이 명령어는 차단됩니다."
fi

# 2. sudo 명령어 (명시적 요청 없이 권한 상승)
if echo "$COMMAND" | grep -qE '(^|;|\||&&)\s*sudo\s'; then
  block "sudo 명령어는 명시적 요청 없이 사용할 수 없습니다. 사용자에게 확인하세요."
fi

# 3. git push --force / -f (강제 푸시)
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*(-f|--force)'; then
  block "git push --force 는 원격 히스토리를 덮어씁니다. 이 명령어는 차단됩니다."
fi

# 4. git reset --hard (하드 리셋)
if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
  block "git reset --hard 는 커밋되지 않은 변경사항을 모두 삭제합니다. 이 명령어는 차단됩니다."
fi

# 5. chmod 777 (과도한 권한)
if echo "$COMMAND" | grep -qE 'chmod\s+777'; then
  block "chmod 777 은 과도한 권한을 부여합니다. 보안상 차단됩니다."
fi

# 6. 원격 스크립트 직접 실행 (curl/wget | sh/bash)
if echo "$COMMAND" | grep -qE '(curl|wget)\s+.*\|\s*(sh|bash)'; then
  block "원격 스크립트를 직접 실행하는 것은 보안 위험이 있습니다. 이 명령어는 차단됩니다."
fi

# 모든 체크 통과 시 허용
exit 0
