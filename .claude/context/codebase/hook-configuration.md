---
name: Hook Configuration
description: settings.json hook 명령어 설정, 실행 경로 해결 전략 및 global/project hook 우선순위 분기
keywords: [hooks, settings.json, worktree, CLAUDE_PROJECT_DIR, git-rev-parse, shell-script, dedup, global, project]
---

# Hook Configuration

settings.json에 등록된 hook 명령어와 worktree/하위 디렉토리에서도 안정적으로 실행되도록 하는 경로 해결 전략을 정의합니다. project-level hook과 global hook의 우선순위 분기 방식도 포함합니다.

## 파일 구조

| 파일 | 역할 |
|------|------|
| `.claude/settings.json` | 프로젝트 전용 hook 이벤트와 shell 명령어 매핑 |
| `templates/global/settings.json` | 전역 설치용 hook 설정 (project/global 우선순위 분기 포함) |
| `.claude/hooks/gpm-session-briefing.sh` | 세션 시작 시 GPM 태스크 브리핑 출력 |
| `.claude/hooks/gpm-commit-linker.sh` | Bash 도구 실행 후 커밋 연결 처리 |
| `.claude/hooks/gpm-response-suggest.sh` | 응답 완료 후 다음 액션 제안 |
| `templates/global/hooks/skill-forced.sh` | Skill/Agent 평가 리마인더 (UserPromptSubmit) |
| `templates/global/hooks/workflow-enforced.sh` | 워크플로우 순서 강제 (UserPromptSubmit) |
| `templates/global/hooks/dangerous-command-blocker.sh` | 위험 명령어 차단 (PreToolUse Bash) |
| `templates/global/hooks/session-wrap-suggester.sh` | PR 후 세션 wrap 제안 (PostToolUse Bash) |

## Hook 이벤트 매핑

### 프로젝트 hook (.claude/settings.json)

| 이벤트 | matcher | 스크립트 |
|--------|---------|---------|
| UserPromptSubmit | (없음) | `gpm-session-briefing.sh` |
| PostToolUse | Bash | `gpm-commit-linker.sh` |
| Stop | (없음) | `gpm-response-suggest.sh` |

### 전역 hook (templates/global/settings.json)

| 이벤트 | matcher | 스크립트 |
|--------|---------|---------|
| UserPromptSubmit | (없음) | `skill-forced.sh`, `workflow-enforced.sh` |
| PreToolUse | Bash | `dangerous-command-blocker.sh` |

## 실행 경로 해결 전략

### 프로젝트 hook: git rev-parse 패턴

worktree나 프로젝트 하위 디렉토리에서 cwd가 프로젝트 루트와 다를 수 있어 상대 경로가 깨집니다. `.claude/settings.json`의 hook 명령어는 cd prefix 패턴으로 해결합니다.

| 단계 | 설명 |
|------|------|
| `git rev-parse --show-toplevel` | 현재 git 저장소의 루트 경로 반환 |
| `2>/dev/null` | git 저장소가 아닌 경우 에러 메시지 억제 |
| 파이프 `pwd` | git 저장소 루트를 찾지 못하면 현재 디렉토리 사용 |
| `&& .claude/hooks/<script>.sh` | 루트로 이동한 뒤 상대 경로로 스크립트 실행 |

### 전역 hook: CLAUDE_PROJECT_DIR 우선순위 분기

`templates/global/settings.json`의 hook 명령어는 `$CLAUDE_PROJECT_DIR`을 사용하여 project-level hook 존재 여부에 따라 분기합니다.

| 항목 | 설명 |
|------|------|
| `$CLAUDE_PROJECT_DIR` | Claude Code가 hook 실행 시 자동 주입하는 환경변수. 프로젝트 루트 절대경로 |
| project hook 우선 | project-level 동일 hook이 존재하면 project 버전 실행 |
| global hook fallback | project hook이 없으면 `~/.claude/hooks/` 버전 실행 |

## 핵심 흐름

1. Claude Code가 hook 이벤트 감지 (UserPromptSubmit / PreToolUse(Bash) / PostToolUse(Bash) / Stop)
2. settings.json에서 해당 이벤트의 명령어 조회
3. 프로젝트 hook: `cd git rev-parse` 패턴으로 루트 이동 후 스크립트 실행
4. 전역 hook: `$CLAUDE_PROJECT_DIR` 기반으로 project/global 우선순위 분기 후 실행

## 관련 Business Context

- [Hook 실행 안정성](../business/hook-execution-reliability.md)
