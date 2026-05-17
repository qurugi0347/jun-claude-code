---
name: commands-templates
description: templates/global/commands/ 에 포함된 커스텀 slash command 정의 파일 모듈
keywords: [commands, slash-command, task-plan, task-code-write, task-code-review, task-review-plan, templates]
---

# commands-templates

`templates/global/commands/` 디렉토리에 커스텀 slash command 정의 파일들을 포함합니다.
CLI를 통해 `~/.claude/commands/`로 설치되며, Claude Code에서 `/task-plan`, `/task-code-write` 등의 slash command로 사용됩니다.

## 파일 구조

| 파일 | 역할 | 핵심 함수/클래스 |
|------|------|-----------------|
| templates/global/commands/task-plan.md | 계획 문서 3종 작성 command | - |
| templates/global/commands/task-code-write.md | 코드 구현 command | - |
| templates/global/commands/task-code-review.md | 코드 리뷰 command | - |
| templates/global/commands/task-review-plan.md | 리뷰 기반 계획 재검토 command | - |

## Command 목록

| Command | 설명 | 호출 Agent |
|---------|------|-----------|
| task-plan | 요청 내용에 따라 plan.md / context.md / checklist.md 3종 계획 문서 작성 | `explore` + `context-collector` (병렬), `task-enricher` |
| task-code-write | 작성된 plan 기반으로 코드 구현 수행 | - |
| task-code-review | 구현된 코드에 대한 리뷰 수행 | `code-reviewer` |
| task-review-plan | 리뷰 결과를 바탕으로 계획 재검토 및 보강 | `plan-verifier` |

## 핵심 흐름

1. CLI 설치 시 `commands/` 카테고리로 분류 → `selectItems()` MultiSelect UI로 선택
2. 선택된 command 파일 → `~/.claude/commands/` 에 복사
3. Claude Code 내에서 `/task-plan [요청 내용]` 형태로 호출
4. command 파일의 `$ARGUMENTS` 플레이스홀더에 인자 주입 후 실행
5. command는 외부 도구 의존 없이 정해진 agent를 직접 호출하여 작업 위임

## 관련 Business Context

- [commands-templates.md](../business/commands-templates.md)
- [installation-ux.md](../business/installation-ux.md)
