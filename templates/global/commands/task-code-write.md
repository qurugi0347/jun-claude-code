---
description: .claude/plan/ 3종 문서를 기반으로 코드를 구현하고 실행 가능한 단위로 commit한다. checklist.md 기준으로 미완료 Task만 구현한다.
---

# task-code-write: Plan 기반 코드 구현

## Plan 문서

### plan.md
!`cat .claude/plan/plan.md 2>/dev/null || echo "(plan.md 없음 — /task-plan을 먼저 실행하세요)"`

### checklist.md
!`cat .claude/plan/checklist.md 2>/dev/null || echo "(checklist.md 없음)"`

### context.md
!`cat .claude/plan/context.md 2>/dev/null || echo "(context.md 없음)"`

## 최근 커밋 이력

!`git log --oneline -10 2>/dev/null || echo "(git 이력 없음)"`

## 실행 순서

### Step 1: Plan 검토

- plan.md의 TaskList와 checklist.md를 읽고 구현 순서를 파악한다
- checklist.md에서 미완료(`[ ]`) Task를 확인한다
- 이미 완료(`[x]`)된 Task는 건너뛴다

### Step 2: BFF 구현 순서 판단

FE/BE/DB가 모두 포함된 기능이면 아래 순서를 따른다:

```
FE 구현 → DB 설계 → Decision Gate → API 구현
```

FE-only, BE-only, DB-only 작업은 Step 3으로 바로 진행한다.

### Step 3: Task 단위 구현

`code-writer` agent를 호출하여 각 Task를 순서대로 구현한다:
- **Read-before-Write**: 파일 수정 전 반드시 Read로 파일 내용 확인
- BE 구현 순서: Entity → Service → Controller
- FE 구현 순서: 타입 → 훅 → 컴포넌트 → 페이지
- 빌드 가능 상태를 항상 유지한다
- plan.md 설계를 벗어나지 않는다

### Step 4: Task 단위 Commit

각 Task 완료 후 `git-manager` agent에 위임하여 커밋한다:
- 수정한 파일만 개별 지정하여 git add
- Git Skill 규칙에 따라 커밋 메시지 작성 (FEAT/FIX/REFACTOR 등)
- 하나의 논리적 변경 = 하나의 커밋

### Step 5: Checklist 업데이트

각 Task 완료 후 `checklist.md`의 해당 항목을 `[x]`로 업데이트한다.
