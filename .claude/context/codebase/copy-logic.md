---
name: copy-logic
description: 파일 복사 및 설치 UI 로직 모듈 (global/project 모드별 제외 파일 구분 포함)
keywords: [copy, install, multiselect, enquirer, categorize, file-status, commands, statusLine, exclude]
---

# copy-logic

`src/copy.ts`에서 Claude Code 설정 파일을 소스 디렉토리에서 사용자 홈의 `~/.claude/`로 복사하는 핵심 로직을 담당합니다.
`enquirer` 기반 MultiSelect UI로 사용자가 설치할 agents/commands/skills를 대화형으로 선택할 수 있으며, others 카테고리(hooks, CLAUDE.md 등)는 변경된 파일만 자동 복사합니다.

## 파일 구조

| 파일 | 역할 | 핵심 함수/클래스 |
|------|------|-----------------|
| src/copy.ts | 파일 복사 메인 로직 | copyClaudeFiles(), categorizeFiles(), selectItems(), mergeSettingsJson() |

## 핵심 타입

| 타입 | 설명 |
|------|------|
| `FileStatus` | `'new' \| 'changed' \| 'unchanged'` — 파일의 설치 상태 |
| `CategorizedFiles` | `{ agents, commands, skills, others }` — 카테고리별 파일 분류 결과 |
| `CopyOptions` | `{ dryRun?, force?, project? }` — 복사 실행 옵션 |

## 제외 파일 목록

| 상수 | 대상 파일 | 동작 |
|------|-----------|------|
| `EXCLUDE_ALWAYS` | `settings.json` | 모든 모드에서 직접 복사 제외 (mergeSettingsJson()에서 별도 처리) |
| `EXCLUDE_FROM_PROJECT` | `hooks/_dedup.sh`, `statusline-command.sh` | project 모드에서만 제외 (global 모드에서는 정상 설치) |

## 핵심 함수

| 함수 | 설명 |
|------|------|
| `categorizeFiles(files)` | 파일 경로를 agents / commands / skills(디렉토리 단위) / others로 분류 |
| `getFileStatus(sourcePath, destPath)` | 파일 해시 비교로 new/changed/unchanged 판별 |
| `getSkillStatus(skillName, sourceDir, destDir)` | 스킬 디렉토리 내 모든 파일을 비교해 상태 반환 |
| `selectItems(category, items)` | enquirer MultiSelect 프롬프트 표시, 선택된 항목 이름 배열 반환 |
| `selectSkillSubFiles(skills, sourceDir, destDir)` | 선택된 스킬의 하위 파일을 그룹 구분선과 함께 MultiSelect로 표시, 선택된 파일 경로 배열 반환 |
| `statusLabel(status)` | chalk 컬러 상태 텍스트 반환 (inline 힌트용) |
| `statusBracket(status)` | chalk 컬러 `[상태]` 텍스트 반환 (로그 출력용) |
| `mergeSettingsJson(sourceDir, destDir, opts)` | settings.json hooks를 이벤트 키 단위로 병합; statusLine은 project 모드일 때만 제외, global 모드에서는 dest에 없을 경우 source 값 적용 |
| `copyClaudeFiles(options)` | 전체 설치 흐름 진입점 |

## 핵심 흐름

1. `copyClaudeFiles()` 호출 → 소스/대상 디렉토리 결정
2. `getAllFiles()` → 복사 대상 파일 목록 수집, `EXCLUDE_ALWAYS` 및 모드별 `EXCLUDE_FROM_PROJECT` 필터링
3. `categorizeFiles()` → agents / commands / skills / others 분류
4. `--dry-run`: 카테고리별 상태만 출력 후 종료
5. `--force`: 전체 파일 복사 (프롬프트 없음)
6. 기본 모드:
   - others: 변경된 파일만 자동 복사
   - agents: `selectItems()` 통해 사용자 선택 후 복사
   - commands: `selectItems()` 통해 사용자 선택 후 복사
   - skills: 2단계 선택
     - 1단계: `selectItems()` → 스킬 디렉토리 선택
     - 2단계: `selectSkillSubFiles()` → 선택된 스킬의 하위 파일 선택 (하위 파일이 1개인 스킬은 자동 포함)
7. `mergeSettingsJson()` → settings.json 병합 (statusLine: global에서는 dest-우선 보존, project에서는 제외)

## 관련 Business Context

- [installation-ux.md](../business/installation-ux.md)
- [commands-templates.md](../business/commands-templates.md)
