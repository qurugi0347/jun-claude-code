# jun-claude-code

Claude Code 설정 템플릿 CLI입니다. 미리 정의된 `.claude` 설정을 `~/.claude`로 복사하여 새 프로젝트에서 빠르게 Claude Code 환경을 구축할 수 있습니다.

## 설치

```bash
# npx로 바로 실행
npx jun-claude-code

# 또는 전역 설치
npm install -g jun-claude-code
```

## 사용법

```bash
# 기본 실행 (기존 파일이 있으면 덮어쓰기 확인)
jun-claude-code

# 미리보기 (실제 복사 없이 복사될 파일 목록 확인)
jun-claude-code --dry-run

# 강제 덮어쓰기 (확인 없이 모든 파일 복사)
jun-claude-code --force
```

## 포함된 설정

### Agents (`.claude/agents/`)

| Agent | 설명 |
|-------|------|
| `explore` | 빠른 코드베이스 탐색 |
| `task-planner` | 작업 계획 수립 |
| `code-writer` | 코드 작성 |
| `code-reviewer` | 셀프 코드 리뷰 |
| `git-manager` | Git 작업 (커밋, PR) |
| `impact-analyzer` | 사이드이펙트 분석 |
| `qa-tester` | 테스트/빌드 검증 |
| `architect` | 아키텍처 설계 |
| `designer` | UI/UX 스타일링 |
| `context-collector` | Context 수집 |
| `context-manager` | Context 문서 관리 |

### Skills (`.claude/skills/`)

| Skill | 설명 |
|-------|------|
| `Coding` | 공통 코딩 원칙 (SRP, 응집도, 가독성) |
| `Git` | Git 커밋/PR 규칙 |
| `Backend` | 백엔드 개발 원칙 (레이어, TypeORM) |

### Hooks (`.claude/hooks/`)

- 워크플로우 순서 강제 프로토콜
- Skill/Agent 평가 프로토콜

## 커스터마이징

설치 후 `~/.claude/` 디렉토리에서 필요에 맞게 수정하세요.

```
~/.claude/
├── CLAUDE.md          # 작업 가이드
├── agents/            # Agent 정의 수정/추가
├── skills/            # Skill 가이드 수정/추가
├── hooks/             # 자동 실행 스크립트
└── context/           # 프로젝트별 Context (직접 추가)
```

### 프로젝트별 설정

프로젝트 루트에 `.claude/` 폴더를 만들어 프로젝트별 설정을 추가할 수 있습니다.

```
your-project/
├── .claude/
│   ├── context/       # 프로젝트 아키텍처, 도메인 지식
│   └── skills/        # 프로젝트 전용 스킬
└── CLAUDE.md          # 프로젝트 설명
```

## 핵심 원칙

이 템플릿의 핵심 원칙:

1. **Context 절약**: Main Agent의 Context Window 보존을 위해 Subagent에 작업 위임
2. **워크플로우 준수**: Planning → Validation → Implementation → Review
3. **Git 작업 위임**: 모든 Git 작업은 `git-manager` Agent 사용

## License

MIT
