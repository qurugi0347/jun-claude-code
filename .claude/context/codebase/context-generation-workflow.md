---
name: Context Generation Workflow
description: PR 기반 자동 컨텍스트 문서 생성 시스템
keywords: [context, CI, automation, documentation, agent, skill]
---

# Context Generation Workflow

GitHub Actions를 통해 PR 변경사항을 분석하여 `.claude/context/` 문서를 자동으로 생성하고 업데이트하는 워크플로우입니다.

## 파일 구조

| 파일 | 역할 | 핵심 함수/클래스 |
|------|------|-----------------|
| .claude/agents/context-generator.md | CI 전용 context 생성 agent 정의 | - |
| .claude/skills/ContextGeneration/SKILL.md | context 자동 생성 규칙 및 템플릿 | - |

## 핵심 흐름

1. GitHub Action이 PR 이벤트 감지 → context-generator agent 실행
2. `git diff HEAD~1 --name-only`로 변경된 파일 수집 → 모듈 단위로 그룹화
3. 각 모듈에 대해 codebase context 생성/업데이트 (파일 경로, 함수명 참조)
4. 비즈니스 도메인별로 business context 생성/업데이트 (사용자 관점 설명)
5. INDEX.md 업데이트 → 변경사항 커밋

## 관련 Business Context

- [자동화된 문서화 시스템](../business/automated-documentation.md)
