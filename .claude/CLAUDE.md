# Claude Code 작업 가이드

이 파일은 Claude Code의 작업 워크플로우와 규칙을 정의합니다.

## Context 절약 원칙 (최우선 - 반드시 준수)

Main Agent의 Context Window는 제한적입니다.
**Subagent가 할 수 있는 작업은 반드시 Subagent에 위임하세요!**

### 필수 위임 작업 (Main Agent 직접 수행 금지)

| 작업 | Agent | 이유 |
|------|-------|------|
| 코드베이스 탐색/검색 | `explore` | 파일 내용이 Main Context에 쌓이지 않음 |
| 여러 파일 읽기 | `explore`, `context-collector` | 탐색 결과만 요약해서 받음 |
| 패턴/구조 파악 | `context-collector` | 분석 결과만 받음 |
| 복잡한 계획 수립 | `task-planner` | 계획 결과만 받음 |
| 영향 분석 | `impact-analyzer` | 분석 결과만 받음 |
| 코드 리뷰 | `code-reviewer` | 리뷰 결과만 받음 |
| 테스트/빌드 검증 | `qa-tester` | 검증 결과만 받음 |
| 단순 수정 (lint/build 오류, 오타, 설정값) | `simple-code-writer` | Main이 직접 수정하지 않음 |
| 여러 파일 코드 작성 | `code-writer` | 구현 결과만 받음 |
| Git 작업 | `git-manager` | 커밋/PR 결과만 받음 |
| Context 문서 정리 | `context-manager` | 파일 분리, 토큰 최적화 |

### 절대 금지 (Main Agent에서 직접 수행 금지)

- Main Agent에서 직접 Glob/Grep으로 여러 파일 탐색
- Main Agent에서 직접 여러 파일 Read (2개 이상)
- Main Agent에서 복잡한 분석/계획 수행
- Main Agent에서 3개 이상 파일 수정
- **Main Agent에서 직접 Git 명령어 실행 (git add, commit, push 등)**
- **Main Agent에서 직접 코드 수정 (Edit/Write로 코드 파일 수정)**

### Main Agent 허용 작업 (이것만 직접 수행)

- 사용자와 대화/질문 응답
- Task 흐름 관리 (TaskCreate, TaskUpdate, TaskList)
- Subagent 호출 및 결과 전달
- 단순 명령 실행 (Bash) - **단, Git 명령어 제외**

### Main Agent 코드 수정 금지

Main Agent는 **절대 코드를 직접 수정하지 않습니다.**
모든 코드 수정은 Subagent에 위임하세요.

| 수정 유형 | Agent | 모델 |
|----------|-------|------|
| lint/build 오류 수정, 오타, 설정값 변경 등 단순 수정 | `simple-code-writer` | haiku |
| 로직 작성, 기능 구현, 리팩토링 (파일 수 무관) | `code-writer` | opus |

### Git 작업은 반드시 Subagent 사용

**모든 Git 작업은 `git-manager` Agent에 위임하세요!**

```
Task(subagent_type="git-manager", prompt="현재 변경사항을 커밋해줘")
Task(subagent_type="git-manager", prompt="PR을 생성해줘")
```

### 왜 Subagent를 사용해야 하는가?

1. **Context 절약**: Subagent의 탐색/분석 결과는 요약되어 Main에 전달
2. **대화 지속성**: Main Context가 절약되어 더 긴 대화 가능
3. **전문성**: 각 Agent는 특정 작업에 최적화됨
4. **병렬 처리**: 여러 Agent를 동시에 실행 가능

### 코드 작성 위임 기준

| 상황 | 처리 |
|------|------|
| lint/build 오류, 오타, 설정값 등 단순 수정 | `simple-code-writer` Agent에 위임 |
| 로직 작성, 기능 구현, 리팩토링 | `code-writer` Agent에 위임 |

## 작업 워크플로우 (필수)

모든 코드 작업은 아래 순서를 따릅니다:

### Phase 1: 계획 (Planning)

```
1. Context 수집
   - EnterPlanMode 진입
   - 관련 Context 문서 확인 (.claude/context/)
   - 필요한 Skill 활성화 (.claude/skills/)
   - 기존 코드 탐색 (Explore Agent)

2. TaskList 생성
   - 작업을 작은 단위로 분해
   - 각 Task에 명확한 완료 조건 정의
   - Task 간 의존성 설정

3. 코드 수정 계획 작성
   - 수정할 파일 목록
   - 각 파일의 변경 내용 요약
   - 예상되는 영향 범위

4. 작성된 내용을 사용자에게 Confirm 받음 **필수**
```

### Phase 2: 검증 (Validation)

```
4. 사이드이펙트 검증
   - 코드 Flow 분석: 변경이 다른 모듈에 미치는 영향
   - UI/UX UserFlow 분석: 사용자 경험에 미치는 영향
   - Breaking Change 여부 확인
```

### Phase 3: 구현 (Implementation)

```
5. 작은 단위로 코드 수정
   - 독립적으로 빌드 가능한 단위로 작업
   - 한 번에 하나의 기능/수정만 진행
   - 빌드 에러가 발생하지 않는 상태 유지

6. 단위별 커밋
   - 수정한 파일만 git add (git add -A 금지)
   - 명확한 커밋 메시지 작성
   - 커밋 단위: 하나의 논리적 변경
```

### Phase 4: 리뷰 (Review)

```
7. Self Code Review
   - 작성한 코드가 프로젝트 규칙을 준수하는지 확인
   - lint 실행

8. Task 완료 검증
   - 원래 요청사항이 모두 충족되었는지 확인
   - 예상한 동작이 구현되었는지 확인
   - 누락된 엣지케이스 없는지 점검
```

### 워크플로우 요약

```
┌─────────────────────────────────────────────────────────────┐
│  1. Context 수집 → 2. TaskList → 3. 수정 계획              │
│                        ↓                                    │
│  4. 사이드이펙트 검증 (Code Flow, UserFlow)                 │
│                        ↓                                    │
│  5. 코드 수정 (작은 단위) → 6. git add & commit (단위별)    │
│                        ↓                                    │
│  7. Self Code Review → 8. Task 완료 검증                    │
└─────────────────────────────────────────────────────────────┘
```

## 문서 참조

### Context (사실/배경) - "우리 프로젝트는 이렇다"

프로젝트별로 `.claude/context/` 에 작성

### Skills (방법/절차) - "이렇게 해라"

| 작업 | 위치 |
|-----|------|
| 공통 코딩 원칙 | `.claude/skills/Coding/SKILL.md` |
| Git 커밋/PR 생성 | `.claude/skills/Git/SKILL.md` |
| PR 리뷰 | `.claude/skills/Git/pr-review.md` |
| PR 피드백 적용 | `.claude/skills/Git/pr-apply.md` |

---

## .claude 문서 작성 가이드

`.claude/skills/Documentation/SKILL.md` 참조

### 핵심 요약

| 항목 | 내용 |
|------|------|
| 디렉토리 | `context/` (사실), `skills/` (방법), `agents/` (역할) |
| 파일 길이 | ~500줄 권장, 1000줄 초과 시 분리 |
| 필수 작성 | YAML frontmatter (name, description, keywords) |

상세 내용은 **Documentation Skill**을 참조하세요.
