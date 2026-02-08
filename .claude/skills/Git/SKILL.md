---
name: Git
description: 커밋/PR/브랜치 작업 시 사용. FEAT/FIX/REFACTOR 메시지 규칙, PR 템플릿, 리뷰 체크리스트 인덱스 제공.
keywords: [커밋, PR, 브랜치, push, merge, FEAT, FIX, 코드리뷰, PR리뷰, 피드백]
estimated_tokens: ~100
---

# Git 작업 스킬

## 이 스킬이 필요할 때

- Git commit 메시지 작성
- Pull Request 생성
- PR/MR 코드 리뷰
- 리뷰 피드백 반영

## 관련 문서

| 주제 | 위치 | 설명 |
|-----|------|------|
| Commit/PR 생성 | `git.md` | 메시지 형식, PR 작성법, 브랜치 전략, 안전 규칙 |
| PR 리뷰 | `pr-review.md` | 체크리스트 기반 코드 리뷰 워크플로우 |
| PR 피드백 적용 | `pr-apply.md` | 리뷰 피드백 분류 및 반영 방법 |

## 빠른 참조

### Commit PREFIX

| PREFIX | 용도 |
|--------|------|
| FEAT | 새로운 기능 |
| FIX | 버그 수정 |
| REFACTOR | 리팩토링 |
| CHORE | 빌드/설정 |
| DOCS | 문서 |

> 상세 형식 및 예시: `git.md`

### PR 워크플로우

```
변경사항 분석 → 영향 분석 → PR 작성 → Self Review → 팀원 리뷰 → Merge
```

> 상세 Step: `git.md`
