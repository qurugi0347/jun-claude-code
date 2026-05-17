---
name: commands-templates
description: 태스크 워크플로우를 slash command로 실행할 수 있게 하는 커스텀 command 템플릿
keywords: [slash-command, task-plan, task-code-write, task-code-review, workflow, 계획, 구현, 리뷰]
---

# Commands Templates

## 목적

Claude Code에서 태스크 워크플로우(계획 수립 → 코드 구현 → 코드 리뷰)를 `/task-plan`, `/task-code-write` 등의 slash command로 즉시 실행할 수 있도록 합니다.
반복적인 프롬프트 작성 없이 CLI 설치 후 명령어 한 번으로 표준화된 워크플로우를 시작할 수 있습니다.
각 command는 외부 도구 의존 없이 전담 agent에게 직접 작업을 위임하여 단순하고 예측 가능한 동작을 보장합니다.

## 핵심 기능

| 기능 | 설명 | 사용자 관점 |
|------|------|------------|
| /task-plan | 요청 내용 기반 계획 문서 3종 자동 작성 | 작업 시작 전 plan/context/checklist 구조화 |
| /task-code-write | plan 기반 코드 구현 수행 | 계획 없이 바로 구현 시작 방지, 일관된 구현 품질 |
| /task-code-review | 구현 코드에 대한 리뷰 수행 | 코드 품질 기준 일관 적용 (code-reviewer agent 위임) |
| /task-review-plan | 리뷰 결과 기반 계획 재검토 | 리뷰 피드백을 계획에 반영하는 순환 개선 (plan-verifier agent 위임) |

## 사용자 흐름

1. `jun-claude-code install` 실행 → Commands MultiSelect 화면에서 원하는 command 선택
2. 선택된 command 파일 → `~/.claude/commands/` 로 설치
3. 새 작업 시작 시 `/task-plan 요청 내용` 입력
4. plan 작성 완료 후 `/task-code-write` 로 구현
5. 구현 완료 후 `/task-code-review` 로 리뷰
6. 필요 시 `/task-review-plan` 으로 계획 보강 후 재구현

## 관련 Codebase Context

- [commands-templates.md](../codebase/commands-templates.md)
- [copy-logic.md](../codebase/copy-logic.md)
