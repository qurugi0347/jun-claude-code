---
name: installation-ux
description: 사용자가 설치할 파일을 직관적으로 선택하고 확인하는 설치 경험
keywords: [install, multiselect, UX, 파일선택, 카테고리, 상태표시]
---

# Installation UX

## 목적

Claude Code 설정 파일을 설치할 때 사용자가 필요한 파일만 선택적으로 설치할 수 있도록 직관적인 UI를 제공합니다.
agents/skills/others 카테고리 분류와 new/changed/unchanged 상태 표시로 설치 전 전체 상황을 한눈에 파악할 수 있습니다.

## 핵심 기능

| 기능 | 설명 | 사용자 관점 |
|------|------|------------|
| 카테고리 분류 | 파일을 agents / skills / others 3그룹으로 구분 | 역할별로 묶어 선택 용이 |
| 상태 표시 | 각 항목에 new / changed / unchanged 표시 | 설치 영향도 파악 가능 |
| MultiSelect UI | 체크박스 기반 대화형 선택 (↑↓ 이동, space 토글, a 전체선택, enter 확인) | 여러 파일을 한 화면에서 선택 |
| 2단계 스킬 선택 | 스킬 디렉토리 선택 후 하위 파일을 별도 화면에서 세분화 선택 | 필요한 스킬 파일만 정밀 선택 |
| others 자동 복사 | hooks, CLAUDE.md 등은 변경 시 자동 설치 | 핵심 설정 누락 방지 |
| --force 옵션 | 프롬프트 없이 전체 파일 설치 | CI/자동화 환경 지원 |
| --dry-run 옵션 | 실제 복사 없이 설치 예정 목록 미리보기 | 실수 없는 사전 확인 |

## 사용자 흐름

1. `jun-claude-code install` 실행 → 소스 파일 목록 수집
2. agents / skills / others 카테고리로 분류 표시
3. Agents MultiSelect 화면 → 설치할 agent 선택
4. Skills 2단계 선택:
   - 1단계: Skills MultiSelect 화면 → 설치할 스킬 디렉토리 선택
   - 2단계: 하위 파일 MultiSelect 화면 → 스킬별 구분선으로 그룹화하여 파일 세분화 선택 (하위 파일이 1개인 스킬은 자동 포함)
5. others(hooks, CLAUDE.md 등) → 변경된 항목만 자동 복사
6. settings.json → 기존 설정 보존하며 병합 적용
7. 설치 완료 요약 출력

## 관련 Codebase Context

- [copy-logic.md](../codebase/copy-logic.md)
