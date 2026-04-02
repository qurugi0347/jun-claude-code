---
name: PromptStructuring-advanced-modes
description: Coordinator Mode와 ULTRAPLAN 등 Claude Code 고급 기능 활용 가이드. 실험적(experimental) 기능.
keywords: [coordinator, ULTRAPLAN, 병렬, parallel, 멀티워커, planning, experimental]
user-invocable: false
---

# Claude Code Advanced Modes (Experimental)

> 이 문서의 기능들은 비공개 내부 기능이며 예고 없이 변경/제거될 수 있습니다.

## Coordinator Mode

### 개요

멀티워커 병렬 오케스트레이션 모드. Main process가 coordinator 역할을 하며,
여러 worker agent를 동시에 실행하여 대규모 작업을 병렬 처리.

### 활성화

환경변수 `CLAUDE_CODE_COORDINATOR_MODE=true` 설정 후 Claude Code 실행.

### Coordinator의 도구 제한 (추정)

Coordinator는 아래 도구만 사용 가능:
- `Agent` — worker 생성
- `SendMessage` — worker 간 통신
- `TaskStop` — worker 중지
- `SyntheticOutput` — 결과 합성

### 워크플로우 Phase

| Phase | 역할 | 워커 구성 예시 |
|-------|------|---------------|
| Research | 병렬 탐색 | explore x2 + context-collector x1 |
| Synthesis | 결과 통합 | coordinator가 직접 수행 |
| Implementation | 병렬 구현 | code-writer x2 (모듈별 분리) |
| Verification | 검증 | qa-tester x1 + code-reviewer x1 |

### 적합한 시나리오

- 대규모 리팩토링 (10+ 파일, 여러 모듈)
- 멀티 모듈 동시 구현 (FE + BE 병렬)
- 대규모 코드베이스 탐색 (여러 디렉토리 동시 검색)
- 독립적인 여러 작업을 한 세션에서 처리

### 부적합한 시나리오

- 순차 의존성이 강한 작업 (A 완료 후 B 시작)
- 단일 파일 수정
- 간단한 버그 수정

### 기존 워크플로우와의 관계

현재 프로젝트의 Main Agent PM 패턴은 이미 Coordinator Mode의 경량 버전.
Coordinator Mode 활성화 시 차이점:

| 항목 | 기존 PM 패턴 | Coordinator Mode |
|------|-------------|-----------------|
| Worker 실행 | 순차 (1개씩) | 병렬 (동시 N개) |
| 도구 접근 | 모든 도구 | Agent/SendMessage/TaskStop만 |
| 컨텍스트 | 공유 | Worker별 격리 |
| 적합 규모 | 중소 작업 | 대규모 작업 |

## ULTRAPLAN

### 개요

복잡한 계획 수립을 원격 Cloud Container Runtime에서 처리.
고성능 모델 + 장시간 thinking window로 깊은 분석 수행 (현재 추정: Opus 4.6, 최대 30분).

### 트리거 조건 (추정)

- 매우 복잡한 아키텍처 결정이 필요한 경우
- 대규모 리팩토링 계획 (20+ 파일)
- 시스템 전체에 걸친 설계 변경
- Claude Code가 자체 판단으로 트리거 (사용자 직접 호출 불가)

### 활용 시나리오

1. **대규모 마이그레이션 계획**: DB 스키마 변경 + API 수정 + FE 대응이 모두 필요한 경우
2. **아키텍처 재설계**: 모놀리스 → 마이크로서비스 전환 계획
3. **기술 부채 해결 로드맵**: 여러 모듈에 걸친 점진적 개선 계획

### task-planner와의 관계

task-planner agent가 복잡한 계획 수립 시 ULTRAPLAN이 자동 트리거될 수 있음.
task-planner의 Plan 출력이 ULTRAPLAN의 결과를 반영.

### 제한사항

- 사용자가 직접 트리거할 수 없음 (Claude Code 내부 판단)
- 원격 실행이므로 네트워크 필요
- 실행 시간이 길 수 있음 (최대 30분)
- 실험적 기능으로 동작 보장 없음
