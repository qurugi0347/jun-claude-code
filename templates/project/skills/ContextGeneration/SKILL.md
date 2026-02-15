---
name: ContextGeneration
description: PR 변경 내용을 분석하여 .claude/context/ 문서를 자동 생성하는 규칙
keywords: [context, codebase, business, PR, 자동생성, 문서화]
estimated_tokens: ~800
---

# Context 자동 생성 규칙

PR 변경 내용을 분석하여 `.claude/context/` 하위에 codebase/business 문서를 자동 생성합니다.

## Context 디렉토리 구조

```
.claude/context/
├── codebase/        # 모듈별 구현 참조
│   ├── INDEX.md
│   └── <module-name>.md
├── business/        # 비즈니스 레벨 요약
│   ├── INDEX.md
│   └── <domain-area>.md
└── architecture/    # 인프라 + 코드 아키텍처
    ├── INDEX.md
    └── <topic>.md
```

<rules>

## Codebase Context 규칙

### 파일명
- **kebab-case** 사용 (예: `cli.md`, `copy-logic.md`, `auth-middleware.md`)
- 모듈/기능 단위로 분리

### 필수 섹션

```markdown
---
name: <모듈명>
description: <한 줄 설명>
keywords: [관련, 키워드]
---

# <모듈명>

<2-3문장 개요>

## 파일 구조

| 파일 | 역할 | 핵심 함수/클래스 |
|------|------|-----------------|
| src/example.ts | 메인 로직 | mainFunction(), HelperClass |

## 핵심 흐름

1. <진입점> → <처리> → <결과>
2. ...

## 관련 Business Context

- [<도메인명>](../business/<domain>.md)
```

### 참조 원칙

- 파일 경로와 함수/클래스명만 참조한다
- 파일 참조 형식: `| src/copy.ts | 파일 복사 메인 로직 | mergeSettingsJson() |`
- 원본 소스 코드 대신 경로와 함수 시그니처로 표현한다

## Business Context 규칙

### 파일명
- **비즈니스 도메인 기준**으로 명명한다 (예: `configuration-management.md`, `user-authentication.md`)
- 비즈니스 용어를 사용한다 (예: `settings-json-merge.md` -> `configuration-management.md`)

### 필수 섹션

```markdown
---
name: <도메인명>
description: <비즈니스 관점 한 줄 설명>
keywords: [비즈니스, 키워드]
---

# <도메인명>

## 목적

<이 기능이 사용자에게 제공하는 가치>

## 핵심 기능

| 기능 | 설명 | 사용자 관점 |
|------|------|------------|
| 설정 복사 | 템플릿 설정을 사용자 환경에 적용 | 초기 설정 자동화 |

## 사용자 흐름

1. 사용자가 <동작> → <결과>
2. ...

## 관련 Codebase Context

- [<모듈명>](../codebase/<module>.md)
```

### 변환 규칙
- Codebase의 기술 용어를 비즈니스 관점으로 변환한다
  - `mergeSettingsJson()` -> "기존 설정을 보존하면서 새 설정 적용"
  - `copyClaudeFiles()` -> "템플릿 설정을 사용자 환경에 배포"

## Architecture Context 규칙

### 파일명
- **kebab-case** 사용 (예: `deployment.md`, `database-schema.md`, `layer-structure.md`)
- 아키텍처 토픽 단위로 분리

### 분류

| 분류 | 대상 | 파일명 예시 |
|------|------|-----------|
| 인프라 | 서버 배포, CI/CD, 클라우드 구성, 모니터링 | `deployment.md`, `ci-cd.md` |
| 코드 아키텍처 | 레이어 구조, 디자인 패턴, 모듈 관계 | `layer-structure.md`, `module-dependencies.md` |
| 데이터 | DB 스키마, 캐시 전략, 마이그레이션 | `database-schema.md`, `cache-strategy.md` |

### 필수 섹션

```markdown
---
name: <토픽명>
description: <한 줄 설명>
keywords: [관련, 키워드]
---

# <토픽명>

<2-3문장 개요>

## 구성 요소

| 요소 | 역할 | 설정 파일/경로 |
|------|------|--------------|
| ... | ... | ... |

## 다이어그램 (선택)

<텍스트 기반 다이어그램>

## 관련 Context

- [<모듈명>](../codebase/<module>.md)
- [<도메인명>](../business/<domain>.md)
```

## PR 내용 활용 규칙

Context 생성 시 PR 정보를 다음과 같이 활용합니다:

| PR 정보 | 활용 방법 |
|---------|----------|
| PR 제목 | 변경의 핵심 의도 파악 |
| PR 본문 | 기대효과, 배경, 관련 이슈 파악 |
| Diff | 실제 코드 변경 내용 분석 |

- PR 의도를 반영하여 context 문서의 "개요"와 "핵심 흐름"을 작성한다
- PR 본문의 기대효과를 Business Context의 "사용자 관점"에 반영한다

</rules>

## INDEX.md 작성 규칙

### codebase/INDEX.md

```markdown
---
name: Codebase Index
description: 코드베이스 모듈 참조 목록
---

# Codebase Context Index

## 모듈 목록

| 모듈 | 설명 | 문서 |
|------|------|------|
| CLI | 커맨드라인 인터페이스 | [cli.md](./cli.md) |
```

### business/INDEX.md

```markdown
---
name: Business Index
description: 비즈니스 도메인 참조 목록
---

# Business Context Index

## 프로젝트 개요

<프로젝트가 해결하는 문제와 대상 사용자 1-2문장>

## 도메인 목록

| 도메인 | 설명 | 문서 |
|--------|------|------|
| 설정 관리 | 사용자 설정 배포 및 관리 | [configuration-management.md](./configuration-management.md) |
```

### architecture/INDEX.md

```markdown
---
name: Architecture Index
description: 인프라/코드 아키텍처 참조 목록
---

# Architecture Context Index

## 토픽 목록

| 토픽 | 분류 | 설명 | 문서 |
|------|------|------|------|
| 배포 구성 | 인프라 | 서버 배포 방식 | [deployment.md](./deployment.md) |
```

## 증분 업데이트 원칙

<checklist>

- PR에서 변경된 파일과 관련된 context 문서만 업데이트한다
- 기존 문서의 변경되지 않은 부분은 그대로 유지한다
- 새 모듈이 추가되면 INDEX.md에 행을 추가한다
- 모듈이 삭제되면 INDEX.md에서 해당 행을 제거하고 문서 파일을 삭제한다

</checklist>
