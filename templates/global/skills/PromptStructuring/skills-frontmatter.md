---
name: PromptStructuring-skills-frontmatter
description: Skills 2.0 Skill/Agent frontmatter 필드 레퍼런스. 작성 시 필드 선택 기준과 예시 제공.
keywords: [frontmatter, SKILL.md, agent, yaml, skills-2.0, hooks, context-fork, tools, permissionMode]
user-invocable: false
---

# Skills/Agent Frontmatter 레퍼런스

SKILL.md와 Agent .md 파일의 YAML frontmatter 필드 가이드.

## Skill Frontmatter (SKILL.md)

<fields>

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `name` | string | 디렉토리명 | 스킬 이름. `/slash-command`가 됨. 소문자+하이픈, 최대 64자 |
| `description` | string | 첫 단락 | 용도 및 트리거 조건. Claude가 자동 호출 판단에 사용 |
| `keywords` | array | - | 검색/매칭용 키워드. 영문+한글 혼용 권장. 예: `[plan, 계획, DB설계]` |
| `argument-hint` | string | - | 자동완성 시 인자 힌트. 예: `[PR-number]` |
| `disable-model-invocation` | boolean | `false` | `true` -> Claude 자동 호출 차단. description이 컨텍스트에 로딩되지 않아 토큰 절약 |
| `user-invocable` | boolean | `true` | `false` -> `/` 메뉴에서 숨김. Claude만 자동 호출 가능 |
| `allowed-tools` | array | 전체 상속 | Skill 활성 시 허용 도구 제한. 예: `[Read, Grep, Glob]` |
| `model` | string | `inherit` | `sonnet`, `opus`, `haiku`, 모델 ID, `inherit` |
| `context` | string | - | `fork` -> 격리된 subagent에서 실행 |
| `agent` | string | `general-purpose` | `context: fork` 시 사용할 agent 타입 |
| `hooks` | object | - | Skill 라이프사이클에 스코프된 훅 |

</fields>

### 호출 제어 매트릭스

| 설정 | 사용자 호출 | Claude 호출 | 컨텍스트 로딩 |
|------|:-:|:-:|------|
| (기본값) | O | O | description 항상 로드, 호출 시 전체 로드 |
| `disable-model-invocation: true` | O | X | description 미로드 -> 토큰 절약 |
| `user-invocable: false` | X | O | description 항상 로드, 호출 시 전체 로드 |

### 치환 변수

| 변수 | 설명 |
|------|------|
| `$ARGUMENTS` | Skill 호출 시 전달된 모든 인자 |
| `$ARGUMENTS[N]` / `$N` | N번째 인자 (0-based) |
| `${CLAUDE_SESSION_ID}` | 현재 세션 ID |
| `${CLAUDE_SKILL_DIR}` | SKILL.md가 위치한 디렉토리 경로 |

### Dynamic Context Injection

셸 명령을 즉시 실행하여 결과를 프롬프트에 주입한다.

```yaml
---
name: pr-review
context: fork
agent: general-purpose
argument-hint: "[PR-number]"
---
## PR Context
- Diff: !`gh pr diff $ARGUMENTS`
- Description: !`gh pr view $ARGUMENTS`
```

`` !`command` `` -> 실행 결과로 치환 -> Claude가 완성된 프롬프트를 수신.

## Agent Frontmatter (.claude/agents/*.md)

<fields>

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `name` | string | **필수** | Agent 이름. 소문자+하이픈 |
| `description` | string | **필수** | 위임 판단 기준. 언제 이 Agent를 사용하는지 명시 |
| `whenToUse` | string | - | Agent 자동 선택 매칭 기준. 이 Agent를 선택해야 하는 구체적 상황과 유사 Agent와의 구분점을 명시. 10~5000자 |
| `keywords` | array | - | 검색/매칭용 키워드. 영문+한글 혼용 권장 |
| `disallowedTools` | array | - | 명시적 거부 도구 목록 |
| `model` | string | `inherit` | `sonnet`, `opus`, `haiku`, 모델 ID |
| `permissionMode` | string | `default` | 권한 모드 |
| `maxTurns` | number | - | 최대 턴 수. 초과 시 결과 반환 후 종료 |
| `skills` | array | - | 시작 시 사전 로드할 Skill 목록 |
| `mcpServers` | object/array | - | 사용 가능 MCP 서버 |
| `hooks` | object | - | Agent 라이프사이클 훅 |
| `memory` | string | - | 영속 메모리 스코프: `user`, `project`, `local` |
| `background` | boolean | `false` | `true` -> 백그라운드 작업으로 실행 |
| `isolation` | string | - | `worktree` -> 임시 git worktree에서 격리 실행 |
| `coordinatorMode` | boolean | `false` | `true` → Coordinator Mode에서 worker로 실행 가능 (experimental) |

</fields>

### permissionMode 옵션

| 모드 | 동작 | 적용 대상 예시 |
|------|------|------------|
| `default` | 표준 권한 확인 | 기본값 |
| `plan` | 읽기 전용 탐색 | explore, context-collector |
| `acceptEdits` | 파일 수정 자동 승인 | code-writer, simple-code-writer |
| `dontAsk` | 권한 프롬프트 자동 거부 | - |
| `bypassPermissions` | 모든 권한 검사 건너뜀 | 주의 필요 |

### Coordinator Mode (Experimental)

`CLAUDE_CODE_COORDINATOR_MODE=true` 환경변수로 활성화.
Coordinator는 Agent, SendMessage, TaskStop, SyntheticOutput만 사용 가능.
상세: `advanced-modes.md` 참조

### skills preload

Agent 시작 시 Skill 전체 내용을 컨텍스트에 주입한다.

```yaml
# code-writer.md
skills: [Coding, Backend]

# git-manager.md
skills: [Git]
```

-> hook으로 "Skill을 먼저 읽으세요"라고 안내하는 간접 방식 대신, frontmatter로 자동 주입.

## Skill ↔ Agent 연결 패턴

> Skill(무엇을 할지) + Agent(어떻게/누가 할지) + Context 격리(어디서 할지)를 조합한다.

### 패턴 1: 참조 Skill (인라인 주입)

Agent가 Skill을 배경 지식으로 preload. 메인 컨텍스트에서 실행.

```yaml
# Agent frontmatter
skills: [Coding, Backend]    # Agent 시작 시 Skill 전체 내용 주입

# Skill frontmatter
user-invocable: false         # 직접 호출 불가, Agent에 의해서만 사용
```

적용 예: Coding, Backend, React, Reporting

### 패턴 2: 작업 Skill (격리 실행)

Skill 호출 시 fork된 Agent에서 독립 실행. 메인 컨텍스트와 격리.

```yaml
# Skill frontmatter
context: fork                 # 격리된 subagent에서 실행
agent: task-planner           # 사용할 agent 타입 지정
user-invocable: true          # /slash-command로 호출 가능
```

적용 예: Planning, pr-review, deploy

### 패턴 3: 양방향 연결

Skill과 Agent가 서로를 참조. 사용자 직접 호출과 Agent preload 모두 지원.

```yaml
# Planning Skill
context: fork
agent: task-planner           # /planning → fork된 task-planner에서 실행
user-invocable: true

# task-planner Agent
skills: [Planning, Reporting] # Agent 시작 시 Planning Skill preload
```

```
사용자 /planning → fork(task-planner) → Planning 템플릿에 따라 plan 문서 생성
Main Agent → task-planner 호출 → Planning Skill 자동 preload → 동일 품질 보장
```

### 패턴 선택 기준

| 기준 | 참조 Skill | 작업 Skill | 양방향 |
|------|:-:|:-:|:-:|
| 규칙/가이드 제공 | O | - | O |
| 독립 실행 필요 | - | O | O |
| 사용자 직접 호출 | - | O | O |
| Agent preload | O | - | O |
| 컨텍스트 격리 | - | O | O |

---

## Hooks in Skills/Agents

Skill과 Agent의 frontmatter에 `hooks` 필드를 정의하면 해당 컴포넌트가 활성화된 동안에만 실행된다.

<rules>

- 모든 hook 이벤트 지원: PreToolUse, PostToolUse, Stop, UserPromptSubmit 등
- Agent의 `Stop` hook은 자동으로 `SubagentStop`으로 변환
- `once: true` 옵션: Skill 전용, 세션당 1회만 실행
- 형식은 settings.json hooks와 동일하되 YAML로 작성

</rules>

### 예시: Agent에 hooks 추가

```yaml
---
name: git-manager
skills: [Git]
hooks:
  PostToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "~/.claude/hooks/session-wrap-suggester.sh"
---
```

### 예시: Skill에 hooks 추가

```yaml
---
name: secure-deploy
description: 보안 검증 후 배포
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
---
```

## 미존재 필드 (FAQ)

| 필드 | 상태 |
|------|------|
| `import` / `imports` | 존재하지 않음. `skills` preload, 지원 파일, dynamic injection으로 대체 |
| `include` / `require` | 존재하지 않음 |
| `dependencies` | 런타임 패키지 의존성용. Skill 간 참조용 아님 |
| `extends` | 존재하지 않음 |
| `estimated_tokens` | 공식 필드 아님. 사용하지 않음 |
| `tools` (Agent) | `disallowedTools`만 사용하여 최대한 도구 활용 |

## Skill 콘텐츠 유형 가이드

| 유형 | 설명 | 실행 방식 | 예시 |
|------|------|----------|------|
| 참조 콘텐츠 | 규칙, 패턴, 스타일 가이드 | 인라인 (메인 컨텍스트) | Coding, Backend, React |
| 작업 콘텐츠 | 배포, 커밋, 코드 생성 | `context: fork` 또는 직접 호출 | deploy, pr-review |

참조 콘텐츠는 `user-invocable: false`로 배경 지식으로 활용한다.
작업 콘텐츠는 `disable-model-invocation: true`로 수동 트리거만 허용한다.
