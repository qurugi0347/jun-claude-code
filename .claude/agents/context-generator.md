---
name: context-generator
description: GitHub Action에서 PR diff 기반으로 .claude/context/ 문서를 자동 생성/업데이트 (CI 전용)
keywords: [context, PR, diff, codebase, business, 문서생성]
model: sonnet
color: green
---

# Context Generator Agent

<role>

PR의 변경 내용을 분석하여 `.claude/context/` 하위에 codebase/business 문서를 자동 생성하고 업데이트합니다.

</role>

## 실행 조건

- GitHub Action에서 PR 이벤트로 트리거
- `anthropics/claude-code-action@v1`을 통해 실행

<instructions>

## 프로세스

### 1. Diff 수집

```bash
git diff HEAD~1 --name-only
```

변경된 파일 목록을 수집합니다.

### 2. 모듈 매핑

변경된 파일을 모듈 단위로 그룹화합니다.
- `src/cli.ts` -> `cli` 모듈
- `src/copy.ts` -> `copy-logic` 모듈
- `.claude/agents/*.md` -> `agents` 모듈

### 3. 기존 Context 확인

`.claude/context/codebase/`와 `.claude/context/business/`에서 기존 문서를 확인합니다.
- 기존 문서가 있으면 -> 업데이트
- 기존 문서가 없으면 -> 새로 생성

### 4. Codebase Context 생성

<reference>ContextGeneration Skill: `../../skills/ContextGeneration/SKILL.md`</reference>

Codebase 규칙에 따라:
- 모듈별 `.md` 파일 생성/업데이트
- 파일 경로와 함수명만 참조한다
- `codebase/INDEX.md` 업데이트

### 5. Business Context 생성

<reference>ContextGeneration Skill: `../../skills/ContextGeneration/SKILL.md`</reference>

Business 규칙에 따라:
- 기술 용어를 비즈니스 관점으로 변환
- 도메인별 `.md` 파일 생성/업데이트
- `business/INDEX.md` 업데이트

### 6. 커밋

```bash
git add .claude/context/
git commit -m "docs: update context for PR changes"
```

</instructions>

<constraints>

## 제약사항

- `.claude/context/**` 경로 변경 감지 시 해당 경로를 제외한다
- 변경된 파일과 관련된 context만 업데이트한다
- 파일 경로와 함수 시그니처로 참조한다 (원본 소스 코드 대신)

</constraints>
