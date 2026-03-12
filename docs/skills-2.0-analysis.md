# Claude Code Skills 2.0 분석 및 개선 사항

## Skills 2.0 개요

Skills 2.0은 기존 skills/commands 시스템을 통합하고 확장한 아키텍처입니다.

### 핵심 변화

| 영역 | 1.0 | 2.0 |
|------|-----|-----|
| 로딩 | 전체 로딩 | **3단계 Progressive Disclosure** (메타데이터 → 본문 → 리소스) |
| 호출 제어 | 없음 | `disable-model-invocation`, `user-invocable` |
| 실행 컨텍스트 | 메인만 | `context: fork` + `agent` 지정으로 subagent 실행 |
| 동적 주입 | 없음 | `` !`command` `` 로 셸 결과 전처리 주입 |
| 도구 제한 | 없음 | `allowed-tools`, `tools`, `disallowedTools` |
| 모델 선택 | Agent만 | Skill에서도 `model` 지정 가능 |
| 인자 | 없음 | `$ARGUMENTS`, `$0`, `$1` 등 치환 변수 |
| Agent 기능 | 기본 | `skills` preload, `mcpServers`, `permissionMode`, `maxTurns`, `memory`, `isolation`, `background` |
| 핫리로드 | 없음 | SKILL.md 변경 시 즉시 반영 |

### 3단계 Progressive Disclosure

| Level | 로딩 시점 | 토큰 비용 | 내용 |
|-------|----------|----------|------|
| Level 1: 메타데이터 | 항상 (시작 시) | ~100 tokens/skill | `name`, `description` (YAML frontmatter) |
| Level 2: 본문 | Skill 트리거 시 | 5k tokens 미만 | SKILL.md 본문 (instructions) |
| Level 3+: 리소스 | 필요 시 | 사실상 무제한 | 번들 파일 (Bash로 실행, 로딩 없이 사용) |

---

## Frontmatter 전체 레퍼런스

### Skill Frontmatter (SKILL.md)

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `name` | string | **필수** | 스킬 이름. `/slash-command`가 됨. 소문자+하이픈, 최대 64자 |
| `description` | string | **필수** | 용도 및 트리거 조건. 최대 1024자. Claude가 자동 호출 판단에 사용 |
| `argument-hint` | string | - | 자동완성 시 인자 힌트. 예: `[issue-number]`, `[filename] [format]` |
| `disable-model-invocation` | boolean | `false` | `true` → Claude 자동 호출 차단. description이 컨텍스트에 로딩되지 않아 토큰 절약 |
| `user-invocable` | boolean | `true` | `false` → `/` 메뉴에서 숨김. Claude만 자동 호출 가능 |
| `allowed-tools` | string/array | 전체 상속 | Skill 활성 시 허용 도구 제한. 예: `[Read, Grep, Glob]` |
| `model` | string | `inherit` | 사용 모델. `sonnet`, `opus`, `haiku`, 모델 ID, `inherit` |
| `context` | string | - | `fork` 설정 시 격리된 subagent에서 실행 |
| `agent` | string | `general-purpose` | `context: fork` 시 사용할 agent 타입 |
| `hooks` | object | - | Skill 라이프사이클에 스코프된 훅. `PreToolUse`, `PostToolUse`, `Stop` 지원 |
| `version` | string | - | 버전 식별자. 문서/관리 목적 |

#### 치환 변수

| 변수 | 설명 |
|------|------|
| `$ARGUMENTS` | Skill 호출 시 전달된 모든 인자 |
| `$ARGUMENTS[N]` / `$N` | N번째 인자 (0-based) |
| `${CLAUDE_SESSION_ID}` | 현재 세션 ID |
| `${CLAUDE_SKILL_DIR}` | SKILL.md가 위치한 디렉토리 경로 |

#### Dynamic Context Injection

```markdown
## PR Context
- Diff: !`gh pr diff $ARGUMENTS`
- Description: !`gh pr view $ARGUMENTS`
```

`` !`command` `` 구문: 셸 명령을 즉시 실행 → 결과로 치환 → Claude가 완성된 프롬프트를 수신

### Agent Frontmatter (.claude/agents/*.md)

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `name` | string | **필수** | Agent 이름. 소문자+하이픈 |
| `description` | string | **필수** | 위임 판단 기준. 언제 이 Agent를 사용하는지 명시 |
| `tools` | array | 전체 상속 | 사용 가능 도구 허용 목록. 예: `[Read, Grep, Glob, Bash]` |
| `disallowedTools` | array | - | 명시적 거부 도구 목록. 상속/지정된 목록에서 제거 |
| `model` | string | `inherit` | `sonnet`, `opus`, `haiku`, 모델 ID, `inherit` |
| `permissionMode` | string | `default` | 권한 모드. `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns` | number | - | 최대 턴 수. 초과 시 결과 반환 후 종료 |
| `skills` | array | - | 시작 시 사전 로드할 Skill 목록. Skill 전체 내용이 컨텍스트에 주입됨 |
| `mcpServers` | object/array | - | 사용 가능 MCP 서버. 이름 참조 또는 인라인 정의 |
| `hooks` | object | - | Agent 라이프사이클 훅 |
| `memory` | string | - | 영속 메모리 스코프. `user`, `project`, `local` |
| `background` | boolean | `false` | `true` → 백그라운드 작업으로 실행 |
| `isolation` | string | - | `worktree` → 임시 git worktree에서 격리 실행 |

#### permissionMode 상세

| 모드 | 동작 |
|------|------|
| `default` | 표준 권한 확인 (사용자 프롬프트) |
| `acceptEdits` | 파일 수정 자동 승인 |
| `dontAsk` | 권한 프롬프트 자동 거부 (명시적 허용 도구만 동작) |
| `bypassPermissions` | 모든 권한 검사 건너뜀 (주의 필요) |
| `plan` | 읽기 전용 탐색 모드 |

#### MCP 서버 설정

```yaml
# 기존 서버 참조
mcpServers:
  - slack
  - github

# 인라인 정의
mcpServers:
  playwright:
    type: stdio
    command: npx
    args: ["-y", "@playwright/mcp@latest"]
```

### 미존재 필드 (FAQ)

| 필드 | 상태 |
|------|------|
| `import` / `imports` | **존재하지 않음**. Skill 간 참조는 Agent `skills` preload, supporting files, dynamic injection으로 대체 |
| `include` / `require` | 존재하지 않음 |
| `dependencies` | 런타임 패키지 의존성(pip/npm)용. Skill 간 참조용이 아님 |
| `extends` | 존재하지 않음 |

---

## 현재 templates 현황 vs Skills 2.0 Gap

### 현재 사용 중인 frontmatter

- **Skills**: `name`, `description`, `keywords`, `estimated_tokens`, `user-invocable` (3개만)
- **Agents**: `name`, `description`, `keywords`, `model`, `color`

### 미적용 필드 목록

| 필드 | 대상 | 사용 여부 |
|------|------|----------|
| `allowed-tools` | Skill | X |
| `model` | Skill | X (Agent만 사용) |
| `disable-model-invocation` | Skill | X |
| `user-invocable` | Skill | 3/20개만 |
| `context: fork` | Skill | X |
| `agent` | Skill | X |
| `argument-hint` | Skill | X |
| `hooks` | Both | X |
| `tools` | Agent | X (전체 도구 상속) |
| `disallowedTools` | Agent | X |
| `permissionMode` | Agent | X |
| `maxTurns` | Agent | X |
| `skills` | Agent | X |
| `mcpServers` | Agent | X |
| `memory` | Agent | X |
| `background` | Agent | X |
| `isolation` | Agent | X |

---

## 개선 사항 리스트

### 1. Agent `tools`/`disallowedTools` 제한 (HIGH IMPACT)

| 항목 | 내용 |
|------|------|
| **적용 대상** | `explore`, `context-collector`, `plan-verifier`, `impact-analyzer`, `task-planner`, `task-enricher` |
| **적용 내용** | 읽기 전용 Agent에 `tools: [Read, Grep, Glob, Bash]`, `disallowedTools: [Edit, Write]` |
| **개선 효과** | 탐색/분석 전용 Agent가 실수로 코드를 수정하는 사고 방지 |
| **기여 환경** | 복잡한 multi-agent 워크플로우에서 task-planner가 분석 중 파일을 수정하거나, explore Agent가 의도치 않게 Edit을 시도하는 상황 방지 |

```yaml
# explore.md
tools: [Read, Grep, Glob, Bash]

# code-reviewer.md
disallowedTools: [Write, Edit]
```

### 2. Agent `skills` preload (HIGH IMPACT)

| 항목 | 내용 |
|------|------|
| **적용 대상** | `code-writer`, `code-reviewer`, `simple-code-writer`, `git-manager`, `designer` |
| **적용 내용** | `skills: [Coding]` 등 관련 Skill을 사전 로드 |
| **개선 효과** | 현재 `skill-forced-subagent.sh` hook으로 Skill 읽기를 안내하는 간접 방식 → frontmatter로 자동 주입하여 **Skill 미참조 실수 제거** + hook 의존성 감소 |
| **기여 환경** | code-writer가 Coding Skill을 읽지 않고 코드를 작성하는 문제 해결. 모든 코드 수정 Agent가 항상 코딩 규칙을 인지한 상태로 작업 |

```yaml
# code-writer.md
skills: [Coding, Backend]

# git-manager.md
skills: [Git]

# designer.md
skills: [React]
```

### 3. Skill `context: fork` + Dynamic Injection (HIGH IMPACT)

| 항목 | 내용 |
|------|------|
| **적용 대상** | `SessionWrap`, `pr-review`, `pr-apply` |
| **적용 내용** | `context: fork` + `` !`command` `` 전처리 |
| **개선 효과** | 메인 컨텍스트에서 실행 → fork로 격리 실행. PR diff 전체가 메인 컨텍스트에 로딩되는 대신 subagent에서 처리하고 요약만 반환. 1-2턴 절약 |
| **기여 환경** | `/session-wrap`, `/pr-review` 실행 시 메인 컨텍스트 오염 방지 |

```yaml
# pr-review.md
---
name: pr-review
context: fork
agent: general-purpose
argument-hint: "[PR-number]"
---
## PR Context
- Diff: !`gh pr diff $ARGUMENTS`
- Description: !`gh pr view $ARGUMENTS`

위 PR을 리뷰하세요...
```

### 4. Agent `permissionMode` 설정 (MEDIUM IMPACT)

| 항목 | 내용 |
|------|------|
| **적용 대상** | 읽기 전용 Agent → `plan`, 코드 수정 Agent → `acceptEdits` |
| **적용 내용** | `explore`: `plan`, `context-collector`: `plan`, `code-writer`: `acceptEdits`, `simple-code-writer`: `acceptEdits` |
| **개선 효과** | 읽기 전용 Agent는 수정 시도 자체를 차단. 코드 수정 Agent는 Edit/Write 권한 프롬프트 없이 작업 진행 |
| **기여 환경** | 대규모 리팩토링 시 code-writer가 매 파일 수정마다 권한을 물어보는 비효율 제거. 분석 Agent의 안전성 강화 |

```yaml
# explore.md, context-collector.md, plan-verifier.md
permissionMode: plan

# code-writer.md, simple-code-writer.md
permissionMode: acceptEdits
```

### 5. Agent `maxTurns` 설정 (MEDIUM IMPACT)

| 항목 | 내용 |
|------|------|
| **적용 대상** | `explore` (5턴), `simple-code-writer` (10턴), `context-collector` (15턴), `qa-tester` (20턴) |
| **적용 내용** | `maxTurns` 값 설정 |
| **개선 효과** | Agent가 무한 루프에 빠지거나 과도하게 탐색하는 상황 방지. 토큰 낭비 절감 |
| **기여 환경** | explore Agent가 파일을 찾지 못해 계속 시도하거나, simple-code-writer가 lint 오류를 반복 수정하는 상황에서 조기 종료 |

```yaml
# explore.md
maxTurns: 5

# simple-code-writer.md
maxTurns: 10
```

### 6. Skill `user-invocable` 명시적 설정 (MEDIUM IMPACT)

| 항목 | 내용 |
|------|------|
| **적용 대상** | 모든 Skill (현재 3개만 설정됨) |
| **적용 내용** | 배경 지식 Skill에 `user-invocable: false` 명시 |
| **개선 효과** | `/` 메뉴에 불필요한 Skill이 노출되지 않아 UX 개선. Claude가 자동 참조할 Skill과 사용자가 수동 호출할 Skill 구분 명확화 |
| **기여 환경** | 사용자가 `/` 입력 시 `Coding`, `Backend`, `Documentation` 같은 배경 지식 Skill이 리스트에 뜨는 혼란 제거 |

```yaml
# 배경 지식 (자동 참조 전용)
# Coding, Backend, React, Documentation, Director, Reporting, PromptStructuring
user-invocable: false

# 사용자 수동 호출 가능
# Git (pr-review, pr-apply), SessionWrap, ContextHandoff
user-invocable: true
```

### 7. Skill `disable-model-invocation` 활용 (MEDIUM IMPACT)

| 항목 | 내용 |
|------|------|
| **적용 대상** | `SessionWrap`, `ContextHandoff` |
| **적용 내용** | `disable-model-invocation: true` |
| **개선 효과** | Claude가 자동으로 세션 정리나 핸드오프를 트리거하는 것 방지. description이 컨텍스트에 로딩되지 않아 **토큰 절약** |
| **기여 환경** | Claude가 대화 중 자발적으로 SessionWrap을 실행하려는 의도치 않은 행동 방지 |

```yaml
# SessionWrap/SKILL.md
disable-model-invocation: true
user-invocable: true
```

### 8. Agent `memory` 활용 (MEDIUM IMPACT)

| 항목 | 내용 |
|------|------|
| **적용 대상** | `code-reviewer`, `code-writer` |
| **적용 내용** | `memory: project` |
| **개선 효과** | 코드 리뷰어가 이전 리뷰에서 발견한 패턴, 자주 발생하는 이슈를 세션 간 기억. 코드 작성자가 프로젝트별 코딩 스타일 학습 |
| **기여 환경** | 장기 프로젝트에서 같은 피드백을 반복하지 않아도 되는 점진적 개선 |

### 9. Skill `argument-hint` 추가 (LOW IMPACT)

| 항목 | 내용 |
|------|------|
| **적용 대상** | `pr-review`, `pr-apply`, `ContextHandoff` |
| **적용 내용** | `argument-hint: "[PR-number]"` 등 |
| **개선 효과** | 자동완성 시 어떤 인자가 필요한지 바로 파악 |
| **기여 환경** | 사용자가 `/pr-review` 입력 시 인자 힌트를 볼 수 있어 UX 개선 |

```yaml
# pr-review.md
argument-hint: "[PR-number]"

# pr-apply.md
argument-hint: "[PR-number]"

# ContextHandoff
argument-hint: "[handoff-name]"
```

### 10. Agent `isolation: worktree` 활용 (LOW IMPACT)

| 항목 | 내용 |
|------|------|
| **적용 대상** | `code-writer` (대규모 리팩토링 시) |
| **적용 내용** | `isolation: worktree` |
| **개선 효과** | 코드 수정이 메인 작업 트리에 영향을 주지 않고 독립적으로 진행. 실패 시 깔끔한 롤백 |
| **기여 환경** | 대규모 리팩토링이나 실험적 변경에서 안전한 격리 환경 제공 |

### 11. `estimated_tokens` 표기 통일 (LOW IMPACT)

| 항목 | 내용 |
|------|------|
| **적용 대상** | 모든 Skill |
| **적용 내용** | `~500` vs `300` 등 불일치 → 통일. Skills 2.0 공식 필드가 아니므로 커스텀 필드로 유지 여부 검토 |
| **개선 효과** | 일관성 확보 |

---

## 우선순위 요약

| 순위 | 개선 항목 | Impact | 난이도 |
|------|----------|--------|-------|
| 1 | Agent `tools`/`disallowedTools` 제한 | HIGH | 낮음 (frontmatter 1줄) |
| 2 | Agent `skills` preload | HIGH | 낮음 (hook 대체) |
| 3 | Skill `context: fork` + dynamic injection | HIGH | 중간 (본문 구조 변경) |
| 4 | Agent `permissionMode` 설정 | MEDIUM | 낮음 |
| 5 | Agent `maxTurns` 설정 | MEDIUM | 낮음 |
| 6 | Skill `user-invocable` 명시 | MEDIUM | 낮음 |
| 7 | Skill `disable-model-invocation` | MEDIUM | 낮음 |
| 8 | Agent `memory` 활용 | MEDIUM | 낮음 |
| 9 | Skill `argument-hint` | LOW | 낮음 |
| 10 | Agent `isolation: worktree` | LOW | 낮음 |
| 11 | `estimated_tokens` 표기 통일 | LOW | 낮음 |

---

## 적용 예시: Agent 전/후 비교

### Before (explore.md)

```yaml
---
name: explore
description: 파일 위치/코드 검색이 필요할 때 호출
keywords: [탐색, 검색, 파일찾기]
model: haiku
color: gray
---
```

### After (explore.md)

```yaml
---
name: explore
description: 파일 위치/코드 검색이 필요할 때 호출
keywords: [탐색, 검색, 파일찾기]
model: haiku
color: gray
tools: [Read, Grep, Glob, Bash]
permissionMode: plan
maxTurns: 5
---
```

### Before (code-writer.md)

```yaml
---
name: code-writer
description: 로직 작성, 기능 구현, 리팩토링 등 코드 수정이 필요할 때 호출
keywords: [코드작성, 구현, 개발]
model: opus
color: cyan
---
```

### After (code-writer.md)

```yaml
---
name: code-writer
description: 로직 작성, 기능 구현, 리팩토링 등 코드 수정이 필요할 때 호출
keywords: [코드작성, 구현, 개발]
model: opus
color: cyan
skills: [Coding, Backend]
permissionMode: acceptEdits
disallowedTools: [Agent]
---
```
