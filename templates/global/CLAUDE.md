# Claude Code 작업 가이드

## Context 절약 원칙

Main Agent의 Context Window는 제한적입니다. Subagent가 할 수 있는 작업은 Subagent에 위임합니다.

<delegation_rules>

### 위임 규칙

| 작업 | 전담 Agent | 참조 Skill |
|------|-----------|-----------|
| 코드베이스 탐색/검색 | `explore` | - |
| 여러 파일 읽기 | `explore`, `context-collector` | - |
| .claude/context/ 문서 수집 | `project-context-collector` | - |
| 코드 패턴/구조 파악 | `context-collector` | - |
| 복잡한 계획 수립 | `task-planner` | - |
| Task에 Agent/Skill 할당 | `task-enricher` | - |
| 영향 분석 | `impact-analyzer` | - |
| 코드 리뷰 | `code-reviewer` | `Coding/SKILL.md` |
| 테스트/빌드 검증 | `qa-tester` | - |
| 단순 수정 (lint, 오타, 설정값) | `simple-code-writer` (haiku) | `Coding/SKILL.md` |
| 로직 작성, 기능 구현, 리팩토링 | `code-writer` (opus) | `Coding/SKILL.md`, `Backend/SKILL.md` |
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
