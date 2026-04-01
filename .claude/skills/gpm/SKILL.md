---
name: gpm
description: "GitHub Project V2 태스크를 CLI로 관리하는 AI PM 도구. 다음 작업 시작(/gpm next), 완료 처리(/gpm done), 현황 조회(/gpm status), 작업 계획 수립(/gpm plan), 동기화(/gpm sync), 태스크 생성(/gpm create). .gpmrc가 있는 프로젝트에서 사용."
keywords: [gpm, task, 태스크, project, 프로젝트, github, 관리, PM, 칸반, kanban, next, done, status, plan, sync, create]
user_invocable: true
---

# GPM — GitHub Project Manager Skill

이 Skill은 `npx github-project-manager` CLI를 통해 GitHub Project V2의 태스크를 관리합니다.
프로젝트 루트에 `.gpmrc` 파일이 있어야 동작합니다. 없으면 `npx github-project-manager init`을 먼저 실행하세요.

<instructions>

## /gpm next — 다음 태스크 추천 및 시작

1. GitHub에서 최신 태스크를 동기화합니다:
   ```bash
   npx github-project-manager sync
   ```

2. 전체 태스크 목록을 조회합니다:
   ```bash
   npx github-project-manager task list --json --limit 100
   ```

3. 현재 프로젝트 상태를 분석합니다:
   - 현재 In Progress 태스크가 있는지 확인 (있으면 먼저 완료를 권유)
   - 최근 git log (`git log --oneline -10`)로 사용자의 최근 작업 맥락 파악

4. 추천 우선순위를 결정합니다 (높은 순서대로):
   - **마일스톤 기한이 가까운 태스크**: due_date가 임박한 마일스톤의 Todo 태스크 우선
   - **최근 작업과 관련된 태스크**: git log에서 최근 커밋 내용과 연관된 태스크 (같은 모듈, 같은 Phase)
   - **의존성 기반**: 다른 태스크의 선행 조건이 되는 기반 태스크 우선
   - **Phase 순서**: 현재 Phase의 미완료 태스크 우선, 다음 Phase는 나중에

5. 사용자에게 추천 태스크 목록을 제시하고 선택을 받습니다:
   ```
   📋 추천 태스크
   🔴 Sprint 1 마감 (2026-04-15) — 남은 Todo 2개:
   1. #8 TanStack Query 설정 — 기반 작업, 최근 FE 작업과 연관
   2. #10 태스크 목록/상세 페이지 — Sprint 1 필수

   📌 기타 (마감 미지정):
   3. #9 칸반 보드 구현 — UI 고급 기능

   어떤 태스크를 시작할까요?
   ```

5. 사용자가 선택한 태스크를 "In Progress"로 변경합니다:
   ```bash
   npx github-project-manager task status <id> "In Progress"
   ```

6. 선택한 태스크에 대해 구현 계획을 수립합니다:
   - 프로젝트의 docs/spec/ 문서가 있으면 참조
   - CLAUDE.md의 코딩 규칙을 따름
   - 구체적인 파일 수정 목록과 순서를 제안

## /gpm done — 현재 작업 완료 처리

1. 전체 태스크 목록을 조회합니다:
   ```bash
   npx github-project-manager task list --json --limit 100
   ```

2. In Progress와 최근 Done 태스크를 모두 확인합니다:
   - In Progress 태스크가 여러 개일 수 있음 (팀 작업)
   - GitHub 설정에 의해 자동으로 Done 처리된 태스크도 확인
   - 최근 git log, 변경된 파일 등을 분석하여 현재 사용자가 작업한 태스크를 추론

3. 사용자에게 확인을 받습니다:
   ```
   🔍 현재 작업 분석:
   - In Progress: #9 칸반 보드 구현, #10 태스크 목록
   - 최근 Done: #8 TanStack Query (자동 완료)

   최근 커밋 분석 결과 #9 칸반 보드 구현을 작업한 것으로 보입니다.
   이 태스크를 완료 처리할까요?
   ```

4. 확인 후 해당 태스크를 "Done"으로 변경합니다:
   ```bash
   npx github-project-manager task status <id> "Done"
   ```

5. GitHub과 동기화합니다:
   ```bash
   npx github-project-manager sync
   ```

6. 다음 추천 태스크를 `/gpm next`와 동일한 방식으로 제안합니다.

## /gpm status — 프로젝트 현황

1. 최신 동기화:
   ```bash
   npx github-project-manager sync
   ```

2. 전체 태스크 목록을 JSON으로 조회:
   ```bash
   npx github-project-manager task list --json --limit 100
   ```

3. 상태별로 집계하여 요약 출력:
   ```
   📊 프로젝트 현황
   - Backlog: N개
   - Todo: N개
   - In Progress: N개
   - Done: N개
   총 태스크: N개

   🔥 현재 진행 중:
   - #9 칸반 보드 구현 (담당: @user)
   - #10 태스크 목록 (담당: @user)
   ```

## /gpm plan — 작업 계획 수립

1. 전체 태스크 목록을 조회합니다:
   ```bash
   npx github-project-manager task list --json --limit 100
   ```

2. 프로젝트 문서(CLAUDE.md, docs/spec/roadmap.md 등)를 참조하여 현재 목표를 파악합니다.

3. 태스크를 분석합니다:
   - **마일스톤별 그룹핑**: 마일스톤이 있는 태스크를 due_date 기준으로 정렬
   - Phase별 그룹핑 (제목에 [Phase2], [Phase3] 등이 있으면)
   - 의존성 추론 (예: "TanStack Query 설정"은 "칸반 보드"보다 먼저)
   - 작업 난이도 예측
   - 현재 완료된 작업 대비 남은 작업 파악

4. 사용자에게 목표를 확인합니다:
   ```
   📊 마일스톤 현황:
   - Sprint 1 (2026-04-15): Todo 3개 / Done 5개
   - Sprint 2 (2026-05-01): Todo 7개

   Sprint 1 기한이 다가오고 있습니다. Sprint 1 우선으로 계획을 세울까요?
   ```

5. 확인 후 마일스톤 기한 기준으로 추천 작업 순서를 제안합니다:
   ```
   📋 추천 작업 순서

   🔴 Sprint 1 (마감: 2026-04-15, 남은 Todo: 3개):
   1. #8 TanStack Query 설정 — 기반 작업, 난이도: 낮음
   2. #10 태스크 목록/상세 페이지 — UI 기본, 난이도: 중간
   3. #9 칸반 보드 구현 — UI 고급, 난이도: 높음

   🟡 Sprint 2 (마감: 2026-05-01):
   4. #12 자동 폴링 — 백엔드, 난이도: 중간
   5. #13 ServeStaticModule 서빙 — 배포, 난이도: 낮음
   ```

## /gpm sync — GitHub 동기화

GitHub Project에서 최신 태스크를 로컬 DB로 가져옵니다:
```bash
npx github-project-manager sync
```

결과를 사용자에게 보고합니다.

## /gpm create <title> — 태스크 생성 + 작업 계획

1. GitHub Project에 새 태스크를 생성합니다:
   ```bash
   npx github-project-manager task create "<title>" --json
   ```

2. 생성된 태스크에 대해 구체적인 작업 계획을 작성합니다:
   - **목적**: 이 태스크가 달성해야 하는 결과물은 무엇인지
   - **완료 기준**: 어떤 상태가 되면 이 태스크가 완료인지
   - **구현 방향**: 어떤 파일을 수정하고 어떤 접근 방식을 사용할지
   - **의존성**: 선행 작업이 필요한지

3. 작업 계획을 사용자에게 제시합니다:
   ```
   ✓ 태스크 생성: #15 "칸반 보드 드래그 앤 드롭"

   📝 작업 계획:
   - 목적: 칸반 보드에서 태스크 카드를 드래그하여 상태 변경
   - 완료 기준: 드래그로 Todo → In Progress → Done 이동 가능
   - 구현: @dnd-kit 라이브러리 사용, KanbanColumn 컴포넌트 구현
   - 의존성: #8 TanStack Query 선행 필요

   바로 작업을 시작할까요?
   ```

</instructions>

<constraints>
- .gpmrc 파일이 없으면 "npx github-project-manager init을 먼저 실행하세요"라고 안내
- task create/status는 gpm server가 실행 중이거나, gh auth가 되어있어야 GitHub API 호출 가능
- GitHub API rate limit에 주의. sync는 필요할 때만 실행 (연속 호출 자제)
- 태스크 상태 변경 시 사용 가능한 상태값은 GitHub Project의 Status 필드 옵션에 따라 다름 (예: Todo, In Progress, Done, Backlog 등)
- npx 실행 시 첫 호출은 패키지 다운로드로 느릴 수 있음. 글로벌 설치(npm i -g github-project-manager) 권장
- 태스크 추천/완료 판단 시 자동으로 결정하지 않고 사용자에게 확인을 받는다
</constraints>
