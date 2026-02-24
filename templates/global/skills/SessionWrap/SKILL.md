---
name: session-wrap
description: PR diff 기반으로 반복 패턴, 학습 포인트, 후속 작업을 분석하여 Skill/Context 후보를 제안
keywords: [세션정리, PR분석, 자동화, 학습, 후속작업, session-wrap, 회고]
estimated_tokens: ~800
user-invocable: true
---

# Session Wrap Skill

현재 브랜치의 변경사항을 분석하여 Skill 후보, 학습 포인트, 후속 작업을 자동으로 도출합니다.

<instructions>

## 실행 흐름

### Step 1: Diff 범위 파악

```bash
# base branch 감지 (main 또는 master)
BASE=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master)

# 변경 통계 수집
git diff --stat $BASE..HEAD
git diff --name-only $BASE..HEAD
git log --oneline $BASE..HEAD
```

위 명령으로 아래 3가지 데이터를 수집:
- `DIFF_STAT` — 파일별 변경 라인 통계
- `DIFF_NAMES` — 변경된 파일 목록
- `LOG` — 커밋 히스토리

변경사항이 없으면 사용자에게 알리고 종료합니다.

### Step 2: Diff 내용 수집

```bash
# 전체 diff (너무 크면 --stat만 사용)
git diff $BASE..HEAD
```

diff가 5000줄을 초과하면 `--stat`과 `--name-only` 결과만 사용합니다.

### Step 3: 3개 Agent 병렬 호출

아래 3개 Agent를 Task 도구로 **병렬** 호출합니다.
각 Agent에 Step 1~2에서 수집한 데이터를 프롬프트에 포함하여 전달합니다.

| Agent | 역할 | 기대 출력 |
|-------|------|----------|
| `automation-scout` | 반복 패턴 발견, Skill 후보 제안 | Skill 후보 목록 |
| `learning-extractor` | 학습 포인트 추출, Context/규칙 후보 | Context 문서 + CLAUDE.md 규칙 후보 |
| `followup-suggester` | 미완성/후속 작업 식별 | 우선순위별 후속 작업 목록 |

각 Agent 프롬프트 구성:

```
아래는 현재 브랜치의 base branch 대비 변경사항입니다. 분석해주세요.

## 커밋 히스토리
{LOG}

## 변경 통계
{DIFF_STAT}

## 변경 내용
{DIFF or DIFF_NAMES}
```

### Step 4: 결과 통합

3개 Agent의 결과를 아래 형식으로 통합 정리합니다:

```markdown
# Session Wrap 분석 결과

## 1. Skill 후보 (automation-scout)
[automation-scout 결과 요약]

## 2. 학습 포인트 (learning-extractor)
[learning-extractor 결과 요약]

## 3. 후속 작업 (followup-suggester)
[followup-suggester 결과 요약]
```

### Step 5: 사용자에게 적용 항목 선택 제시

AskUserQuestion으로 적용할 항목을 선택받습니다:

```
분석이 완료되었습니다. 아래 항목 중 적용할 것을 선택해주세요:
- Skill 생성: [후보 목록]
- Context 문서 추가: [후보 목록]
- CLAUDE.md 규칙 추가: [후보 목록]
- 후속 작업 Issue/Task 생성: [후보 목록]
```

사용자가 선택한 항목만 실행합니다.

</instructions>

<rules>

| 규칙 | 설명 |
|------|------|
| 병렬 실행 필수 | 3개 Agent는 반드시 병렬로 호출하여 속도 최적화 |
| Diff 크기 제한 | 5000줄 초과 시 stat/names만 전달 |
| 사용자 선택 우선 | 분석 결과를 자동 적용하지 않고 반드시 선택받기 |
| 빈 결과 허용 | Agent가 해당 없음을 반환해도 정상 — 해당 섹션 "해당 없음" 표시 |

</rules>

