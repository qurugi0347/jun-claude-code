#!/bin/bash

# .claude/hooks/skill-forced.sh
# Skill/Agent 평가 프로토콜 - UserPromptSubmit hook
# skills 폴더의 SKILL.md frontmatter를 자동으로 탐색

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(dirname "$SCRIPT_DIR")"
GLOBAL_CLAUDE_DIR="$HOME/.claude"
PROJECT_CLAUDE_DIR="$(pwd)/.claude"

echo "✅ [Hook] Skill/Agent 평가 프로토콜 실행됨"

cat << 'EOF'
MANDATORY SKILL & AGENT EVALUATION PROTOCOL

작업을 시작하기 전에 아래 단계를 순서대로 완료하세요:

<delegation_rules>

## CONTEXT 절약 원칙 (최우선)

Main Agent의 Context Window는 제한적입니다.
**Subagent가 할 수 있는 작업은 Subagent에 위임하세요.**

### Subagent 전담 작업

아래 PART 2의 "사용 가능한 Agents" 목록에서 각 Agent의 description을 확인하고,
작업에 적합한 Agent에 위임하세요. 각 Agent의 description에 위임 이유가 포함되어 있습니다.

### Subagent 전용 작업

| 작업 | 전담 Agent |
|------|-----------|
| 파일 탐색 (Glob/Grep) | explore Agent가 전담 |
| .claude/context/ 문서 탐색 | project-context-collector가 전담 |
| 소스 코드 패턴/구조 파악 | context-collector가 전담 |
| 2개 이상 파일 읽기 | explore/context-collector가 전담 |
| 복잡한 분석/계획 | task-planner에 위임 |
| 파일 수정 (3개 이상) | code-writer가 전담 |
| Git 명령어 실행 (git add, commit, push 등) | git-manager에 위임 |
| 코드 수정 (Edit/Write) | code-writer/simple-code-writer에 위임 |

### Main Agent 전담 작업

- 사용자와 대화/질문 응답
- Task 흐름 관리 (TaskCreate, TaskUpdate, TaskList)
- Subagent 호출 및 결과 전달
- 단순 명령 실행 (Bash) - **Git/코드수정은 Subagent 전담**

모든 Git 작업(커밋, PR, 브랜치)은 git-manager에 위임

</delegation_rules>

<phase name="Skill 평가">

## PART 1: SKILL 평가

Step 1 - Skill 평가: 각 Skill에 대해 다음을 명시하세요:
  - Skill 이름
  - YES 또는 NO (이 요청에 해당 Skill이 필요한가?)
  - 한 줄 이유

Step 2 - Skill 활성화: YES로 표시된 모든 Skill의 SKILL.md를 읽으세요.

---

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

<phase name="Context 확인">

## PART 1.5: PROJECT CONTEXT (프로젝트 배경 정보)

아래는 이 프로젝트의 배경 정보입니다. 작업 판단 시 참고하세요.
상세 분석이 필요하면 아래 Agent에 위임하세요.

| 필요한 정보 | Agent |
|------------|-------|
| 프로젝트 배경/도메인 지식 | project-context-collector |
| 소스 코드 패턴/구현 방식 | context-collector |

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

</phase>

<phase name="Agent 평가">

## PART 2: AGENT 평가 (Context 절약 핵심)

Step 3 - Agent 평가: 각 Agent에 대해 다음을 명시하세요:
  - Agent 이름
  - YES 또는 NO (이 요청에 해당 Agent 활용이 필요한가?)
  - 한 줄 이유

Step 4 - Agent 활용: YES로 표시된 Agent는 Task 도구로 호출하세요.
  예: Task(subagent_type="task-planner", prompt="...")

---

### 사용 가능한 Agents (자동 탐색됨)

</phase>
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
        head -6 "$agent_file"
        echo '```'
        echo ""
      fi
    done
  fi
done

cat << 'EOF'

<phase name="구현">

## PART 3: 구현

Step 5 - 구현: 모든 관련 Skill 확인 및 Agent 호출 후에 구현을 시작하세요.

---

탐색은 Subagent 전담, 구현 후 검증(code-reviewer + qa-tester), 단순 작업은 직접 처리 가능

지금 바로 모든 사용 가능한 Skill과 Agent를 평가하세요.

</phase>
EOF
