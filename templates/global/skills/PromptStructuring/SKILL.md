---
name: PromptStructuring
description: ".claude/skills/ 또는 .claude/agents/ 하위 파일을 생성·수정할 때 반드시 이 Skill을 읽고 규칙을 적용한다. XML 태그 구조화, 긍정 표현, 출력 최적화, Skills 2.0 frontmatter(context:fork, agent, hooks, skills preload) 스펙 포함."
keywords: [prompt, xml-tags, positive-phrasing, output-optimization, 프롬프트, 구조화, 긍정표현, XML, 출력최적화, frontmatter, SKILL.md, agent.md, skills-2.0, hooks, context-fork, skills-preload]
user-invocable: false
---

# 프롬프트 구조화 스킬

> Skill, Agent, Hook 파일 작성/수정 시 이 스킬의 규칙을 적용한다.

## 핵심 원칙

| 원칙 | 요약 | 상세 |
|------|------|------|
| 1. XML 태그 | `##` 대신 `<role>`, `<instructions>`, `<rules>` 등으로 의미 구분 | `xml-tags.md` |
| 2. 긍정 표현 | "~금지" 대신 "~한다"로 행동 직접 유도 | `positive-phrasing.md` |
| 3. 흐름 기호 | 단계/변환/위임에 `->` 사용: 계획 -> 구현 -> 검증 | - |
| 4. 출력 최적화 | 반복 제거, 테이블 > 산문, Hook 출력 150줄 이내 | `output-optimization.md` |
| 5. Skills 2.0 Frontmatter | Skill/Agent YAML frontmatter 필드, context:fork + agent 조합, hooks, skills preload | `skills-frontmatter.md` |

## 적용 시점

| 상황 | 참조할 문서 |
|------|-----------|
| Skill SKILL.md 새로 작성 | `skills-frontmatter.md` (frontmatter) + `xml-tags.md` (구조) |
| Agent .md 새로 작성 | `skills-frontmatter.md` (frontmatter) + `xml-tags.md` (구조) |
| Hook 스크립트 출력 작성 | `output-optimization.md` (줄 수 제한) |
| 기존 프롬프트 개선 | `positive-phrasing.md` + `xml-tags.md` |
| Skill ↔ Agent 연결 설계 | `skills-frontmatter.md` (양방향 연결 패턴) |
