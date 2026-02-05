---
name: pr-review
description: PR 코드 리뷰 스킬. 체크리스트 기반 구조적 리뷰 수행.
keywords: [PR리뷰, 코드리뷰, MR, 머지리퀘스트, 체크리스트, Critical, Warning, Approved]
estimated_tokens: ~300
user-invocable: true
---

# PR Review Skill

체크리스트 기반 Pull Request 리뷰.

## Review Workflow

### Step 1: Review Plan 작성

```markdown
## PR Review Plan

- [ ] **PR 범위 파악**
  - 목적:
  - 예상 동작 변경:

- [ ] **파일별 리뷰**
  - [ ] `file1.ts` - 설명
  - [ ] `file2.tsx` - 설명

- [ ] **구현 품질**
  - [ ] 로직 정확성
  - [ ] 에러 처리
  - [ ] 엣지 케이스
  - [ ] 타입 안전성

- [ ] **Best Practices**
  - [ ] 유지보수성
  - [ ] 성능
  - [ ] 보안

- [ ] **통합**
  - [ ] Breaking changes
  - [ ] API 계약
```

### Step 2: 리뷰 실행

- 완료 항목 `[x]` 체크
- 이슈에 인라인 코멘트
- 심각도별 분류

### Step 3: 결과 요약

```markdown
## Summary: Approved / Changes Requested / Blocked

### Critical (필수 수정)
### Suggestions (권장)
### Questions (질문)
### Highlights (좋은 점)
```

## PR 타입별 Focus

| Type | Focus Areas |
|------|-------------|
| Feature | 로직, 테스트, 문서 |
| Bugfix | 근본 원인, 회귀 방지 |
| Refactor | 동작 보존, 성능 |
| Config | 보안, 환경 호환성 |
| Dependency | Breaking changes, 보안 취약점 |
