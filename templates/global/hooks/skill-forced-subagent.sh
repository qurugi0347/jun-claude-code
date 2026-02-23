#!/bin/bash

# .claude/hooks/skill-forced-subagent.sh
# Subagent용 Skill 평가 프로토콜 - SubagentStart hook
# Subagent가 작업 시작 전 관련 Skills를 평가하고 활성화하도록 유도

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

echo "✅ [Hook] Subagent Skill 평가 프로토콜 실행됨"

cat << 'EOF'
SKILL EVALUATION (Subagent)

<phase name="Skill 평가">

## Skill 참조 방법

### 우선: TaskList에서 명시된 Skill 확인

현재 실행 중인 task의 `## Execution Plan` 섹션을 확인하세요.
task description에 skill 경로가 명시되어 있다면 해당 Skill만 읽으세요.

확인 방법:
1. `TaskList` 도구로 현재 task 목록 조회
2. 자신이 담당한 task 찾기 (description의 Execution Plan 확인)
3. 해당 subagent 항목의 `skill:` 필드에 명시된 SKILL.md만 읽기

### 폴백: Task에 Skill 정보 없을 경우

task description에 Execution Plan이 없거나 skill이 "없음"으로 명시된 경우,
아래 전체 Skill 목록에서 현재 작업과 관련된 Skill을 YES/NO로 평가하세요.

### 사용 가능한 Skills (자동 탐색됨)

</phase>
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
          head -6 "$skill_file"
          echo '```'
          echo ""
        fi
      fi
    done
  fi
done

cat << 'EOF'

Skill 규칙을 준수하여 작업을 시작하세요.
EOF
