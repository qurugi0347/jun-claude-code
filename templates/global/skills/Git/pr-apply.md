---
name: pr-apply
description: PR 리뷰 피드백 적용 스킬. 리뷰 코멘트 확인, 코드 수정, 커밋 생성.
keywords: [PR피드백, 리뷰적용, 코드수정, 코멘트, 변경요청, 재커밋]
estimated_tokens: ~250
user-invocable: true
---

# PR Apply Skill

PR 리뷰 피드백을 코드에 반영하는 가이드.

<instructions>

## Apply Workflow

### Step 1: 리뷰 피드백 확인

```bash
# PR 코멘트 조회
gh pr view <PR번호> --comments

# PR diff 확인
gh pr diff <PR번호>
```

### Step 2: 피드백 분류

| 분류 | 대응 |
|------|------|
| Critical | 반드시 수정 |
| Suggestion | 검토 후 적용 여부 결정 |
| Question | 답변 코멘트 작성 |

### Step 3: 코드 수정

```bash
# 현재 브랜치에서 수정
git checkout feature/branch-name

# 수정 후 커밋 (리뷰 반영임을 명시)
git commit -m "$(cat <<'EOF'
FIX: PR 리뷰 피드백 반영

- 피드백 1 반영 내용
- 피드백 2 반영 내용

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 4: PR 업데이트

```bash
# 변경사항 push
git push origin feature/branch-name

# 리뷰어에게 수정 완료 알림 (선택)
gh pr comment <PR번호> --body "리뷰 피드백 반영 완료했습니다. 재확인 부탁드립니다."
```

</instructions>

<rules>

## 피드백 대응 원칙

### 수용할 때

- 코드 수정 후 커밋
- 복잡한 변경은 별도 커밋으로 분리
- 수정 완료 후 리뷰어에게 알림

### 반대 의견이 있을 때

- PR 코멘트로 이유 설명
- 대안 제시
- 합의 후 진행

### 질문에 답변할 때

- 해당 코멘트에 직접 답변
- 필요시 코드에 주석 추가

</rules>

<checklist>

## 체크리스트

- [ ] 모든 Critical 피드백을 반영했는가?
- [ ] Suggestion을 검토하고 결정했는가?
- [ ] Question에 답변을 완료했는가?
- [ ] `lint` 통과하는가?
- [ ] `build` 성공하는가?
- [ ] 리뷰어에게 재확인을 요청했는가?

</checklist>
