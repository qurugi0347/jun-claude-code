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

작업을 시작하기 전에 반드시 아래 단계를 순서대로 완료하세요:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CONTEXT 절약 원칙 (최우선 - 반드시 준수) ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Main Agent의 Context Window는 제한적입니다.
**Subagent가 할 수 있는 작업은 반드시 Subagent에 위임하세요!**

### 🚨 필수 위임 작업 (Main Agent 직접 수행 금지)

| 작업 유형 | 사용할 Agent | 이유 |
|----------|-------------|------|
| 코드베이스 탐색/검색 | explore | 파일 내용이 Main Context에 쌓이지 않음 |
| 여러 파일 읽기 | explore / context-collector | 탐색 결과만 요약해서 받음 |
| 패턴/구조 파악 | context-collector | 분석 결과만 받음 |
| 복잡한 계획 수립 | task-planner | 계획 결과만 받음 |
| 영향 분석 | impact-analyzer | 분석 결과만 받음 |
| 코드 리뷰 | code-reviewer | 리뷰 결과만 받음 |
| 테스트/빌드 검증 | qa-tester | 검증 결과만 받음 |
| 간단한 코드 수정 (1-2파일) | simple-code-writer | 1-2개 파일도 Main이 직접 수정하지 않음 |
| 여러 파일 코드 작성 | code-writer / designer | 구현 결과만 받음 |
| Git 작업 | git-manager | 커밋/PR 결과만 받음 |

### ❌ 절대 금지 (Main Agent에서 직접 수행 금지)

- Main Agent에서 직접 Glob/Grep으로 여러 파일 탐색
- Main Agent에서 직접 여러 파일 Read (2개 이상)
- Main Agent에서 복잡한 분석/계획 수행
- Main Agent에서 3개 이상 파일 수정
- **Main Agent에서 직접 Git 명령어 실행 (git add, commit, push 등)**
- **Main Agent에서 직접 코드 수정 (Edit/Write로 코드 파일 수정 금지)**

### ✅ Main Agent 허용 작업 (이것만 직접 수행)

- 사용자와 대화/질문 응답
- Task 흐름 관리 (TaskCreate, TaskUpdate, TaskList)
- Subagent 호출 및 결과 전달
- 단순 명령 실행 (Bash) - **단, Git/코드수정 명령어 제외**

### 🔒 Git 작업은 반드시 Subagent 사용 (필수)

**모든 Git 작업은 `git-manager` Agent에 위임하세요!**

\`\`\`
Task(subagent_type="git-manager", prompt="현재 변경사항을 커밋해줘")
Task(subagent_type="git-manager", prompt="PR을 생성해줘")
\`\`\`

| Git 작업 | 위임 필수 | 이유 |
|----------|----------|------|
| 단순 커밋 | **필수** | 커밋 규칙 자동 준수 |
| PR 생성 | **필수** | PR 템플릿 자동 적용 |
| 브랜치 관리 | **필수** | 안전 규칙 자동 적용 |

### 💡 왜 Subagent를 사용해야 하는가?

1. **Context 절약**: Subagent의 탐색/분석 결과는 요약되어 Main에 전달
2. **대화 지속성**: Main Context가 절약되어 더 긴 대화 가능
3. **전문성**: 각 Agent는 특정 작업에 최적화됨
4. **병렬 처리**: 여러 Agent를 동시에 실행 가능

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1: SKILL 평가
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1 - Skill 평가: 각 Skill에 대해 다음을 명시하세요:
  - Skill 이름
  - YES 또는 NO (이 요청에 해당 Skill이 필요한가?)
  - 한 줄 이유

Step 2 - Skill 활성화: YES로 표시된 모든 Skill의 SKILL.md를 읽으세요.

---

### 사용 가능한 Skills (자동 탐색됨)

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1.5: CONTEXT 확인 (Subagent로 위임 권장)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**권장:** Context 확인은 `context-collector` Agent에 위임하세요.
직접 여러 파일을 읽으면 Main Context가 낭비됩니다.

```
Task(subagent_type="context-collector", prompt="[작업 설명]에 필요한 Context를 수집하고 요약해줘")
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2: AGENT 평가 (필수 - Context 절약)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 3 - Agent 평가: 각 Agent에 대해 다음을 명시하세요:
  - Agent 이름
  - YES 또는 NO (이 요청에 해당 Agent 활용이 필요한가?)
  - 한 줄 이유

Step 4 - Agent 활용: YES로 표시된 Agent는 Task 도구로 호출하세요.
  예: Task(subagent_type="task-planner", prompt="...")

---

### 사용 가능한 Agents (자동 탐색됨)

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 3: 구현
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 5 - 구현: 모든 관련 Skill 확인 및 Agent 호출 후에만 구현을 시작하세요.

---

### 중요

- **탐색 작업은 반드시 Subagent로**: Main Context 절약
- **구현 후 검증은 필수**: code-reviewer + qa-tester
- **단순 작업은 예외**: 설정 파일 수정, 오타 수정은 직접 처리 가능

지금 바로 모든 사용 가능한 Skill과 Agent를 평가하세요.
EOF
