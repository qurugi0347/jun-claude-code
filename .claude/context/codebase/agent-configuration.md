---
name: Agent Configuration
description: Skills 2.0 frontmatter 기반 Agent 선언적 설정 시스템
keywords: [agent, frontmatter, hooks, skills, memory, permissionMode, settings.json]
---

# Agent Configuration

Skills 2.0 frontmatter를 통해 각 Agent 파일에서 hooks, skills, memory 등을 선언적으로 관리하는 설정 시스템입니다. 기존 settings.json 전역 hook 방식에서 Agent별 개별 선언 방식으로 이관되었습니다.

## 파일 구조

| 파일 | 역할 | 핵심 필드 |
|------|------|---------|
| templates/global/agents/code-writer.md | 코드 구현 전문 Agent | PostToolUse(코드리뷰), Stop(followup) |
| templates/global/agents/code-reviewer.md | 코드 리뷰 전문 Agent | PostToolUse(Edit\|Write) |
| templates/global/agents/simple-code-writer.md | 단순 수정 전문 Agent (haiku) | PostToolUse, Stop |
| templates/global/agents/designer.md | UI/UX 설계 Agent | PostToolUse(Edit\|Write) |
| templates/global/agents/git-manager.md | Git 작업 전문 Agent | Stop hook |
| templates/global/agents/qa-tester.md | 테스트/빌드 검증 Agent | Stop hook |
| templates/global/agents/explore.md | 파일/코드 탐색 Agent | permissionMode: plan |
| templates/global/agents/context-collector.md | 코드 패턴 분석 Agent | permissionMode: plan |
| templates/global/agents/task-planner.md | 복잡한 계획 수립 Agent | skills preload |
| templates/global/agents/task-enricher.md | Task에 Agent/Skill 할당 Agent | skills preload |
| templates/global/agents/impact-analyzer.md | 영향 분석 Agent | skills preload |
| templates/global/agents/plan-verifier.md | Plan 검증 Agent | skills preload |
| templates/global/agents/context-manager.md | Context 문서 관리 Agent | skills preload |
| templates/global/settings.json | 전역 필수 hook만 유지 | UserPromptSubmit, PreToolUse |

## 핵심 흐름

1. Agent 파일 frontmatter에서 hooks/skills/memory 선언 → Skills 2.0 런타임이 해당 Agent 실행 시 적용
2. PostToolUse(Edit|Write) → 코드 리뷰 agent 자동 실행 (code-writer, code-reviewer, simple-code-writer, designer)
3. Stop → followup 추천 agent 자동 실행 (code-writer, simple-code-writer, git-manager, qa-tester)
4. settings.json에는 전역 필수 hook(UserPromptSubmit: skill-forced, workflow-enforced / PreToolUse: dangerous-command-blocker)만 유지

## Agent별 Hook 매핑

| Agent | PostToolUse | Stop |
|-------|-------------|------|
| code-writer | Edit\|Write → 코드 리뷰 | followup 추천 |
| code-reviewer | Edit\|Write → 코드 리뷰 | - |
| simple-code-writer | Edit\|Write → 코드 리뷰 | followup 추천 |
| designer | Edit\|Write → 코드 리뷰 | - |
| git-manager | - | followup 추천 |
| qa-tester | - | followup 추천 |
| 나머지 Agent | - | - |

## 관련 Business Context

- [Agent 라이프사이클 관리](../business/agent-lifecycle-management.md)
