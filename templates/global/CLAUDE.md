# Claude Code 작업 가이드

## Context 절약 원칙

Main Agent의 Context Window는 제한적입니다. Subagent가 할 수 있는 작업은 Subagent에 위임합니다.

<delegation_rules>

### 위임 규칙

| 작업 | 전담 Agent |
|------|-----------|
| 코드베이스 탐색/검색 | `explore` |
| 여러 파일 읽기 | `explore`, `context-collector` |
| .claude/context/ 문서 수집 | `project-context-collector` |
| 코드 패턴/구조 파악 | `context-collector` |
| 복잡한 계획 수립 | `task-planner` |
| 영향 분석 | `impact-analyzer` |
| 코드 리뷰 | `code-reviewer` |
| 테스트/빌드 검증 | `qa-tester` |
| 단순 수정 (lint, 오타, 설정값) | `simple-code-writer` (haiku) |
| 로직 작성, 기능 구현, 리팩토링 | `code-writer` (opus) |
| Git 작업 (commit, PR, branch) | `git-manager` |
| Context 문서 정리 | `context-manager` |

### Main Agent 전담

- 사용자와 대화/질문 응답
- Task 흐름 관리 (TaskCreate, TaskUpdate, TaskList)
- Subagent 호출 및 결과 전달

</delegation_rules>

<workflow>

## 작업 워크플로우

```
1. Context 수집 → 2. TaskList 생성 → 3. 수정 계획 (사용자 Confirm 필수)
                        ↓
4. 사이드이펙트 검증 (Code Flow, UserFlow, Breaking Change)
                        ↓
5. 코드 수정 (작은 단위) → 6. 단위별 커밋
                        ↓
7. Self Code Review (lint) → 8. Task 완료 검증
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

</reference>
