#!/bin/bash

# .claude/hooks/workflow-enforced.sh
# 작업 워크플로우 순서 강제 프로토콜 - UserPromptSubmit hook
# skills 폴더의 SKILL.md frontmatter를 자동으로 탐색

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(dirname "$SCRIPT_DIR")"
GLOBAL_CLAUDE_DIR="$HOME/.claude"
PROJECT_CLAUDE_DIR="$(pwd)/.claude"

echo "✅ [Hook] 워크플로우 순서 강제 프로토콜 실행됨"

cat << 'EOF'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY WORKFLOW SEQUENCE PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

코드 작업 시 반드시 아래 Phase 순서를 따르세요.
각 Phase를 건너뛰거나 순서를 바꾸지 마세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: 계획 (Planning) - 구현 전 필수
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Step 1.1: Context 수집

필수 조건:
- [ ] EnterPlanMode 진입 (복잡한 작업인 경우)
- [ ] 관련 Context 문서 확인 (.claude/context/)
- [ ] 필요한 Skill 활성화 (.claude/skills/)
- [ ] 기존 코드 탐색 (Explore Agent 또는 직접 탐색)

### Step 1.2: TaskList 생성

필수 조건:
- [ ] 작업을 작은 단위로 분해
- [ ] 각 Task에 명확한 완료 조건 정의
- [ ] Task 간 의존성 설정

도구: TaskCreate, TaskUpdate, TaskList

### Step 1.3: 코드 수정 계획 작성

필수 출력:
- [ ] 수정할 파일 목록
- [ ] 각 파일의 변경 내용 요약
- [ ] 예상되는 영향 범위

### Step 1.4: 사용자 Confirm 받기 ⚠️ 필수

중요: 계획을 사용자에게 보여주고 승인받은 후에만 구현 진행
- ExitPlanMode 사용 (Plan Mode인 경우)
- 또는 계획 내용을 명시적으로 보여주고 확인 요청

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: 검증 (Validation) - 구현 전 필수
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Step 2.1: 사이드이펙트 검증

필수 분석:
- [ ] Code Flow 분석: 변경이 다른 모듈에 미치는 영향
- [ ] UI/UX UserFlow 분석: 사용자 경험에 미치는 영향
- [ ] Breaking Change 여부 확인

도구: impact-analyzer Agent (복잡한 경우)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: 구현 (Implementation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Step 3.1: 작은 단위로 코드 수정

필수 원칙:
- [ ] 독립적으로 빌드 가능한 단위로 작업
- [ ] 한 번에 하나의 기능/수정만 진행
- [ ] 빌드 에러가 발생하지 않는 상태 유지

### Step 3.2: 단위별 커밋

필수 규칙:
- [ ] 수정한 파일만 git add (git add -A 금지 ⚠️)
- [ ] 명확한 커밋 메시지 작성 (Git Skill 참조)
- [ ] 커밋 단위: 하나의 논리적 변경

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4: 리뷰 (Review) - 구현 후 필수
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Step 4.1: Self Code Review

필수 검토:
- [ ] 프로젝트 규칙 준수 확인
- [ ] Skill checklist 기준 검토
- [ ] lint 실행

도구: code-reviewer Agent

### Step 4.2: Task 완료 검증

필수 확인:
- [ ] 원래 요청사항이 모두 충족되었는지 확인
- [ ] 예상한 동작이 구현되었는지 확인
- [ ] 누락된 엣지케이스 없는지 점검

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
워크플로우 요약
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: 계획                                              │
│  ├─ 1.1 Context 수집                                        │
│  ├─ 1.2 TaskList 생성                                       │
│  ├─ 1.3 수정 계획 작성                                       │
│  └─ 1.4 사용자 Confirm ⚠️                                   │
│                        ↓                                    │
│  PHASE 2: 검증                                              │
│  └─ 2.1 사이드이펙트 검증 (Code Flow, UserFlow)              │
│                        ↓                                    │
│  PHASE 3: 구현                                              │
│  ├─ 3.1 코드 수정 (작은 단위)                                │
│  └─ 3.2 git add & commit (단위별)                           │
│                        ↓                                    │
│  PHASE 4: 리뷰                                              │
│  ├─ 4.1 Self Code Review + lint                             │
│  └─ 4.2 Task 완료 검증                                      │
└─────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
참조 가능한 Skills (자동 탐색됨)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
예외 상황
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

다음의 경우 Phase를 축소/생략 가능:
- 단순 오타 수정
- 설정 파일 간단 수정
- 1-2줄 변경
- 사용자가 명시적으로 빠른 수정 요청

그 외 모든 코드 작업은 반드시 위 순서를 따르세요.
EOF
