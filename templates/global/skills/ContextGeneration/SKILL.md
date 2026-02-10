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
├── codebase/
│   ├── INDEX.md          # 모듈 목록 + 경로
│   └── <module-name>.md  # 모듈별 구현 참조
└── business/
    ├── INDEX.md          # 프로젝트 개요 + 도메인 목록
    └── <domain-area>.md  # 비즈니스 레벨 요약
```

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

### 금지사항

- **원본 코드 포함 절대 금지** (코드 블록으로 소스 코드를 복사하지 않음)
- 파일 경로와 함수/클래스명만 참조
- 파일 참조 형식: `| src/copy.ts | 파일 복사 메인 로직 | mergeSettingsJson() |`

## Business Context 규칙

### 파일명
- **비즈니스 도메인 기준** (예: `configuration-management.md`, `user-authentication.md`)
- 기술 용어 금지 (예: `settings-json-merge.md` ❌ → `configuration-management.md` ✅)

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
- Codebase의 기술 용어를 비즈니스 관점으로 변환
  - `mergeSettingsJson()` → "기존 설정을 보존하면서 새 설정 적용"
  - `copyClaudeFiles()` → "템플릿 설정을 사용자 환경에 배포"

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

## 증분 업데이트 원칙

- PR에서 변경된 파일만 해당하는 context 문서를 업데이트
- 전체 재생성 금지 -- 기존 문서의 변경되지 않은 부분은 유지
- 새 모듈이 추가되면 INDEX.md에 행 추가
- 모듈이 삭제되면 INDEX.md에서 해당 행 제거 및 문서 파일 삭제
