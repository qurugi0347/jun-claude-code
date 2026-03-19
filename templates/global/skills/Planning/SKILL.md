---
name: Planning
description: 개발 계획 문서(plan.md, context.md, checklist.md) 작성 템플릿. DB/API/FE 설계와 의사결정 근거 포함.
keywords: [plan, 계획, DB설계, API구성, FE플로우, 의사결정, 차선책, planning, 마이그레이션]
user-invocable: true
context: fork
agent: task-planner
---

# 개발 계획 문서 작성 스킬

> `.claude/plan/` 폴더에 작성하는 3개 문서의 템플릿과 작성 규칙을 정의한다.

## Plan 문서 개요

| 문서 | 역할 | 핵심 내용 |
|------|------|----------|
| `plan.md` | 전체 설계 문서 | 목적, DB/API/FE 설계, 설계 결정, TaskList |
| `context.md` | 맥락 기록 | 사용자 요청 원문, 비즈니스/기술 배경, 탐색한 코드 |
| `checklist.md` | 실행 추적 | Phase별 체크리스트, Task별 세부 작업 |

### 문서 생명주기

```
draft → confirmed → in-progress → done
```

| 상태 | 의미 | 전환 시점 |
|------|------|----------|
| `draft` | 초안 작성 중 | 문서 생성 시 |
| `confirmed` | 사용자 승인 완료 | 사용자 Confirm 후 |
| `in-progress` | 구현 진행 중 | Phase 3 시작 시 |
| `done` | 작업 완료 | 모든 Task 완료 시 |

> Stop Hook에서 `plan.md`와 `checklist.md`를 참조하여 진행 상황을 추적한다.

---

<instructions>

## plan.md 템플릿

> 전체 설계를 담는 핵심 문서. 목적, 설계 결정, TaskList를 한 곳에 정리한다.

### Frontmatter

```yaml
---
name: [작업명]-plan
description: [작업명] 개발 계획
created: YYYY-MM-DD
status: draft  # draft | confirmed | in-progress | done
---
```

### 전체 구조

```markdown
# [작업명] Plan

## 목적 (Why)
- 목적: [이 작업을 왜 하는가]
- 문제: [어떤 문제를 해결하는가]
- 방법: [어떻게 해결할 것인가]

## DB 수정 계획
### 테이블 변경
| 테이블 | 변경 유형 | 컬럼 | 타입 | 설명 |
|--------|----------|------|------|------|
| users  | ADD      | role | varchar(20) | 사용자 역할 |

### 마이그레이션 순서
1. [첫 번째 마이그레이션]
2. [두 번째 마이그레이션]

### 설계 결정
- **선택:** [채택한 방안]
- **이유:** [왜 이 방안을 선택했는지]
- **차선책:** [고려했지만 선택하지 않은 방안]
- **차선책 미채택 이유:** [왜 차선책을 선택하지 않았는지]

## API 구성
### 엔드포인트 목록
| Method | Path | 설명 | Request | Response |
|--------|------|------|---------|----------|
| POST   | /api/users | 사용자 생성 | CreateUserDto | UserResponse |

### 각 API 상세
#### POST /api/users
- Request Body: ...
- Response: ...
- 에러 케이스: ...

### 설계 결정
- **선택:** [채택한 방안]
- **이유:** [왜 이 방안을 선택했는지]
- **차선책:** [고려했지만 선택하지 않은 방안]
- **차선책 미채택 이유:** [왜 차선책을 선택하지 않았는지]

## FE 페이지 Flow
### 화면 목록
| 페이지 | 경로 | 설명 |
|--------|------|------|
| 사용자 목록 | /users | 사용자 리스트 조회 |

### 페이지 흐름도
[목록] -> [상세] -> [수정]
          ↓
        [삭제 확인 모달]

### 컴포넌트 구조
UserListPage
├── UserTable
│   └── UserRow
├── UserSearchBar
└── Pagination

### 설계 결정
- **선택:** [채택한 방안]
- **이유:** [왜 이 방안을 선택했는지]
- **차선책:** [고려했지만 선택하지 않은 방안]
- **차선책 미채택 이유:** [왜 차선책을 선택하지 않았는지]

## 설계 결정 요약
| 영역 | 결정 | 이유 | 차선책 |
|------|------|------|--------|

## TaskList 요약
| Task | 설명 | 의존성 |
|------|------|--------|
```

</instructions>

---

<instructions>

## context.md 템플릿

> 작업의 맥락을 기록하여 구현 중 목적 희석을 방지한다.

### Frontmatter

```yaml
---
name: [작업명]-context
description: [작업명] 작업 맥락
created: YYYY-MM-DD
---
```

### 전체 구조

```markdown
# [작업명] Context

## 사용자 요청 원문
> (원문 그대로 인용)

## 비즈니스 배경
- 왜 이 작업이 필요한가
- 비즈니스 제약 조건

## 기술적 배경
- 현재 아키텍처 상태
- 관련 기존 코드/모듈

## 탐색한 코드
| 파일 | 관련 내용 |
|------|----------|

## 결정 사항
| 결정 | 근거 | 일시 |
|------|------|------|
```

</instructions>

---

<instructions>

## checklist.md 템플릿

> Phase별 진행 상황을 추적하고, Task별 세부 작업을 관리한다.

### Frontmatter

```yaml
---
name: [작업명]-checklist
description: [작업명] 실행 체크리스트
created: YYYY-MM-DD
---
```

### 전체 구조

```markdown
# [작업명] Checklist

## Phase 1: 계획
- [x] 목적 확인
- [x] Context 수집
- [x] Plan 문서 작성

## Phase 2: 검증
- [ ] Code Flow 분석
- [ ] UserFlow 분석
- [ ] Breaking Change 확인

## Phase 3: 구현
### Task 1: [제목]
- [ ] 세부 작업 1
- [ ] 세부 작업 2
- [ ] 커밋

### Task 2: [제목]
- [ ] 세부 작업 1
- [ ] 세부 작업 2
- [ ] 커밋

## Phase 4: 리뷰
- [ ] 전체 요구사항 충족 확인
- [ ] 엣지케이스 점검
```

</instructions>

---

<rules>

## 설계 결정(Decision) 작성 규칙

> 모든 설계 결정에는 "왜 이것을 선택했고, 왜 다른 것을 선택하지 않았는가"를 명시한다.

### 필수 항목

| 항목 | 설명 | 필수 |
|------|------|------|
| 선택 (What) | 무엇을 채택했는가 | 필수 |
| 이유 (Why) | 왜 이것을 선택했는가 | 필수 |
| 차선책 (Alternative) | 어떤 대안을 검토했는가 | 필수 |
| 차선책 미채택 이유 (Why Not) | 왜 차선책을 선택하지 않았는가 | 필수 |
| 트레이드오프 (Tradeoff) | 현재 선택의 단점은 무엇인가 | 선택 |

### 작성 형식

```markdown
- **선택:** JSON 컬럼 대신 별도 테이블로 분리
- **이유:** 검색/인덱싱 성능과 스키마 변경 유연성 확보
- **차선책:** JSON 컬럼으로 저장
- **차선책 미채택 이유:** 복잡한 쿼리 시 성능 저하, 타입 안정성 부족
- **트레이드오프:** JOIN 비용 증가 (캐싱으로 완화 가능)
```

### 적용 범위

> DB, API, FE 모든 영역의 설계 결정에 이 형식을 동일하게 적용한다.

| 영역 | 설계 결정 예시 |
|------|--------------|
| DB | 테이블 구조, 인덱스 전략, 정규화 수준 |
| API | 엔드포인트 설계, 인증 방식, 에러 처리 전략 |
| FE | 상태 관리 방식, 컴포넌트 구조, 라우팅 전략 |

</rules>

---

<rules>

## 선택적 섹션 규칙

> 모든 프로젝트에 DB/API/FE가 모두 존재하는 것은 아니다. 해당 영역이 있는 섹션만 선택하여 작성한다.

### 최소 필수 섹션

| 섹션 | 필수 여부 | 설명 |
|------|----------|------|
| 목적 (Why) | 필수 | 항상 포함 |
| 설계 결정 요약 | 필수 | 항상 포함 |
| TaskList 요약 | 필수 | 항상 포함 |
| DB 수정 계획 | 선택 | DB 변경이 있을 때만 |
| API 구성 | 선택 | API 변경이 있을 때만 |
| FE 페이지 Flow | 선택 | FE 변경이 있을 때만 |

### 영역별 선택 기준

```
DB 변경 있음  → DB 수정 계획 섹션 포함
API 변경 있음 → API 구성 섹션 포함
FE 변경 있음  → FE 페이지 Flow 섹션 포함
해당 없음     → 섹션 생략
```

</rules>

---

<checklist>

## Plan 문서 작성 시 검증

- [ ] plan.md에 목적(Why) 섹션이 있는가?
- [ ] 각 설계 결정에 이유와 차선책이 명시되어 있는가?
- [ ] context.md에 사용자 요청 원문이 인용되어 있는가?
- [ ] checklist.md에 Task별 세부 작업이 있는가?
- [ ] status 필드가 올바르게 설정되어 있는가?
- [ ] 선택적 섹션이 프로젝트에 맞게 포함/생략되어 있는가?
- [ ] 설계 결정에 트레이드오프가 기록되어 있는가? (선택 사항이지만 권장)

</checklist>

---

<reference>

## 관련 문서

| 문서 | 설명 |
|------|------|
| `CLAUDE.md` 워크플로우 | Plan 문서 생성 시점 (Step 1.5.5) |
| `.claude/skills/Documentation/SKILL.md` | 문서 작성 공통 규칙 |
| `.claude/skills/PromptStructuring/SKILL.md` | XML 태그 구조화 가이드 |

</reference>
