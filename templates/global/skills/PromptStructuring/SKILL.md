---
name: PromptStructuring
description: "Claude Code 프롬프트의 XML 태그 구조화, 긍정 표현 전환, 출력 최적화 가이드"
keywords: [prompt, xml-tags, positive-phrasing, output-optimization, 프롬프트, 구조화, 긍정표현, XML, 출력최적화]
estimated_tokens: 300
---

# 프롬프트 구조화 스킬

프롬프트의 형식과 표현 방식은 LLM 출력 품질에 직접적인 영향을 준다.

## 핵심 원칙

| 원칙 | 요약 | 상세 |
|------|------|------|
| 1. XML 태그 | `##` 대신 `<role>`, `<instructions>`, `<rules>` 등으로 의미 구분 | `xml-tags.md` |
| 2. 긍정 표현 | "~금지" 대신 "~한다"로 행동 직접 유도 | `positive-phrasing.md` |
| 3. 흐름 기호 | 단계/변환/위임에 `->` 사용: 계획 -> 구현 -> 검증 | - |
| 4. 출력 최적화 | 반복 제거, 테이블 > 산문, Hook 출력 150줄 이내 | `output-optimization.md` |
