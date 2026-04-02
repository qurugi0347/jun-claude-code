---
name: Advanced Modes
description: Coordinator Mode와 ULTRAPLAN 실험적 고급 기능 문서 구조 및 흐름 참조
keywords: [coordinator, ULTRAPLAN, parallel, experimental, advanced, worker, planning]
---

# Advanced Modes

Claude Code의 실험적 고급 기능인 Coordinator Mode와 ULTRAPLAN에 대한 문서 구조와 핵심 흐름을 정리한 참조 문서입니다.

## 파일 구조

| 파일 | 역할 | 주요 내용 |
|------|------|---------|
| templates/global/skills/PromptStructuring/advanced-modes.md | Coordinator Mode / ULTRAPLAN 활용 가이드 | 활성화 방법, 도구 제한, 워크플로우 Phase, 적합 시나리오 |
| templates/global/skills/PromptStructuring/skills-frontmatter.md | frontmatter 필드 레퍼런스 | coordinatorMode 필드 포함 Agent frontmatter 전체 명세 |
| templates/global/skills/PromptStructuring/SKILL.md | 프롬프트 구조화 규칙 | advanced-modes.md 참조 링크 포함 |
| templates/global/agents/task-planner.md | 복잡한 계획 수립 Agent | ULTRAPLAN 자동 트리거 안내 문구 포함 |
| templates/global/agents/architect.md | 아키텍처 설계 Agent | Coordinator Mode 실험적 기능 안내 문구 포함 |
| templates/global/CLAUDE.md | 전역 작업 가이드 | advanced-modes.md 참조 링크 추가 |

## 핵심 흐름

### Coordinator Mode 활성화 흐름

1. 환경변수 CLAUDE_CODE_COORDINATOR_MODE=true 설정 후 Claude Code 실행
2. Main Process가 Coordinator 역할 수행 (도구 제한 적용)
3. Research Phase: explore x2 + context-collector x1 병렬 실행
4. Synthesis Phase: Coordinator가 직접 결과 통합
5. Implementation Phase: code-writer x2 모듈별 병렬 실행
6. Verification Phase: qa-tester x1 + code-reviewer x1

### ULTRAPLAN 자동 트리거 흐름

1. 사용자가 복잡한 작업 요청 (대규모 아키텍처 결정 / 20+ 파일 리팩토링 등)
2. task-planner Agent가 계획 수립 시작
3. Claude Code 내부 판단으로 ULTRAPLAN 자동 트리거 (사용자 직접 호출 불가)
4. 원격 Cloud Container Runtime에서 Opus 4.6 + 최대 30분 thinking window로 깊은 분석
5. task-planner Plan 출력에 ULTRAPLAN 결과 반영

## Coordinator 도구 제한

Coordinator Mode 활성화 시 Main Process(Coordinator)는 아래 도구만 사용 가능합니다.

| 도구 | 역할 |
|------|------|
| Agent | worker 생성 및 실행 |
| SendMessage | worker 간 통신 |
| TaskStop | worker 중지 |
| SyntheticOutput | 결과 합성 |

## 기존 PM 패턴과의 비교

| 항목 | 기존 PM 패턴 | Coordinator Mode |
|------|-------------|-----------------|
| Worker 실행 방식 | 순차 (1개씩) | 병렬 (동시 N개) |
| 도구 접근 범위 | 모든 도구 | Agent/SendMessage/TaskStop만 |
| 컨텍스트 공유 | 공유 | Worker별 격리 |
| 적합 규모 | 중소 작업 | 대규모 작업 (10+ 파일) |

## Coordinator Mode 적합 시나리오

- 대규모 리팩토링: 10개 이상 파일, 여러 모듈 동시 변경
- 멀티 모듈 동시 구현: FE + BE 병렬 처리
- 대규모 코드베이스 탐색: 여러 디렉토리 동시 검색
- 독립적인 여러 작업을 한 세션에서 처리

## 관련 Business Context

- [고급 병렬 워크플로우](../business/advanced-parallel-workflows.md)
