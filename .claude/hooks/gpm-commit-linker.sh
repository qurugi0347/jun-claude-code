#!/bin/bash
set -u
# GPM Commit Linker — PostToolUse hook (Bash)
# 커밋 감지 시 In Progress 태스크와 연결하고 완료 처리를 제안
# stderr → 사용자 알림으로 표시
# 필수: jq

# jq 없으면 스킵
command -v jq &>/dev/null || exit 0

# gpm CLI 실행 (gpm 직접 사용 → npx fallback)
gpm_cli() {
  if command -v gpm &>/dev/null; then
    gpm "$@"
  else
    npx github-project-manager "$@"
  fi
}

# stdin에서 hook input JSON 읽기
INPUT=$(cat)

# tool_name, command 추출
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
[ "$TOOL_NAME" != "Bash" ] && exit 0

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# git commit 명령이 아니면 스킵
echo "$COMMAND" | grep -qE 'git\s+commit' || exit 0

# 프로젝트 루트 및 .gpmrc 확인
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
GPMRC="${PROJECT_ROOT:-.}/.gpmrc"
[ ! -f "$GPMRC" ] && exit 0

# 최근 커밋 메시지 가져오기
COMMIT_MSG=$(cd "$PROJECT_ROOT" && git log -1 --format="%s" 2>/dev/null || echo "")
[ -z "$COMMIT_MSG" ] && exit 0

# In Progress 태스크 조회
cd "$PROJECT_ROOT" || exit 0
TASKS=$(gpm_cli task list --json --limit 30 2>/dev/null || echo "")
[ -z "$TASKS" ] || [ "$TASKS" = "[]" ] && exit 0

IN_PROGRESS=$(echo "$TASKS" | jq -r '
  [.[] | select(.status == "In Progress")]
  | if length > 0 then
      map("#\(.number // .id): \(.title)")
      | join(", ")
    else "없음" end
' 2>/dev/null || echo "없음")
IN_PROGRESS_COUNT=$(echo "$TASKS" | jq '[.[] | select(.status == "In Progress")] | length' 2>/dev/null || echo 0)

# 커밋 마커 파일 생성 (Stop hook에서 참조)
PROJ_HASH=$(echo "$PROJECT_ROOT" | md5 -q 2>/dev/null || echo "$PROJECT_ROOT" | md5sum 2>/dev/null | cut -d' ' -f1)
PROJ_HASH="${PROJ_HASH:0:12}"
echo "$COMMIT_MSG" > "/tmp/gpm-commit-marker-${PROJ_HASH}"

# 브리핑 캐시 무효화 (다음 프롬프트에서 갱신되도록)
rm -f "/tmp/gpm-briefing-${PROJ_HASH}"

# 알림 출력 (stderr → 사용자에게 표시)
{
  echo "[GPM] 커밋 감지: \"${COMMIT_MSG}\""
  if [ "$IN_PROGRESS_COUNT" != "0" ] && [ "$IN_PROGRESS_COUNT" != "?" ]; then
    echo "In Progress: ${IN_PROGRESS}"
    echo "태스크를 완료했다면 /gpm done 을 실행하세요."
  fi
} >&2

exit 0
