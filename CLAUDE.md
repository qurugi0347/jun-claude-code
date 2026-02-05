# CLAUDE.md

## 프로젝트 목적

이 프로젝트는 **Claude Code 설정 템플릿**입니다.

다양한 프로젝트에서 재사용할 수 있는 범용적인 `.claude` 설정을 제공하여, 새 프로젝트에서 빠르게 Claude Code 환경을 구축할 수 있도록 합니다.

### 포함된 내용

- **Agents**: 작업별 전문 Agent 정의 (explore, code-writer, git-manager 등)
- **Skills**: 범용 스킬 가이드 (Git, 공통 코딩 원칙)
- **Workflow**: Context 절약 원칙, 작업 워크플로우, 문서 작성 가이드

### 사용 방법

1. `.claude/` 폴더를 프로젝트에 복사
2. 프로젝트에 맞게 `context/` 폴더 추가 (아키텍처, 도메인 등)
3. 필요시 `skills/` 에 프로젝트별 스킬 추가 (Backend, Frontend 등)

---

## 작업 가이드

**모든 작업은 `.claude/CLAUDE.md`를 참조하세요.**

주요 내용:
- Context 절약 원칙 (Subagent 위임 규칙)
- 작업 워크플로우 (Planning → Validation → Implementation → Review)
- .claude 문서 작성 가이드
