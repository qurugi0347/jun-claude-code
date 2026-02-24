#!/bin/bash

# .claude/hooks/skill-forced.sh
# Skill/Agent 평가 프로토콜 - UserPromptSubmit hook
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

echo "✅ [Hook] Skill/Agent 평가 리마인더"

cat << 'EOF'
CLAUDE.md의 <evaluation_protocol>에 따라 Skill/Agent 평가를 출력하세요.
CLAUDE.md의 <delegation_rules>에 따라 Subagent에 위임하세요.

### 사용 가능한 Skills

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

cat << 'EOF'

### Project Context

EOF

# context 디렉토리에서 business/codebase context 동적 탐색
# 프로젝트 .claude/context/ 만 탐색 (글로벌 ~/.claude/context/는 탐색하지 않음)
CONTEXT_BASE_DIR="$PROJECT_CLAUDE_DIR/context"
HAS_CONTEXT=false

for context_type in "business" "codebase"; do
  context_dir="$CONTEXT_BASE_DIR/$context_type"
  if [ -d "$context_dir" ]; then
    HAS_CONTEXT=true

    # 헤더 출력
    if [ "$context_type" = "business" ]; then
      echo "---"
      echo ""
      echo "### Business Context"
      echo ""
    else
      echo "---"
      echo ""
      echo "### Codebase Context"
      echo ""
    fi

    # INDEX.md가 있으면 내용 출력
    if [ -f "$context_dir/INDEX.md" ]; then
      cat "$context_dir/INDEX.md"
      echo ""
    fi

    # INDEX.md 외의 .md 파일 목록을 상세 문서로 표시
    has_detail_docs=false
    for md_file in "$context_dir"/*.md; do
      if [ -f "$md_file" ] && [ "$(basename "$md_file")" != "INDEX.md" ]; then
        if [ "$has_detail_docs" = false ]; then
          has_detail_docs=true
        fi
        echo "상세 문서: \`$(basename "$md_file")\`"
      fi
    done
    echo ""
  fi
done

if [ "$HAS_CONTEXT" = false ]; then
  echo "프로젝트 context가 없습니다. (.claude/context/business/ 또는 .claude/context/codebase/ 디렉토리가 없음)"
  echo ""
fi

cat << 'EOF'

### 사용 가능한 Agents

EOF

# agents 폴더에서 agent 파일들의 frontmatter 자동 탐색
# 프로젝트 .claude/ 와 ~/.claude/ 양쪽에서 탐색 (프로젝트 우선, 중복 제거)
SEEN_AGENTS=""
for search_dir in "$PROJECT_CLAUDE_DIR" "$GLOBAL_CLAUDE_DIR"; do
  if [ -d "$search_dir/agents" ]; then
    for agent_file in "$search_dir/agents"/*.md; do
      if [ -f "$agent_file" ]; then
        agent_name=$(basename "$agent_file" .md)

        # CLAUDE.md는 제외
        if [ "$agent_name" = "CLAUDE" ]; then
          continue
        fi

        # 이미 탐색된 Agent는 건너뜀
        case "$SEEN_AGENTS" in
          *"|${agent_name}|"*) continue ;;
        esac
        SEEN_AGENTS="${SEEN_AGENTS}|${agent_name}|"

        # 출처 표시
        if [ "$search_dir" = "$PROJECT_CLAUDE_DIR" ]; then
          display_path=".claude/agents/$agent_name.md"
        else
          display_path="~/.claude/agents/$agent_name.md"
        fi
        echo "**[$agent_name]** \`$display_path\`"
        echo '```yaml'
        head -4 "$agent_file"
        echo '```'
        echo ""
      fi
    done
  fi
done

