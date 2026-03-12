# Skills Eval (평가) 테스트 가이드

Anthropic이 Skills 2.0과 함께 공개한 **skill-creator** 도구셋으로 Skill의 트리거 정확도와 출력 품질을 체계적으로 테스트할 수 있습니다.

---

## 핵심 개념: 두 가지 평가 축

| 축 | 질문 | 테스트 방법 |
|---|------|-----------|
| **Trigger Precision** | Claude가 이 Skill을 올바른 시점에 호출하는가? | `eval-set.json` + `run_eval.py` |
| **Output Quality** | Skill이 활성화됐을 때 좋은 결과를 내는가? | Claude A/B 패턴 + rubric 평가 |

---

## Eval 셋업 가이드

### Step 1: eval-set.json 작성

```json
[
  {
    "query": "React 컴포넌트에서 useState 초기값을 어떻게 설정해?",
    "should_trigger": true,
    "note": "React skill 트리거 대상"
  },
  {
    "query": "NestJS에서 TypeORM Entity 작성법",
    "should_trigger": false,
    "note": "Backend skill 대상이지 React가 아님"
  },
  {
    "query": "오늘 날씨 어때?",
    "should_trigger": false,
    "note": "완전 무관한 질문"
  }
]
```

### Step 2: 디렉토리 구조

```
my-skill/
├── SKILL.md
├── evals/
│   └── eval-set.json
├── scripts/
│   └── run_eval.py      ← Anthropic skill-creator 제공
└── reference/
```

### Step 3: 평가 실행

```bash
# 기본 실행 (쿼리당 3회 반복으로 안정성 확보)
python scripts/run_eval.py \
  --eval-set evals/eval-set.json \
  --skill-path ./my-skill \
  --runs-per-query 3

# 자동 description 최적화 루프
python scripts/run_loop.py \
  --eval-set evals/eval-set.json \
  --skill-path ./my-skill \
  --max-iterations 5 \
  --holdout 0.4 \
  --model claude-opus-4-6

# HTML 리포트 생성
python scripts/generate_review.py \
  --eval-set evals/eval-set.json \
  --output eval-report.html
```

### Step 4: 결과 해석

| 지표 | 의미 | 목표 |
|------|------|------|
| **Precision** | Skill 호출 중 올바른 호출 비율 | 90%+ |
| **Recall** | 호출해야 할 상황에서 실제 호출된 비율 | 90%+ |

---

## Anthropic Skill-Creator 도구셋

| 도구 | 용도 | 명령어 |
|------|------|--------|
| `run_eval.py` | 트리거 정확도 테스트 | `python run_eval.py --eval-set evals.json --skill-path ./skill` |
| `run_loop.py` | description 자동 최적화 | `python run_loop.py --eval-set evals.json --max-iterations 5` |
| `improve_description.py` | AI 기반 description 개선 제안 | `python improve_description.py --skill-path ./skill --failures failures.json` |
| `generate_review.py` | HTML 평가 리포트 생성 | `python generate_review.py --output report.html` |

---

## Claude A/B 패턴 (실전 품질 테스트)

### Phase 1: Claude A = Skill 작성자

```
You → Claude A: "이 작업 패턴으로 Skill 만들어줘"
Claude A → SKILL.md 생성
```

### Phase 2: Claude B = Skill 사용자 (새 세션)

```
Claude B에게 실제 작업 요청 → 결과 관찰
- Skill이 올바르게 트리거되는가?
- 출력 품질이 기대에 부합하는가?
- 어디서 실패하는가?
```

### Phase 3: 피드백 루프

```
관찰된 실패 → Claude A에게 전달 → SKILL.md 개선 → Claude B 재테스트

Iteration 1: Train 9/13 (69%), Test 3/5 (60%)
Iteration 2: Train 11/13 (85%), Test 4/5 (80%)
Iteration 3: Train 13/13 (100%), Test 5/5 (100%)
```

---

## Eval 작성 Best Practices

### 원칙

1. **Eval을 먼저 작성**: Skill 문서보다 eval을 먼저 만들어 기준 확립
2. **실제 실패 기반**: 관찰된 실패를 eval로 변환 (추측 기반 X)
3. **모든 모델에서 테스트**: Haiku, Sonnet, Opus에서 각각 검증
4. **자동화 우선**: 수동 검증보다 자동 채점이 가능한 eval 구조

### Eval Case 패턴

#### 패턴 1: 직접 트리거

```json
{ "query": "React 컴포넌트 설계 도와줘", "should_trigger": true }
```

#### 패턴 2: 암묵적 트리거

```json
{ "query": "useState가 리렌더링을 일으키는 이유가 뭐야?", "should_trigger": true }
```

#### 패턴 3: 경계 케이스

```json
{ "query": "카드가 뭐야? (일반적으로)", "should_trigger": false,
  "note": "개념 질문이지 디자인 요청이 아님" }
```

#### 패턴 4: 혼합 토픽

```json
{ "query": "예산 회의 내용... 그리고 폼 컴포넌트도 만들어줘", "should_trigger": true,
  "note": "무관한 맥락이 섞여도 트리거해야 함" }
```

---

## CI/CD 통합

```yaml
# .github/workflows/skill-evals.yml
name: Skill Evaluations

on: [pull_request, push]

jobs:
  evaluate-skills:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"

      - name: Run skill evals
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          python scripts/run_eval.py \
            --eval-set evals/eval-set.json \
            --skill-path ./my-skill \
            --runs-per-query 3

      - name: Generate report
        if: always()
        run: |
          python scripts/generate_review.py \
            --eval-set evals/eval-set.json \
            --output eval-report.html

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: eval-report
          path: eval-report.html
```

---

## 이 프로젝트에 적용

templates의 각 Skill에 `evals/` 폴더를 추가하여 트리거 정확도를 검증할 수 있습니다:

```
templates/global/skills/Coding/
├── SKILL.md
└── evals/
    └── eval-set.json    ← "SRP 위반 코드 리팩토링해줘" → true
                            "git commit 해줘" → false

templates/global/skills/React/
├── SKILL.md
└── evals/
    └── eval-set.json    ← "useState 초기값 설정" → true
                            "NestJS Entity 작성" → false
```
