---
name: Advanced Parallel Workflows
description: 대규모 병렬 작업 자동화와 깊은 계획 수립 자동화를 제공하는 고급 실험적 기능
keywords: [coordinator, ULTRAPLAN, parallel, planning, automation, experimental, scale]
---

# Advanced Parallel Workflows

## 목적

Claude Code의 실험적 고급 기능을 통해 대규모 병렬 작업 자동화와 깊은 계획 수립 자동화를 제공합니다. 사용자가 복잡한 대규모 작업을 요청하면 Claude Code가 자동으로 최적 실행 전략을 선택합니다.

## 핵심 기능

| 기능 | 설명 | 사용자 관점 |
|------|------|------------|
| Coordinator Mode | 여러 worker agent를 병렬로 실행하여 대규모 작업 처리 | 10개 이상 파일 변경도 빠르게 완료 |
| ULTRAPLAN | 복잡한 계획 수립을 원격 고성능 환경에서 처리 | 시스템 설계 수준의 깊은 분석 결과 자동 제공 |

## 사용자 흐름

### Coordinator Mode 활용 시나리오

1. 사용자가 "전체 모듈을 TypeScript로 마이그레이션해줘" 요청
2. Coordinator Mode 활성화 환경에서 Claude Code가 자동으로 병렬 worker 구성
3. 탐색 worker들이 동시에 여러 모듈을 분석
4. 구현 worker들이 모듈별로 병렬 마이그레이션 수행
5. 검증 worker들이 동시에 테스트 및 리뷰

### ULTRAPLAN 활용 시나리오

1. 사용자가 "모놀리스를 마이크로서비스로 전환하는 로드맵을 만들어줘" 요청
2. Claude Code 내부 판단으로 ULTRAPLAN 자동 트리거
3. 원격 고성능 환경에서 30분 이내 깊은 아키텍처 분석
4. 사용자에게 단계별 마이그레이션 계획 문서 제공

## 비즈니스 가치

| 시나리오 | 기존 방식 | 고급 모드 활용 |
|----------|-----------|---------------|
| 대규모 리팩토링 (10+ 파일) | 순차 처리로 시간 소요 | 병렬 처리로 시간 단축 |
| 복잡한 아키텍처 결정 | 일반 계획 수립 | 깊은 분석으로 더 정확한 계획 |
| 멀티 모듈 동시 구현 | 순서 의존적 처리 | FE/BE 병렬 동시 구현 |

## 사용 조건

| 기능 | 활성화 방법 | 사용자 개입 여부 |
|------|------------|----------------|
| Coordinator Mode | CLAUDE_CODE_COORDINATOR_MODE=true 환경변수 설정 | 환경변수 설정만 필요 |
| ULTRAPLAN | Claude Code 내부 자동 판단 | 불필요 (자동 트리거) |

## 제약사항

- 두 기능 모두 실험적(experimental)으로 예고 없이 변경/제거될 수 있음
- Coordinator Mode: 순차 의존성이 강한 작업에는 비적합
- ULTRAPLAN: 사용자가 직접 트리거 불가, 네트워크 필요, 최대 30분 소요

## 관련 Codebase Context

- [Advanced Modes](../codebase/advanced-modes.md)
