# Claude Code 작업 가이드

## Context 절약 원칙

Main Agent의 Context Window는 제한적입니다. Subagent가 할 수 있는 작업은 Subagent에 위임합니다.

<delegation_rules>

### 위임 규칙

| 작업 | 전담 Agent | 참조 Skill |
|------|-----------|-----------|
| 파일 위치 찾기 (Glob/Grep) | `explore` | - |
| 파일 내용 분석/여러 파일 읽기 | `context-collector` | - |
| .claude/context/ 문서 수집 | `project-context-collector` | - |
| 코드 패턴/구조 파악 | `context-collector` | - |
| 복잡한 계획 수립 | `task-planner` | - |
| Task에 Agent/Skill 할당 | `task-enricher` | - |
| 영향 분석 | `impact-analyzer` | - |
| 코드 리뷰 | `code-reviewer` | `Coding/SKILL.md` |
| 테스트/빌드 검증 | `qa-tester` | - |
| 단순 수정 (lint, 오타, 설정값) | `simple-code-writer` (haiku) | `Coding/SKILL.md` |
| 로직 작성, 기능 구현, 리팩토링 | `code-writer` (opus) | `Coding/SKILL.md`, `Backend/SKILL.md` |
| 파일 수정 (3개 이상) | `code-writer` | `Coding/SKILL.md` |
| 코드 수정 (Edit/Write) | `code-writer` / `simple-code-writer` | `Coding/SKILL.md` |
| Git 작업 (commit, PR, branch) | `git-manager` | `Git/SKILL.md` |
| Context 문서 정리 | `context-manager` | `Documentation/SKILL.md` |

### Main Agent 전담 (PM 역할)

Main agent는 **직접 코드를 읽거나 쓰지 않고**, 아래 역할에 집중합니다:

- 사용자와 대화/질문 응답
- Task 흐름 관리 (TaskCreate, TaskUpdate, TaskList)
- task에 명시된 Execution Plan에 따라 subagent 조율
- subagent 결과 수신 및 다음 subagent 프롬프트 구성
- 결과 검증 (qa-tester 또는 code-reviewer 호출)

**구현 단계에서 Main agent의 역할**:
- TaskList의 각 task에는 `## Execution Plan`이 명시되어 있음
- 해당 계획에 따라 subagent를 순차/병렬로 호출
- subagent output을 다음 subagent의 input으로 전달
- Critical 이슈 발견 시 해당 단계 subagent 재호출
- 모든 Git 작업(커밋, PR, 브랜치)은 git-manager에 위임

### Skill 위임 원칙 (skill-forced-subagent.sh 활용)

`SubagentStart` hook(`skill-forced-subagent.sh`)은 subagent가 TaskList에서 자신의 task를 찾아 명시된 skill만 읽도록 안내합니다.

**핵심 원칙**: 형식 규칙을 프롬프트에 직접 쓰지 말고, SKILL.md를 먼저 읽도록 지시하라.

#### Subagent 위임 시 Skill 지시 방법

subagent 프롬프트에 형식을 직접 쓰는 대신, 아래 패턴을 사용하세요:

```
먼저 해당 task의 Execution Plan에 명시된 skill SKILL.md를 읽고 규칙을 파악한 뒤 작업하세요.
```

Execution Plan에 skill이 없는 경우:
```
먼저 ~/.claude/skills/ 에서 이 작업과 관련된 SKILL.md를 찾아 읽고 규칙을 따르세요.
```

</delegation_rules>

<workflow>

## 작업 워크플로우

```
1. Context 수집 → 2. TaskList 생성 → 3. Agent/Skill 할당 (task-enricher) → 4. 수정 계획
                                                                                      ↓
                                          4.5. Plan 문서 생성 (.claude/plan/) → 5. 사용자 Confirm
                                                                                      ↓
                                          6. 사이드이펙트 검증 (Code Flow, UserFlow, Breaking Change)
                                                                                      ↓
                                          7. 코드 수정 (Execution Plan에 따라 subagent 조율) → 8. 단위별 커밋
                                                                                      ↓
                                          9. Self Code Review (lint) → 10. Task 완료 검증
```

</workflow>

<workflow_protocol>

## 워크플로우 상세 프로토콜

코드 작업 시 아래 Phase 순서를 따르세요.
각 Phase를 순서대로 완료한 후 다음 Phase로 진행하세요.

<phase name="계획">

## PHASE 1: 계획 (Planning) - 구현 전 필수

<checklist>

### Step 1.1: 작업 목적 확인 -- 기능 요청 시 필수

사용자에게 아래 3가지를 반드시 확인하고, Plan 문서에 기록하세요:
- [ ] 목적: 이 작업을 왜 하는가? (What is the goal?)
- [ ] 문제: 어떤 문제를 해결하는가? (What problem does it solve?)
- [ ] 방법: 어떻게 해결할 것인가? (How will it be solved?)

Plan 파일의 Context 섹션에 위 내용을 명시하여 작업 목적이 희석되지 않도록 관리합니다.

### Step 1.2: Context 수집

- [ ] EnterPlanMode 진입 (복잡한 작업인 경우)
- [ ] **병렬 Context 수집 (정확도 향상)**:
  - `project-context-collector` → .claude/context/ 문서에서 프로젝트 배경 수집
  - `context-collector` → 소스 코드 + .claude/context/ 에서 패턴/구현 방식 수집
  - 두 Agent를 병렬로 호출하여 작업 속도와 정확도를 높인다
- [ ] 필요한 Skill 활성화 (.claude/skills/)

### Step 1.3: TaskList 생성

필수 조건:
- [ ] 작업을 작은 단위로 분해
- [ ] 각 Task에 명확한 완료 조건 정의
- [ ] Task 간 의존성 설정

### Step 1.3.5: 각 Task에 Agent/Skill 할당 ← 필수

`task-enricher` Agent를 호출하여 TaskList의 각 Task에 실행 계획을 추가합니다:
- [ ] 각 task에 담당 subagent 순서 명시 (순차/병렬 구분)
- [ ] 각 subagent가 참조할 Skill 경로 명시
- [ ] subagent 간 input/output 연결 구조 정의
- [ ] Main agent 조율 지점 명시

> task-enricher 완료 후 TaskList의 각 task description에 `## Execution Plan` 섹션이 추가됩니다.
> 이후 구현 단계에서 Main agent는 이 계획에 따라 subagent를 조율합니다.

### Step 1.4: 코드 수정 계획 작성

필수 출력:
- [ ] 수정할 파일 목록
- [ ] 각 파일의 변경 내용 요약
- [ ] 예상되는 영향 범위

### Step 1.5: Plan 검증 (선택)

복잡한 Plan의 경우 `plan-verifier` Agent로 검증을 권장합니다:
- [ ] 목적 정합성, 완전성, 논리적 일관성, 실현 가능성, 스코프 초과 여부 검증

### Step 1.5.5: Plan 문서 생성 -- 필수

계획이 확정되면 프로젝트의 `.claude/plan/` 폴더에 3가지 문서를 생성하세요:

- [ ] `.claude/plan/plan.md` -- 전체 계획 (목적, 설계, 수정 파일 목록, TaskList 요약)
- [ ] `.claude/plan/context.md` -- 맥락 (사용자 요청 원문, 비즈니스/기술적 배경, 탐색한 코드, 결정 사항)
- [ ] `.claude/plan/checklist.md` -- 실행 체크리스트 (Phase별 체크리스트, Task별 세부 작업)

각 문서에는 frontmatter(name, description, created)를 포함하세요.
이 문서들은 구현 중 맥락 유실 방지와 진행 추적에 활용됩니다.

### Step 1.6: 사용자 Confirm -- 필수

- [ ] 계획을 사용자에게 보여주고 승인받은 후 구현 진행

</checklist>

</phase>

<phase name="검증">

## PHASE 2: 검증 (Validation) - 구현 전 필수

<checklist>

### Step 2.1: 사이드이펙트 검증

필수 분석:
- [ ] Code Flow 분석: 변경이 다른 모듈에 미치는 영향
- [ ] UI/UX UserFlow 분석: 사용자 경험에 미치는 영향
- [ ] Breaking Change 여부 확인

</checklist>

</phase>

<phase name="구현">

## PHASE 3: 구현 (Implementation)

<checklist>

### Step 3.1: 작은 단위로 코드 수정

필수 원칙:
- [ ] 독립적으로 빌드 가능한 단위로 작업
- [ ] 한 번에 하나의 기능/수정만 진행
- [ ] 빌드 가능 상태를 유지

### Step 3.2: 단위별 커밋

필수 규칙:
- [ ] 수정한 파일만 개별 지정하여 git add
- [ ] 명확한 커밋 메시지 작성 (Git Skill 참조)
- [ ] 커밋 단위: 하나의 논리적 변경

</checklist>

</phase>

<phase name="리뷰">

## PHASE 4: 리뷰 (Review) - 구현 후 필수

<checklist>

### Step 4.1: Self Code Review

필수 검토:
- [ ] 프로젝트 규칙 준수 확인
- [ ] Skill checklist 기준 검토
- [ ] lint 실행

### Step 4.2: Task 완료 검증

- [ ] 원래 요청사항이 모두 충족되었는지 확인
- [ ] 예상한 동작이 구현되었는지 확인
- [ ] 모든 엣지케이스가 처리되었는지 점검

</checklist>

</phase>

예외: 단순 오타/설정/1-2줄 수정, 사용자가 빠른 수정 요청 시 Phase 축소 가능

</workflow_protocol>

<evaluation_protocol>

## Skill/Agent 평가 프로토콜

응답 시작 시 아래 Skill/Agent 평가를 출력하세요.

### Skill 평가

응답에 아래 형식으로 Skill 평가를 출력하세요:

- [Skill이름]: YES/NO - 이유
- 예: `Git: YES - 커밋 작업 필요`

YES인 Skill의 SKILL.md를 읽으세요.

### Project Context 참조

작업 판단 시 프로젝트 배경 정보를 참고하세요.
상세 분석이 필요하면 아래 Agent에 위임하세요.

| 필요한 정보 | Agent |
|------------|-------|
| 프로젝트 배경/도메인 지식 | project-context-collector |
| 소스 코드 패턴/구현 방식 | context-collector |

### Agent 평가

응답에 아래 형식으로 Agent 평가를 출력하세요:

- [Agent이름]: YES/NO - 이유
- 예: `git-manager: YES - 커밋 작업 위임`

YES인 Agent는 Task 도구로 호출하세요.

평가를 출력한 후에 구현을 시작하세요.

</evaluation_protocol>

## 문서 참조

<reference>

| 유형 | 위치 |
|------|------|
| 프로젝트 배경 정보 | `.claude/context/` |
| 공통 코딩 원칙 | `.claude/skills/Coding/SKILL.md` |
| Git 규칙 | `.claude/skills/Git/SKILL.md` |
| 문서 작성 가이드 | `.claude/skills/Documentation/SKILL.md` |
| 현재 작업 계획 | `.claude/plan/` (plan.md, context.md, checklist.md) |

</reference>
