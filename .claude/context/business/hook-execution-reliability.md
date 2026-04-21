---
name: Hook Execution Reliability
description: worktree 및 하위 디렉토리 환경에서 hook이 안정적으로 실행되는 것의 비즈니스 가치
keywords: [hooks, worktree, 안정성, 실행환경, gpm, 자동화, CLAUDE_PROJECT_DIR, dedup, global, project]
---

# Hook Execution Reliability

## 목적

Claude Code hook은 세션 시작, 도구 실행, 응답 완료 시점에 자동으로 실행되어 GPM 워크플로우를 지원합니다. worktree나 프로젝트 하위 디렉토리에서 실행하더라도 hook 스크립트가 항상 정확히 실행되어야 합니다. 또한 global hook과 project-level hook이 동시에 설치된 환경에서 중복 실행 없이 project hook을 우선 적용하여 일관된 자동화 경험을 제공합니다.

## 핵심 기능

| 기능 | 설명 | 사용자 관점 |
|------|------|------------|
| 세션 브리핑 자동 실행 | 프롬프트 입력 시 GPM 태스크 현황 브리핑 | 어느 디렉토리에서 시작해도 현재 태스크 맥락 제공 |
| 커밋 자동 연결 | Bash 도구 실행 후 GPM 태스크와 커밋 연결 | worktree에서 작업해도 태스크 이력이 누락되지 않음 |
| 응답 후 액션 제안 | 응답 완료 시 다음 액션 자동 추천 | 작업 흐름이 끊기지 않고 연속적으로 이어짐 |
| 경로 독립적 실행 | git 루트 및 `$CLAUDE_PROJECT_DIR` 기반으로 hook 스크립트 경로 해결 | cwd에 무관하게 hook이 항상 동작 |
| project/global hook 우선순위 | project-level hook 존재 시 global hook 양보 | 프로젝트별 커스텀 hook이 전역 설정보다 우선 적용 |

## 사용자 흐름

1. 개발자가 worktree나 하위 디렉토리에서 Claude Code 실행
2. 프롬프트 입력 → `gpm-session-briefing.sh`가 git 루트를 찾아 실행 → 현재 GPM 태스크 브리핑 출력
3. Bash 도구 사용(커밋 등) → `gpm-commit-linker.sh`가 git 루트를 찾아 실행 → 커밋을 GPM 태스크에 연결
4. 응답 완료 → `gpm-response-suggest.sh`가 git 루트를 찾아 실행 → 다음 액션 제안
5. 전역 hook 실행 시 → `$CLAUDE_PROJECT_DIR` 확인 → project hook 존재 시 project 버전 우선 실행

## 관련 Codebase Context

- [Hook Configuration](../codebase/hook-configuration.md)
