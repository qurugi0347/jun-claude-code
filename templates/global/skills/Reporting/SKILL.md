---
name: Reporting
description: Subagent 보고 형식 가이드. Discoveries/Changes/Reasoning 3축 구조화, Agent 유형별 출력 템플릿 제공.
keywords: [보고, 리포트, Discoveries, Changes, Reasoning, subagent, 출력형식]
estimated_tokens: ~600
---

# Subagent 보고 형식

<rules>

## 보고 3축

모든 Subagent 보고는 다음 3축으로 구조화한다.

| 축 | 의미 | 포함 내용 |
|----|------|----------|
| **Discoveries** | 발견한 것 | 탐색 결과, 패턴, 참고 코드, 기존 구현 방식 |
| **Changes** | 변경한 것 | 수정/생성/삭제한 파일과 내용 요약 |
| **Reasoning** | 판단 근거 | 결정 이유, 검토한 대안, 트레이드오프 |

</rules>

<instructions>

## Agent 유형별 가이드

Agent 유형에 따라 집중하는 축이 다르다.

| 유형 | 대표 Agent | 주력 축 |
|------|-----------|---------|
| 탐색형 | explore, context-collector, impact-analyzer | Discoveries 중심 |
| 수정형 | code-writer, simple-code-writer | Changes + Reasoning 중심 |
| 검증형 | code-reviewer, qa-tester | Discoveries + Reasoning 중심 |
| 관리형 | git-manager, context-manager | Changes 중심 |

## 작성 원칙

| 원칙 | 실행 방법 |
|------|----------|
| 간결하게 작성 | 핵심 사실만 기술, 서사 제외 |
| 상대 경로 사용 | 파일 경로는 프로젝트 루트 기준으로 표기 |
| 변경 내역 명시 | 코드 변경 시 before/after 또는 diff 요약 포함 |
| 대안 근거 포함 | 검토한 대안이 있으면 기각 이유를 Reasoning에 기술 |
| 빈 축 표기 | 해당 없는 축은 "해당 없음"으로 표시 |

</instructions>

<output_format>

## 출력 템플릿

### 탐색형 (Discoveries 중심)

```markdown
## Discoveries
- [발견 1]: 설명
- [발견 2]: 설명

## Changes
해당 없음

## Reasoning
- [판단]: 근거
```

### 수정형 (Changes + Reasoning 중심)

```markdown
## Discoveries
- 참고한 기존 패턴: `path/to/reference.ts`

## Changes
| 파일 | 변경 유형 | 요약 |
|------|----------|------|
| `path/to/file.ts` | 수정 | before/after 또는 diff 요약 |
| `path/to/new.ts` | 생성 | 파일 목적 설명 |

## Reasoning
- [결정 사항]: 근거, 검토한 대안, 기각 이유
```

### 검증형 (Discoveries + Reasoning 중심)

```markdown
## Discoveries
- [이슈 1]: severity (critical/warning/info) - 설명
- [이슈 2]: severity - 설명

## Changes
해당 없음

## Reasoning
- [이슈 1 판단]: 문제 원인, 권장 수정 방향
```

### 관리형 (Changes 중심)

```markdown
## Discoveries
해당 없음

## Changes
- [작업 1]: 결과 요약
- [작업 2]: 결과 요약

## Reasoning
해당 없음
```

</output_format>
