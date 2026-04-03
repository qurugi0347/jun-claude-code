---
name: Hook Configuration
description: settings.json 전역 hook 명령어 설정 및 실행 경로 해결 전략
keywords: [hooks, settings.json, worktree, relative-path, git-rev-parse, shell-script]
---

# Hook Configuration

settings.json에 등록된 전역 hook 명령어와 worktree/하위 디렉토리에서도 안정적으로 실행되도록 하는 경로 해결 전략을 정의합니다.

## 파일 구조

| 파일 | 역할 |
|------|------|
| `.claude/settings.json` | hook 이벤트와 shell 명령어 매핑 정의 |
| `.claude/hooks/gpm-session-briefing.sh` | 세션 시작 시 브리핑 출력 |
| `.claude/hooks/gpm-commit-linker.sh` | Bash 도구 실행 후 커밋 연결 처리 |
| `.claude/hooks/gpm-response-suggest.sh` | 응답 완료 후 다음 액션 제안 |

## Hook 이벤트 매핑

| 이벤트 | matcher | 스크립트 |
|--------|---------|---------|
| UserPromptSubmit | (없음) | `gpm-session-briefing.sh` |
| PostToolUse | Bash | `gpm-commit-linker.sh` |
| Stop | (없음) | `gpm-response-suggest.sh` |

## 실행 경로 해결 전략

worktree나 프로젝트 하위 디렉토리에서 Claude Code를 실행하면 cwd가 프로젝트 루트와 다를 수 있어 상대 경로(`.claude/hooks/...`)가 깨집니다.

각 hook 명령어에 다음 패턴의 cd prefix를 적용하여 해결합니다.

```
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" && .claude/hooks/<script>.sh
```

| 단계 | 설명 |
|------|------|
| `git rev-parse --show-toplevel` | 현재 git 저장소의 루트 경로 반환 |
| `2>/dev/null` | git 저장소가 아닌 경우 에러 메시지 억제 |
| `\|\| pwd` | git 저장소 루트를 찾지 못하면 현재 디렉토리 사용 |
| `&& .claude/hooks/<script>.sh` | 루트로 이동한 뒤 상대 경로로 스크립트 실행 |

## 핵심 흐름

1. Claude Code가 hook 이벤트 감지 (UserPromptSubmit / PostToolUse(Bash) / Stop)
2. settings.json에서 해당 이벤트의 명령어 조회
3. `cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"` 로 프로젝트 루트로 이동
4. `.claude/hooks/<script>.sh` 를 상대 경로로 안전하게 실행

## 관련 Business Context

- [Hook 실행 안정성](../business/hook-execution-reliability.md)
