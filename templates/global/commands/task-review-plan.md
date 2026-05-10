---
description: 작성된 plan.md, checklist.md, context.md 3종 문서를 사용자 flow, 유지보수, 성능, 오버엔지니어링 등 다양한 관점에서 리뷰하고 개선점을 제안한다.
---

# task-review-plan: Plan 문서 리뷰

## Codex 가용성

!`command -v codex >/dev/null 2>&1 && test -f ~/.codex/auth.json && echo "codex_available" || echo "codex_unavailable"`

## Plan 문서

### plan.md
!`cat .claude/plan/plan.md 2>/dev/null || echo "(plan.md 없음 — /task-plan을 먼저 실행하세요)"`

### context.md
!`cat .claude/plan/context.md 2>/dev/null || echo "(context.md 없음)"`

### checklist.md
!`cat .claude/plan/checklist.md 2>/dev/null || echo "(checklist.md 없음)"`

## 리뷰 실행

위 "Codex 가용성" 출력값에 따라 분기한다.

### A. codex_available

`/codex:rescue` 슬래시 커맨드 또는 `codex-rescue` subagent(Task tool)에 plan 리뷰를 위임한다.

**Codex 위임 프롬프트 구성**:
- 리뷰 대상 파일 경로:
  - `.claude/plan/plan.md`
  - `.claude/plan/context.md`
  - `.claude/plan/checklist.md`
- 적용할 5개 기본 리뷰 관점 (아래 "리뷰 관점" 섹션 전체 전달)
- 추가 지시: **plan의 목적과 도메인에 따라 필요한 관점을 자유롭게 추가하여 리뷰한다**
- 산출물 형식: 본 문서 하단의 "출력 형식"을 그대로 따른다 (요약/Critical/Warning/긍정 평가/권장 수정)

Codex 응답 수신 후 Claude가 수행할 작업:
1. Codex 리뷰 결과를 본 문서의 "출력 형식"에 맞춰 정규화
2. 표(Critical/Warning) 형식 검증 및 누락 컬럼 보강
3. 사용자에게 최종 리뷰 결과 제시

### B. codex_unavailable

`plan-verifier` agent를 호출하여 아래 관점에서 검토하고 Critical/Warning으로 분류한다.

## 리뷰 관점

아래는 기본 리뷰 관점이다. **plan의 목적과 도메인에 따라 추가로 필요한 관점이 있다면 자유롭게 추가하여 리뷰한다.**

### 1. 목적 정합성
- context.md의 사용자 요청 원문과 plan.md 구현 방향이 일치하는가?
- TaskList가 목적 달성에 충분한가?
- 요청에 없는 기능이 포함되어 있지는 않은가?

### 2. 사용자 Flow 관점
- FE Flow가 사용자 관점에서 자연스러운가?
- 에러 상태, 로딩 상태, 빈 상태가 고려되었는가?
- 사용자에게 적절한 피드백이 제공되는가?

### 3. 코드 유지보수 관점
- 설계가 기존 코드 패턴과 일관성이 있는가?
- 향후 변경 시 수정 범위가 적절한가?
- 불필요한 추상화나 레이어가 있는가?

### 4. 성능 관점
- DB 쿼리 설계에 N+1 등 성능 이슈가 있는가?
- 대량 데이터 처리 시 문제가 될 수 있는 부분이 있는가?
- 캐싱 전략이 필요한 부분이 있는가?

### 5. 오버엔지니어링 관점
- 요구사항 대비 복잡도가 과한 부분이 있는가?
- 현재 필요하지 않은 기능이 포함되어 있는가?
- 더 단순한 구현 방법이 있는가?

## 출력 형식

```
# Plan 리뷰 결과

## 요약
- Critical: X건 / Warning: Y건
- 적용된 리뷰 관점: (기본 5개 + 추가된 관점 목록)

## Critical 이슈 (구현 전 반드시 수정)
| # | 관점 | 내용 | 제안 |
|---|------|------|------|

## Warning (검토 권장)
| # | 관점 | 내용 | 제안 |
|---|------|------|------|

## 긍정 평가
- 잘 설계된 부분 목록

## 권장 수정 사항
Critical 이슈 해결을 위한 구체적 수정 방법
```
