---
name: Documentation
description: .claude 폴더 내 문서 생성/수정 시 사용. frontmatter 형식, Context/Skill/Agent 템플릿, 파일 분리 기준 제공.
keywords: [문서, 작성, CLAUDE.md, context, skill, agent, frontmatter, 템플릿]
estimated_tokens: ~800
---

# .claude 문서 작성 스킬

## 핵심 원칙

1. **Context 압축**: 토큰 절약을 위해 최대한 압축
2. **검색 가능성**: keywords로 정확한 매칭
3. **독립성**: 각 파일이 단독으로 이해 가능
4. **참조 명시**: 관련 문서 경로 항상 포함

## 디렉토리 구조

```
.claude/
├── CLAUDE.md          # 프로젝트 전체 가이드 (인덱스 역할)
├── context/           # 사실/배경 정보 (읽기 전용)
│   ├── architecture.md
│   └── domain/
├── skills/            # 방법/절차 가이드 (액션 지침)
│   ├── Coding/
│   │   └── SKILL.md
│   └── React/
│       ├── SKILL.md   # 인덱스
│       └── sub-skill.md
├── agents/            # Agent 정의
│   └── explore.md
└── hooks/             # 자동 실행 스크립트
    └── pre-commit.sh
```

## 파일 유형 구분

| 유형 | 목적 | 위치 | 예시 |
|------|------|------|------|
| Context | 사실/배경 ("우리 프로젝트는 이렇다") | `context/` | 아키텍처, 도메인 지식 |
| Skill | 방법/절차 ("이렇게 해라") | `skills/` | 코딩 규칙, Git 규칙 |
| Agent | 역할/프로세스 ("이 Agent가 한다") | `agents/` | explore, code-writer |
| Hook | 자동 실행 ("이 시점에 실행") | `hooks/` | pre-commit, post-push |

## Frontmatter 필수 작성

모든 `.md` 파일은 YAML frontmatter로 시작합니다.

### 공통 필드

```yaml
---
name: file-name              # 파일 식별자 (kebab-case)
description: 한 줄 설명       # 파일 목적 (50자 이내)
keywords: [키워드1, 키워드2]  # 검색/매칭용 (한글, 영문 혼용)
estimated_tokens: ~500       # 예상 토큰 수
---
```

### Agent 전용 필드

```yaml
---
name: agent-name
description: Agent 역할 설명
keywords: [...]
model: opus                  # opus | sonnet | haiku
color: blue                  # UI 표시 색상
---
```

### Skill 전용 필드

```yaml
---
name: skill-name
description: Skill 목적
keywords: [...]
user-invocable: true         # 사용자가 /skill-name으로 호출 가능
---
```

## 파일 길이 제한

| 상태 | 줄 수 | 조치 |
|------|-------|------|
| 권장 | ~500줄 | 이상적인 길이 |
| 허용 | ~1000줄 | 최대 한계 |
| 초과 | 1000줄+ | 반드시 파일 분리 |

**초과 시 분리 방법:**
- Skill: `SKILL.md` (인덱스) + `sub-skill.md` (상세)
- Context: `INDEX.md` (요약) + `detail.md` (상세)

## 파일 유형별 템플릿

### Context 템플릿

```markdown
---
name: context-name
description: 설명
keywords: [키워드1, 키워드2]
estimated_tokens: ~300
---

# 제목

## 핵심 정보

(테이블, 다이어그램으로 핵심만 요약)

| 항목 | 값 |
|------|-----|
| ... | ... |

## 상세 구조

(필요시 코드 블록, 상세 설명)

## 관련 파일

- `path/to/related.md` - 설명
- `src/module/` - 관련 소스 코드
```

### Skill 템플릿

```markdown
---
name: skill-name
description: 설명
keywords: [키워드1, 키워드2]
estimated_tokens: ~400
---

# 스킬 제목

## 핵심 역할

- 역할 1
- 역할 2

## 필수 준수 사항

| 규칙 | 올바른 예 | 잘못된 예 |
|------|----------|----------|
| ... | ... | ... |

## 코드 예제

\`\`\`typescript
// 올바른 패턴
\`\`\`

## 체크리스트

- [ ] 확인 항목 1
- [ ] 확인 항목 2

## 관련 문서

| 문서 | 설명 |
|------|------|
| `sub-skill.md` | 상세 내용 |
```

### Agent 템플릿

```markdown
---
name: agent-name
description: Agent 역할 설명
keywords: [키워드1, 키워드2]
model: sonnet
color: blue
---

# Agent 이름

## 역할

1. 첫 번째 역할
2. 두 번째 역할

## 언제 사용하는가

- 사용 시점 1
- 사용 시점 2

## 프로세스

### Step 1: 준비
...

### Step 2: 실행
...

## 출력 형식

\`\`\`markdown
# 결과 제목

## 요약
...
\`\`\`
```

## 인덱스 파일 작성법

Skill이 여러 파일로 분리되면 `SKILL.md`가 인덱스 역할을 합니다.

```markdown
---
name: skill-name
description: 스킬 그룹 설명
keywords: [...]
---

# 스킬 제목

## 핵심 역할

(간단한 요약)

## 관련 문서

| 문서 | 설명 |
|------|------|
| `sub-skill-1.md` | 세부 주제 1 |
| `sub-skill-2.md` | 세부 주제 2 |

(인덱스 파일에서는 상세 내용 작성하지 않음)
```

## Keywords 작성 가이드

효과적인 검색을 위해 다양한 변형을 포함합니다.

```yaml
keywords:
  - React           # 영문 정식 명칭
  - 리액트           # 한글
  - component       # 관련 개념 (영문)
  - 컴포넌트         # 관련 개념 (한글)
  - hooks           # 세부 기능
  - useState        # 구체적 API
```

**포함할 것:**
- 정식 명칭 (영문/한글)
- 약어 (예: RHF for React Hook Form)
- 관련 개념
- 자주 검색하는 키워드

## 작성 시 주의사항

### DO (해야 할 것)

- 테이블로 정보 압축
- 코드 예제에 주석 최소화
- 한 파일에 하나의 주제
- 관련 문서 참조 명시
- 체크리스트로 검증 포인트 제공

### DON'T (하지 말 것)

- 장황한 설명 (압축!)
- 중복된 내용 (참조로 대체)
- 1000줄 초과 (분리!)
- frontmatter 누락
- 모호한 keywords

## 체크리스트

### 새 파일 작성 시
- [ ] frontmatter가 올바르게 작성되었는가?
- [ ] keywords에 영문/한글 변형이 포함되었는가?
- [ ] 500줄 이하인가? (초과 시 분리 검토)
- [ ] 관련 문서 참조가 명시되었는가?

### 인덱스 파일인 경우
- [ ] 관련 문서 테이블이 있는가?
- [ ] 상세 내용은 sub-file로 분리되었는가?

### Agent 파일인 경우
- [ ] model 필드가 지정되었는가?
- [ ] 프로세스가 Step별로 명시되었는가?
- [ ] 출력 형식이 정의되었는가?
