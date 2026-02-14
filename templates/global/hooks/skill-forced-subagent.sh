#!/bin/bash

# .claude/hooks/skill-forced-subagent.sh
# Subagent용 Skill 평가 프로토콜 - SubagentStart hook
# Subagent가 작업 시작 전 관련 Skills를 평가하고 활성화하도록 유도

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(dirname "$SCRIPT_DIR")"
GLOBAL_CLAUDE_DIR="$HOME/.claude"
PROJECT_CLAUDE_DIR="$(pwd)/.claude"

echo "✅ [Hook] Subagent Skill 평가 프로토콜 실행됨"

cat << 'EOF'
SKILL EVALUATION (Subagent)

<phase name="Skill 평가">

각 Skill을 YES/NO로 평가하고, YES인 Skill의 SKILL.md를 읽으세요.

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

관련 Skill 확인 후 작업을 시작하세요. Skill 규칙을 준수하세요.
EOF
