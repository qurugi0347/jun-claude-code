---
name: PromptStructuring-xml-tags
description: "XML 태그 표준 목록, 파일 유형별 권장 조합"
keywords: [xml, tags, role, instructions, rules, constraints]
estimated_tokens: 400
---

# XML 태그 표준

## 태그 목록

| 태그 | 용도 | 사용 위치 |
|------|------|----------|
| `<role>` | Agent/도구의 역할 정의 | Agent 파일 |
| `<instructions>` | 단계별 지시사항 | Agent, Skill 파일 |
| `<rules>` | 준수 규칙 | Skill, Hook |
| `<constraints>` | 제약사항 | Agent, Skill 파일 |
| `<delegation_rules>` | Subagent 위임 규칙 | Hook, CLAUDE.md |
| `<phase>` | 워크플로우 단계 | Hook, Skill |
| `<checklist>` | 체크리스트 항목 | Hook, Skill |
| `<output_format>` | 출력 형식 정의 | Agent 파일 |

## 적용 원칙

- 마크다운 제목(`##`)은 시각적 구분에 사용, XML 태그는 의미적 구분에 사용
- 중첩 가능: `<phase>` 안에 `<checklist>` 배치
- `name` 속성으로 식별: `<phase name="계획">`

## Before/After

```
Before: ## 역할 정의 (마크다운만)
After:  <role> ... </role> (의미 구분 명확)

Before: ## 지시사항 / ## 규칙 (구분 모호)
After:  <instructions> ... </instructions> + <rules> ... </rules>
```
