#!/bin/bash
set -u
# GPM Session Briefing — UserPromptSubmit hook
# 세션 시작 시 In Progress 태스크와 마일스톤별 다음 추천 태스크를 표시
# stdout → Claude context에 주입

# gpm CLI 실행 (gpm 직접 사용 → npx fallback)
gpm_cli() {
  if command -v gpm &>/dev/null; then
    gpm "$@"
  else
    npx github-project-manager "$@"
  fi
}

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
GPMRC="${PROJECT_ROOT:-.}/.gpmrc"

# .gpmrc 없으면 스킵
[ ! -f "$GPMRC" ] && exit 0

# 프로젝트 해시 (캐시 키)
PROJ_HASH=$(echo "$PROJECT_ROOT" | md5 -q 2>/dev/null || echo "$PROJECT_ROOT" | md5sum 2>/dev/null | cut -d' ' -f1)
PROJ_HASH="${PROJ_HASH:0:12}"
CACHE_FILE="/tmp/gpm-briefing-${PROJ_HASH}"

# 30분 캐시 (1800초) — 빈번한 CLI 호출 방지
if [ -f "$CACHE_FILE" ]; then
  CACHE_MOD=$(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE" 2>/dev/null || echo 0)
  CACHE_AGE=$(( $(date +%s) - CACHE_MOD ))
  if [ "$CACHE_AGE" -lt 1800 ]; then
    cat "$CACHE_FILE"
    exit 0
  fi
fi

# 태스크 목록 조회 (로컬 SQLite 캐시, GitHub API 호출 없음)
cd "$PROJECT_ROOT" || exit 0
TASKS=$(gpm_cli task list --json --limit 50 2>/dev/null || echo "")

# 빈 결과 또는 에러 시 스킵
if [ -z "$TASKS" ] || [ "$TASKS" = "[]" ]; then
  exit 0
fi

# jq 사용 가능 여부 확인
if ! command -v jq &>/dev/null; then
  cat > "$CACHE_FILE" << 'NOJQ'
### GPM 브리핑
태스크 현황을 확인하려면 `/gpm status`를 실행하세요.
NOJQ
  cat "$CACHE_FILE"
  exit 0
fi

# 태스크 파싱
IN_PROGRESS=$(echo "$TASKS" | jq -r '
  [.[] | select(.status == "In Progress")]
  | if length > 0 then
      map("- #\(.number // .id): \(.title)\(if .milestone then " [\(.milestone)]" else "" end)")
      | join("\n")
    else empty end
' 2>/dev/null || echo "")

IN_PROGRESS_COUNT=$(echo "$TASKS" | jq '[.[] | select(.status == "In Progress")] | length' 2>/dev/null || echo 0)

TODO_LIST=$(echo "$TASKS" | jq -r '
  [.[] | select(.status == "Todo" or .status == "TODO" or .status == "To Do")]
  | sort_by(.milestone // "zzz")
  | .[0:5]
  | if length > 0 then
      map("- #\(.number // .id): \(.title)\(if .milestone then " [\(.milestone)]" else "" end)")
      | join("\n")
    else empty end
' 2>/dev/null || echo "")

TODO_COUNT=$(echo "$TASKS" | jq '[.[] | select(.status == "Todo" or .status == "TODO" or .status == "To Do")] | length' 2>/dev/null || echo 0)

# 브리핑 생성
{
  echo "### GPM 태스크 브리핑"
  echo ""

  if [ -n "$IN_PROGRESS" ] && [ "$IN_PROGRESS_COUNT" -gt 0 ] 2>/dev/null; then
    echo "**In Progress (${IN_PROGRESS_COUNT})**:"
    echo "$IN_PROGRESS"
  fi

  if [ -n "$TODO_LIST" ] && [ "$TODO_COUNT" -gt 0 ] 2>/dev/null; then
    echo ""
    echo "**Todo 추천 (${TODO_COUNT}개 중 상위 5개, 마일스톤 순)**:"
    echo "$TODO_LIST"
  fi

  if [ -z "$IN_PROGRESS" ] && [ -z "$TODO_LIST" ]; then
    echo "등록된 태스크가 없습니다. \`/gpm sync\`로 GitHub과 동기화하세요."
  fi

  echo ""
  echo "> /gpm status | /gpm next | /gpm done"
} > "$CACHE_FILE"

cat "$CACHE_FILE"
exit 0
