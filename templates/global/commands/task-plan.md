---
description: 요청 내용대로 코드베이스에서 context를 수집하고, 기존 plan 파일을 확인/삭제/보강 후 plan.md, context.md, checklist.md 3종 문서를 작성한다.
argument-hint: "[요청 내용]"
---

# task-plan: 계획 문서 작성

## 사용자 요청

$ARGUMENTS

## Codex 가용성

!`command -v codex >/dev/null 2>&1 && test -f ~/.codex/auth.json && echo "codex_available" || echo "codex_unavailable"`

## 기존 Plan 파일 현황

!`ls .claude/plan/ 2>/dev/null && echo "---" && cat .claude/plan/plan.md 2>/dev/null || echo "(기존 plan 파일 없음)"`

## 실행 순서

### Step 1: 기존 Plan 처리

기존 `.claude/plan/` 파일이 있다면 아래 기준으로 처리한다:
- 현재 요청과 무관한 이전 작업의 plan → 삭제 후 새로 작성
- 현재 요청을 보강할 수 있는 plan → 내용 활용하여 보강
- plan 없음 → 새로 작성

### Step 2: 요구사항 명확화

아래 3가지를 확인하고 context.md에 기록한다:
- **목적**: 이 작업을 왜 하는가?
- **문제**: 어떤 문제를 해결하는가?
- **방법**: 어떻게 해결할 것인가?

불명확한 부분이 있으면 사용자에게 먼저 질문한다.

### Step 3: Context 수집 및 Plan 초안 생성

위 "Codex 가용성" 출력값에 따라 분기한다.

#### A. codex_available

`/codex:rescue` 슬래시 커맨드 또는 `codex-rescue` subagent(Task tool)에 아래 정보를 전달하여 plan 초안 생성을 위임한다.

**Codex 위임 프롬프트 구성**:
- 사용자 요청 원문 (`$ARGUMENTS`)
- 코드베이스 루트 경로 (현재 작업 디렉토리)
- 산출물 요구사항: `~/.claude/skills/Planning/SKILL.md` 템플릿에 맞는 plan/context/checklist 3종 문서 초안
- 각 문서가 포함해야 할 항목:
  - `plan.md`: 목적, DB/API/FE 설계, 설계 결정(선택/이유/차선책/차선책 미채택 이유), TaskList 요약
  - `context.md`: 사용자 요청 원문, 비즈니스/기술적 배경, 탐색한 코드, 결정 사항
  - `checklist.md`: Phase별 체크리스트, Task별 세부 작업

Codex 응답 수신 후 Claude가 수행할 작업:
1. 산출물을 `~/.claude/skills/Planning/SKILL.md` 템플릿 구조로 정규화
2. 누락된 섹션 보강 (frontmatter: name/description/created/status, status는 `draft`)
3. `.claude/plan/` 폴더에 3종 파일로 저장

#### B. codex_unavailable

기존 워크플로우로 진행한다.

1. `explore` agent(파일 위치/구조 파악)와 `context-collector` agent(코드 패턴/구현 방식 분석)를 **병렬 호출**하여 context 수집
2. `~/.claude/skills/Planning/SKILL.md` 템플릿에 따라 `.claude/plan/`에 3종 문서 작성:

| 파일 | 역할 |
|------|------|
| `plan.md` | 전체 설계 (목적, DB/API/FE 설계, 설계 결정, TaskList) |
| `context.md` | 맥락 (사용자 요청 원문, 배경, 탐색한 코드, 결정 사항) |
| `checklist.md` | 실행 체크리스트 (Phase별, Task별 세부 작업) |

설계 결정마다 **선택/이유/차선책/차선책 미채택 이유**를 명시한다.
해당 없는 섹션(DB/API/FE)은 생략한다.
plan.md status는 `draft`로 시작한다.

### Step 4: TaskList 생성 및 Agent 할당

- 작업을 독립 실행 가능한 단위로 분해하여 TaskList를 생성한다
- `task-enricher` agent를 호출하여 각 Task에 담당 subagent와 Skill을 할당한다 (Codex 분기 여부와 무관하게 Claude가 수행)

### Step 5: 사용자 확인 요청

작성된 plan 요약을 제시하고 승인을 요청한다. 사용자 승인 없이 구현을 시작하지 않는다.
