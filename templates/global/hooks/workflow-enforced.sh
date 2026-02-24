#!/bin/bash

# .claude/hooks/workflow-enforced.sh
# 작업 워크플로우 순서 강제 프로토콜 - UserPromptSubmit hook
# skills 폴더의 SKILL.md frontmatter를 자동으로 탐색

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(dirname "$SCRIPT_DIR")"
GLOBAL_CLAUDE_DIR="$HOME/.claude"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
PROJECT_CLAUDE_DIR="${PROJECT_ROOT:-.}/.claude"

# Dedup: project 우선, global은 project 버전 존재 시 양보
if [ -f "$SCRIPT_DIR/_dedup.sh" ]; then
  source "$SCRIPT_DIR/_dedup.sh"
  _hook_dedup_check "${BASH_SOURCE[0]}" || exit 0
fi

echo "✅ [Hook] 워크플로우 리마인더"

cat << 'EOF'
코드 작업 시 CLAUDE.md의 <workflow_protocol>을 따르세요.
예외: 단순 오타/설정/1-2줄 수정 시 Phase 축소 가능

### 참조 가능한 Skills

EOF

# skills 폴더에서 SKILL.md 파일들의 frontmatter 자동 탐색
# 프로젝트 .claude/ 와 ~/.claude/ 양쪽에서 탐색 (프로젝트 우선, 중복 제거)
SEEN_SKILLS=""
for search_dir in "$PROJECT_CLAUDE_DIR" "$GLOBAL_CLAUDE_DIR"; do
  if [ -d "$search_dir/skills" ]; then
    for skill_dir in "$search_dir/skills"/*/; do
      if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")
        skill_file="$skill_dir/SKILL.md"

        # 이미 탐색된 Skill은 건너뜀
        case "$SEEN_SKILLS" in
          *"|${skill_name}|"*) continue ;;
        esac
        SEEN_SKILLS="${SEEN_SKILLS}|${skill_name}|"

        if [ -f "$skill_file" ]; then
          # 출처 표시
          if [ "$search_dir" = "$PROJECT_CLAUDE_DIR" ]; then
            display_path=".claude/skills/$skill_name/SKILL.md"
          else
            display_path="~/.claude/skills/$skill_name/SKILL.md"
          fi
          echo "**[$skill_name]** \`$display_path\`"
          echo '```yaml'
          head -4 "$skill_file"
          echo '```'
          echo ""
        fi
      fi
    done
  fi
done

