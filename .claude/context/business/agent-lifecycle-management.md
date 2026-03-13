---
name: Agent Lifecycle Management
description: Agent별 실행 환경과 자동화 동작을 선언적으로 관리하는 시스템
keywords: [agent, hooks, lifecycle, 관심사분리, frontmatter, 자동화]
---

# Agent Lifecycle Management

## 목적

각 Agent가 필요한 hooks, skills, memory를 자체 파일에서 선언적으로 관리하여, Agent별 실행 환경을 독립적으로 정의합니다. 전역 설정에 대한 의존 없이 Agent 파일 하나로 동작 방식 전체를 파악할 수 있습니다.

## 핵심 기능

| 기능 | 설명 | 사용자 관점 |
|------|------|------------|
| Agent별 hook 선언 | 각 Agent frontmatter에 필요한 hook만 명시 | 코드 수정 Agent에서만 자동 코드 리뷰가 실행됨 |
| Skills preload | Agent 시작 시 필요한 Skill 문서 자동 주입 | Agent가 별도 안내 없이도 관련 규칙 준수 |
| 전역 hook 최소화 | settings.json에는 보안/워크플로우 필수 hook만 유지 | 불필요한 Agent에 hook이 실행되지 않아 성능 향상 |
| permissionMode 선언 | 읽기 전용/편집 허용 등 권한을 Agent 단위로 지정 | 탐색 Agent가 실수로 파일 수정하는 상황 방지 |

## 사용자 흐름

1. 사용자가 코드 수정 요청 → code-writer Agent 실행
2. code-writer가 파일 편집(Edit/Write) → PostToolUse hook이 자동으로 코드 리뷰 agent 실행
3. 코드 리뷰 완료 → code-writer가 작업 완료(Stop) → followup 추천 agent가 다음 작업 제안
4. 탐색 전용 Agent(explore, context-collector)에는 hook 없이 읽기 작업만 수행

## 전역 vs Agent 스코프 hook

| Hook | 위치 | 적용 대상 |
|------|------|---------|
| UserPromptSubmit: skill-forced | settings.json | 전체 (Skill 강제 가이드) |
| UserPromptSubmit: workflow-enforced | settings.json | 전체 (워크플로우 강제) |
| PreToolUse: dangerous-command-blocker | settings.json | 전체 (위험 명령어 차단) |
| PostToolUse: 코드 리뷰 | code-writer, code-reviewer 등 frontmatter | 해당 Agent에서만 |
| Stop: followup 추천 | code-writer, git-manager 등 frontmatter | 해당 Agent에서만 |

## 관련 Codebase Context

- [Agent Configuration](../codebase/agent-configuration.md)
- [Skills Frontmatter Reference](../codebase/skills-frontmatter-reference.md)
