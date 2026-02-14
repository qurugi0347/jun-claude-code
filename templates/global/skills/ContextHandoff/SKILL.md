---
name: context-handoff
description: 컨텍스트 압축을 위한 HANDOFF.md 작성 가이드
keywords: [HANDOFF, 컨텍스트, context, 압축, handoff, 세션, clear, 토큰]
estimated_tokens: ~300
---

# Context Handoff

긴 대화에서 컨텍스트 성능이 저하될 때 HANDOFF.md를 생성하여 핵심 정보만 이어갑니다.

<instructions>

## 언제 사용하는가

- 토큰 사용량이 50k 이상일 때 (`/context`로 확인)
- 응답 품질이 눈에 띄게 저하될 때
- 복잡한 작업을 새 세션에서 이어갈 때

## HANDOFF.md 포맷

```markdown
# 프로젝트: [이름]
## 목표
[현재 작업의 최종 목표]
## 완료된 작업
- [완료 항목 1]
- [완료 항목 2]
## 시도했지만 실패한 것
- [실패 항목]: [실패 이유]
## 현재 문제
[지금 막혀있는 것]
## 다음 단계
1. [즉시 해야 할 것]
2. [그 다음 해야 할 것]
```

## 워크플로우

1. `/context`로 토큰 사용량 확인
2. HANDOFF.md 생성 (프로젝트 루트)
3. `/clear`로 컨텍스트 초기화
4. 새 대화에서 "HANDOFF.md를 읽고 이어서 작업해줘" 입력

</instructions>

<rules>

- HANDOFF.md는 **500자 이내**로 작성 (길면 의미 없음)
- "시도했지만 실패한 것"을 반드시 포함 (같은 실수 반복 방지)
- 코드 스니펫은 포함하지 않음 (파일 경로만 기록)
- 작업 완료 후 HANDOFF.md 삭제

</rules>
