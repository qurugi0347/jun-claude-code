---
name: update-logic
description: 설치된 파일 업데이트 및 버전 동기화 로직 모듈 (removed-upstream 감지 포함)
keywords: [update, version, metadata, hash, upstream, removed-upstream, project-mode]
---

# update-logic

`src/update.ts`에서 이미 설치된 Claude Code 설정 파일을 최신 템플릿으로 업데이트하는 로직을 담당합니다.
메타데이터 기반 해시 비교로 user-modified / conflict / update-available / removed-upstream 상태를 정확하게 판별합니다.

## 파일 구조

| 파일 | 역할 | 핵심 함수/클래스 |
|------|------|-----------------|
| src/update.ts | 파일 업데이트 메인 로직 | updateClaudeFiles(), computeUpdateStatus() |

## 핵심 타입

| 타입 | 설명 |
|------|------|
| `UpdateFileStatus` | `'update-available' \| 'new-file' \| 'user-modified' \| 'conflict' \| 'unchanged' \| 'removed-upstream'` |
| `UpdateOptions` | `{ dryRun?, force?, project? }` — 업데이트 실행 옵션 |

## 핵심 함수

| 함수 | 설명 |
|------|------|
| `computeUpdateStatus(file, sourceDir, destDir, metadata)` | 파일 해시 비교로 업데이트 상태 판별 |
| `updateClaudeFiles(options)` | 전체 업데이트 흐름 진입점 |

## removed-upstream 감지 로직

메타데이터에 기록된 파일 중 새 템플릿에 없는 파일을 `removed-upstream`으로 표시합니다.
단, `EXCLUDE_ALWAYS` 파일과 project 모드에서 `EXCLUDE_FROM_PROJECT`에 해당하는 파일은 false-positive 방지를 위해 제외합니다.

```
excludedByProject = project && EXCLUDE_FROM_PROJECT.includes(file)
if (!files.includes(file) && !EXCLUDE_ALWAYS.includes(file) && !excludedByProject)
  → removed-upstream
```

## 관련 Business Context

- [installation-ux.md](../business/installation-ux.md)
