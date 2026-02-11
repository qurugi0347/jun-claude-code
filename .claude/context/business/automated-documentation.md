---
name: Automated Documentation
description: 코드 변경에 따른 자동 문서 생성 시스템
keywords: [documentation, automation, CI, developer-experience]
---

# Automated Documentation

## 목적

개발자가 코드를 변경할 때마다 자동으로 프로젝트 문서를 업데이트하여, 문서와 코드의 동기화를 보장하고 팀원들이 항상 최신 정보를 참조할 수 있도록 합니다.

## 핵심 기능

| 기능 | 설명 | 사용자 관점 |
|------|------|------------|
| PR 기반 자동 분석 | PR의 변경사항을 자동으로 분석 | 수동 문서 작성 불필요 |
| 구조화된 문서 생성 | codebase/business 두 관점으로 문서 분류 | 기술/비즈니스 관점 모두 제공 |
| 증분 업데이트 | 변경된 모듈만 선택적 업데이트 | 빠른 문서 생성 및 이력 관리 |

## 사용자 흐름

1. 개발자가 PR을 생성 → GitHub Action이 자동으로 트리거
2. 변경된 파일 분석 → 관련 모듈/도메인 식별
3. context 문서 자동 생성/업데이트 → 커밋
4. 팀원들이 최신 문서 참조 가능

## 관련 Codebase Context

- [Context Generation Workflow](../codebase/context-generation-workflow.md)
