---
name: Skills Frontmatter Reference
description: Skills 2.0 Skill/Agent frontmatter 필드 명세 및 작성 가이드 문서
keywords: [frontmatter, SKILL.md, agent, yaml, skills-2.0, reference, hooks, permissionMode]
---

# Skills Frontmatter Reference

Skills 2.0 Skill/Agent frontmatter 필드 명세와 작성 가이드를 제공하는 참조 문서입니다.

## 파일 구조

| 파일 | 역할 | 주요 내용 |
|------|------|---------|
| templates/global/skills/PromptStructuring/skills-frontmatter.md | Skills 2.0 frontmatter 레퍼런스 | Skill/Agent 필드 명세, 호출 제어 매트릭스, 치환 변수, hooks 예시 |
| templates/global/skills/PromptStructuring/SKILL.md | 프롬프트 구조화 규칙 | XML 태그 구조화, 긍정 표현, 출력 최적화 규칙 |

## 핵심 흐름

1. Skill 파일 작성 시 skills-frontmatter.md 참조 → 올바른 frontmatter 필드 선택
2. `user-invocable`, `disable-model-invocation` 조합으로 호출 제어 방식 결정
3. `context: fork` + `agent` 필드로 격리 실행 환경 설정
4. `hooks` 필드로 컴포넌트 활성 중에만 실행되는 스코프된 hook 정의

## 주요 필드 분류

| 분류 | Skill 필드 | Agent 필드 |
|------|-----------|-----------|
| 식별 | name, description | name, description |
| 호출 제어 | user-invocable, disable-model-invocation | - |
| 실행 환경 | context, agent, model | model, permissionMode, isolation |
| 권한/도구 | allowed-tools | disallowedTools |
| 자동화 | hooks | hooks, skills, memory |
| 제한 | - | maxTurns, background |

## 관련 Business Context

- [Agent 라이프사이클 관리](../business/agent-lifecycle-management.md)
