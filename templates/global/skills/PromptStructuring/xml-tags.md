---
name: "XML Tags Guide"
description: "Claude Code 프롬프트용 XML 태그 표준 및 사용 가이드"
keywords: [xml, tags, structuring, prompt-format, XML태그, 프롬프트형식]
estimated_tokens: 2500
---

# XML 태그 가이드

## 표준 태그 목록

| 태그 | 용도 | 대상 파일 |
|------|------|----------|
| `<role>` | Agent 정체성/책임 정의 | Agent |
| `<instructions>` | 절차/단계 가이드 | Agent, Skill |
| `<rules>` | 필수 준수 규칙 | 전체 |
| `<constraints>` | 경계/제약 (긍정 표현) | Agent, CLAUDE.md |
| `<output_format>` | 출력 구조 정의 | Agent |
| `<examples>` / `<example type="good/bad">` | 예시 | Skill |
| `<checklist>` | 검증 항목 | 전체 |
| `<workflow>` | 다단계 프로세스 | CLAUDE.md, Hook |
| `<phase name="...">` | 워크플로우 단계 | Hook |
| `<delegation_rules>` | Subagent 위임 규칙 | CLAUDE.md, Hook |
| `<reference>` | 문서 상호참조 | 전체 |

---

## 파일 유형별 권장 태그 조합

### Agent 파일

```
필수: <role>, <instructions>, <constraints>, <output_format>
선택: <rules>, <examples>, <reference>
```

Agent는 **정체성 -> 절차 -> 제약 -> 출력** 순서로 구성한다.

### Skill 파일

```
필수: <instructions>, <rules>, <checklist>
선택: <examples>, <constraints>, <reference>
```

Skill은 **절차 -> 규칙 -> 예시 -> 검증** 순서로 구성한다.

### CLAUDE.md

```
필수: <workflow>, <delegation_rules>, <constraints>
선택: <rules>, <reference>
```

CLAUDE.md는 **워크플로우 -> 위임 규칙 -> 제약** 순서로 구성한다.

### Hook 파일

```
필수: <phase name="...">, <checklist>
선택: <delegation_rules>, <rules>, <reference>
```

Hook은 **Phase별 단계 -> 검증 체크리스트** 순서로 구성한다.

---

## Before/After 예시

### 예시 1: Agent - 역할 설명

**Before** (마크다운만 사용):

```markdown
# Code Writer Agent

## 역할

코드를 작성하는 전문 Agent입니다.

## 해야 할 일

1. task-planner의 계획에 따라 코드 작성
2. 프로젝트 규칙 준수
3. 작은 단위로 구현

## 출력

작성한 파일 목록과 변경 내용을 정리하여 출력합니다.
```

**After** (XML 태그로 의미 구분):

```markdown
# Code Writer Agent

<role>
task-planner의 계획에 따라 실제 코드를 작성하는 전문 Agent
</role>

<instructions>
1. task-planner의 계획에 따라 코드 작성
2. 프로젝트 규칙 준수
3. 작은 단위로 구현하여 빌드 가능 상태 유지
</instructions>

<output_format>
## 작성한 파일

### 1. [파일 경로]
- 변경 유형: 신규 생성 / 수정
- 주요 내용: ...
</output_format>
```

**개선 포인트**: `<role>`로 정체성, `<instructions>`로 절차, `<output_format>`으로 출력 구조를 명확히 분리

---

### 예시 2: Skill - 규칙 목록

**Before** (마크다운만 사용):

```markdown
# 코딩 규칙

## 규칙

- 하나의 모듈은 하나의 책임만 가진다
- 순환 의존을 만들지 않는다
- Promise 처리 시 then-catch 패턴을 사용한다

## 확인

- 이 파일의 책임은 하나인가?
- 순환 의존이 없는가?
```

**After** (XML 태그로 의미 구분):

```markdown
# 코딩 규칙

<rules>
- 하나의 모듈은 하나의 책임만 가진다 (SRP)
- 모듈 간 의존 방향은 단방향으로 유지한다
- Promise 처리 시 then-catch 패턴을 사용한다
</rules>

<checklist>
- [ ] 이 파일의 책임은 하나인가?
- [ ] 의존 방향이 단방향인가?
- [ ] then-catch 패턴을 사용했는가?
</checklist>
```

**개선 포인트**: `<rules>`와 `<checklist>`를 분리하여 "따라야 할 것"과 "검증할 것"을 명확히 구분

---

### 예시 3: Hook - Phase 구분

**Before** (마크다운만 사용):

```markdown
# Pre-commit Hook

## 단계 1: 계획 확인

계획이 있는지 확인합니다. 계획이 없으면 중단합니다.

## 단계 2: 코드 검증

lint와 type check를 실행합니다.

## 단계 3: 커밋

변경사항을 커밋합니다.
```

**After** (XML 태그로 Phase 구분):

```markdown
# Pre-commit Hook

<workflow>

<phase name="계획 확인">
계획이 존재하는지 확인한다. 계획이 있을 때만 다음 Phase로 진행한다.
</phase>

<phase name="코드 검증">
lint와 type check를 실행한다. 모든 검증을 통과할 때만 다음 Phase로 진행한다.
</phase>

<phase name="커밋">
변경사항을 커밋한다.
</phase>

</workflow>
```

**개선 포인트**: `<workflow>` > `<phase>` 구조로 단계 간 경계와 진행 조건을 명확히 표현

---

## `->` 기호 사용 가이드

`->` 기호는 **방향성이 있는 흐름**을 간결하게 표현할 때 사용한다.

### 단계 표현

순서가 있는 프로세스를 나타낸다.

```
계획 -> 구현 -> 검증 -> 리뷰
Context 수집 -> TaskList 생성 -> 코드 수정 계획
```

### 변환 표현

입력이 출력으로 바뀌는 과정을 나타낸다.

```
부정 표현 -> 긍정 표현
마크다운 제목 -> XML 태그
"~금지" -> "~전담/전용"
```

### 위임 표현

작업이 특정 Agent로 전달됨을 나타낸다.

```
코드 수정 -> code-writer Agent
Git 작업 -> git-manager Agent
코드베이스 탐색 -> explore Agent
```

### 테이블에서 사용

변환 관계를 테이블로 정리할 때도 `->` 를 활용한다.

```markdown
| Before | -> | After |
|--------|-----|-------|
| "~금지" | -> | "~전담" |
| `## 역할` | -> | `<role>` |
```

---

## 주의사항

### XML 태그는 마크다운을 보완한다

XML 태그는 마크다운을 대체하는 것이 아니라 **의미 계층을 추가**하는 것이다.

```markdown
<rules>
## 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수 | camelCase | `userName` |
| 상수 | UPPER_SNAKE | `MAX_COUNT` |

## 구조 규칙

- 한 파일에 한 컴포넌트만 정의한다
- index.ts를 통해 export한다
</rules>
```

태그 내부에서 `##`, 테이블, 코드블록을 정상적으로 사용한다.

### 태그 중첩은 2단계까지

```markdown
<!-- 허용: 2단계 -->
<workflow>
  <phase name="계획">...</phase>
</workflow>

<!-- 지양: 3단계 이상 -->
<workflow>
  <phase name="계획">
    <sub-step>...</sub-step>    <!-- 과도한 중첩 -->
  </phase>
</workflow>
```

3단계 이상 중첩이 필요하면 마크다운 제목(`###`)이나 리스트로 대체한다.

### 닫는 태그를 반드시 포함한다

```markdown
<!-- 올바름 -->
<role>
Agent의 역할 설명
</role>

<!-- 오류 -->
<role>
Agent의 역할 설명
```

모든 XML 태그는 여는 태그와 닫는 태그를 쌍으로 작성한다.

### 태그 이름은 표준 목록에서 선택한다

이 가이드의 **표준 태그 목록**에 정의된 태그만 사용한다. 커스텀 태그가 필요한 경우 기존 태그로 대체할 수 있는지 먼저 검토한다.

---

## 체크리스트

<checklist>
- [ ] 파일 유형(Agent/Skill/CLAUDE.md/Hook)에 맞는 태그 조합을 사용했는가?
- [ ] 태그 내부에서 마크다운 문법(제목, 테이블, 코드블록)을 정상 활용하는가?
- [ ] 태그 중첩이 2단계 이하인가?
- [ ] 모든 태그에 닫는 태그가 포함되어 있는가?
- [ ] 표준 태그 목록에 정의된 태그만 사용했는가?
- [ ] `->` 기호를 단계/변환/위임 표현에 활용했는가?
</checklist>

<reference>
- `SKILL.md` - 프롬프트 구조화 개요 및 핵심 원칙
- `positive-phrasing.md` - 부정 -> 긍정 전환 패턴
</reference>
