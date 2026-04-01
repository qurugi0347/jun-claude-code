#!/bin/bash
set -u
# GPM Response Suggest — Stop hook
# 커밋 후 응답 완료 시 Claude가 태스크 완료/다음 작업을 제안하도록 유도
# stdout JSON {"decision": "block", "reason": "..."} → Claude 추가 응답 트리거
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

INPUT=$(cat)

# 무한 루프 방지: stop_hook_active가 true이면 즉시 종료 (Claude 중단 허용)
ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
[ "$ACTIVE" = "true" ] && exit 0

# 프로젝트 확인
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
GPMRC="${PROJECT_ROOT:-.}/.gpmrc"
[ ! -f "$GPMRC" ] && exit 0

# 커밋 마커 확인 (gpm-commit-linker.sh에서 생성)
PROJ_HASH=$(echo "$PROJECT_ROOT" | md5 -q 2>/dev/null || echo "$PROJECT_ROOT" | md5sum 2>/dev/null | cut -d' ' -f1)
PROJ_HASH="${PROJ_HASH:0:12}"
MARKER="/tmp/gpm-commit-marker-${PROJ_HASH}"

# 마커 없으면 조용히 종료 → Claude 정상 중단
[ ! -f "$MARKER" ] && exit 0

# 마커 읽고 삭제
COMMIT_MSG=$(cat "$MARKER")
rm -f "$MARKER"

# In Progress 태스크 조회
cd "$PROJECT_ROOT" || exit 0
TASKS=$(gpm_cli task list --json --limit 20 2>/dev/null || echo "")

IN_PROGRESS="확인 필요"
if [ -n "$TASKS" ] && [ "$TASKS" != "[]" ]; then
  IN_PROGRESS=$(echo "$TASKS" | jq -r '
    [.[] | select(.status == "In Progress")]
    | if length > 0 then
        map("#\(.number // .id) \(.title)")
        | join(", ")
      else "없음" end
  ' 2>/dev/null || echo "확인 필요")
fi

# Claude에게 전달할 메시지 구성 + JSON 안전 출력
REASON="[GPM Stop Hook] 커밋이 감지되었습니다. In Progress 태스크: ${IN_PROGRESS}. 이 커밋으로 완료된 태스크가 있는지 사용자에게 간결하게(1-2줄) 물어보고, 완료했다면 /gpm done을 제안하세요. 다음 작업이 필요하면 /gpm next를 안내하세요."

jq -n --arg reason "$REASON" '{"decision": "block", "reason": $reason}'

exit 0
