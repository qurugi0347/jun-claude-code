# CLAUDE.md

## 프로젝트 목적

이 프로젝트는 **Claude Code 설정 템플릿 CLI**입니다.

다양한 프로젝트에서 재사용할 수 있는 범용적인 Claude Code 설정을 제공하며, CLI를 통해 빠르게 환경을 구축할 수 있도록 합니다.

### 템플릿 구조

- **`templates/global/`** -- `~/.claude/`에 설치되는 전역 설정
  - Agents: 작업별 전문 Agent 정의 (explore, code-writer, git-manager 등)
  - Skills: 범용 스킬 가이드 (Git, 공통 코딩 원칙)
  - Hooks: 워크플로우 강제, 스킬 평가 등 자동 실행 스크립트
  - settings.json, CLAUDE.md (워크플로우, Context 절약 원칙)

- **`templates/project/`** -- 프로젝트의 `.claude/`에 설치되는 프로젝트별 설정
  - project-task-manager Agent
  - task-loader Hook
  - context-gen Workflow
  - project.env.example

### 사용 방법

CLI 도구(`jun-claude-code`)가 설치를 처리합니다. 설치 후 프로젝트에 맞게 `context/` 폴더 추가, `skills/`에 프로젝트별 스킬 추가가 가능합니다.

---

## 작업 가이드

**모든 작업은 `templates/global/CLAUDE.md`의 워크플로우를 참조하세요.**

주요 내용:
- Context 절약 원칙 (Subagent 위임 규칙)
- 작업 워크플로우 (Planning → Validation → Implementation → Review)
- .claude 문서 작성 가이드
