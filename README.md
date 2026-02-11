# jun-claude-code

Claude Code 설정 템플릿 CLI. 미리 정의된 Agents, Skills, Hooks, Workflow를 프로젝트에 설치하여 Claude Code 환경을 빠르게 구축합니다.

## 포함 내용

### Agents (`templates/global/agents/`)

작업별 전문 Subagent 13종. Main Agent의 Context Window를 절약하면서 각 작업을 위임합니다.

| Agent | 역할 |
|-------|------|
| `explore` | 코드베이스 탐색 |
| `task-planner` | 작업 계획 수립 |
| `code-writer` | 코드 작성 (Opus) |
| `simple-code-writer` | 단순 수정 (Haiku) |
| `code-reviewer` | 셀프 코드 리뷰 |
| `git-manager` | Git 커밋/PR |
| `impact-analyzer` | 사이드이펙트 분석 |
| `qa-tester` | 테스트/빌드 검증 |
| `architect` | 아키텍처 설계 |
| `designer` | UI/UX 스타일링 |
| `director` | 작업 총괄 디렉터 |
| `context-collector` | 소스 코드 기반 Context 수집 |
| `context-manager` | Context 문서 관리 |

### Skills (`templates/global/skills/`)

| Skill | 설명 |
|-------|------|
| `Coding` | 공통 코딩 원칙 (SRP, 응집도, 가독성) |
| `Git` | Git 커밋/PR 규칙, PR 리뷰, 피드백 적용 |
| `Backend` | 백엔드 개발 원칙 (레이어, TypeORM) |
| `React` | React 개발 (TanStack Router, React Hook Form, Tailwind) |
| `Documentation` | .claude 문서 작성 가이드 |
| `Director` | 디렉터 Agent 운영 스킬 |

### Hooks (`templates/global/hooks/`)

| Hook | 설명 |
|------|------|
| `workflow-enforced.sh` | 워크플로우 순서 강제 프로토콜 |
| `skill-forced.sh` | Skill/Agent 평가 프로토콜 |

### Project Agents (`templates/project/agents/`)

프로젝트 `.claude/`에 설치되는 프로젝트별 Agent.

| Agent | 역할 |
|-------|------|
| `project-task-manager` | GitHub Project 태스크 관리 |
| `context-generator` | Context 자동 생성 |
| `project-context-collector` | .claude/context/ 문서 기반 프로젝트 배경 수집 |

### Project Skills (`templates/project/skills/`)

| Skill | 설명 |
|-------|------|
| `ContextGeneration` | Context 자동 생성 스킬 |

### Workflow

Planning -> Validation -> Implementation -> Review 순서의 작업 워크플로우와 Context 절약 원칙(Subagent 위임 규칙)을 정의합니다.

## 설치

```bash
# npx로 바로 실행
npx jun-claude-code

# 또는 전역 설치
npm install -g jun-claude-code
```

## 사용법

### 명령어 미리보기

| 명령어 | 설명 | 활성화되는 기능 |
|--------|------|----------------|
| `jun-claude-code` | 전역 설정 (`~/.claude/`) 설치 | Agents 13종, Skills 6종, Hooks 2종, Workflow |
| `jun-claude-code init-project` | GitHub Project 연동 | 세션 시작 시 태스크 자동 로드, 태스크 관리 Agent |
| `jun-claude-code init-context` | Context 자동 생성 설정 | PR 기반 Context 자동 생성, Codebase/Business 문서화, 별도 브랜치 PR |

### 기본 명령어: 설정 복사

`templates/global` 설정 파일을 `~/.claude`로 복사합니다.

```bash
jun-claude-code
```

| 옵션 | 설명 |
|------|------|
| `--dry-run`, `-d` | 실제 복사 없이 복사될 파일 목록만 확인 |
| `--force`, `-f` | 확인 없이 모든 파일 덮어쓰기 |

### `init-project`: GitHub Project 연동

프로젝트 디렉토리에서 GitHub Project 태스크 관리를 설정합니다.

```bash
jun-claude-code init-project
```

인터랙티브로 다음을 설정합니다:
- GitHub Owner (org 또는 user)
- Project Number
- Repository (owner/repo 형식)

**활성화되는 기능:**

| 기능 | 설명 |
|------|------|
| 세션 시작 시 태스크 자동 로드 | Claude Code 시작 시 `task-loader.sh`가 GitHub Project에서 할당된 태스크를 조회 |
| 태스크 관리 Agent | `project-task-manager` Agent를 통해 태스크 상태 변경, 코멘트 추가 가능 |

설정 후 생성되는 파일:

```
.claude/
├── project.env                    # GitHub Project 환경변수
├── settings.json                  # StartSession hook 설정
├── hooks/
│   └── task-loader.sh             # 태스크 조회 스크립트
└── agents/
    └── project-task-manager.md    # 태스크 관리 Agent
```

> `read:project` 스코프 필요: `gh auth refresh -s read:project,project`

### `init-context`: Context 자동 생성 설정

GitHub Actions를 통한 Context 문서 자동 생성을 설정합니다.

```bash
jun-claude-code init-context
```

**활성화되는 기능:**

| 기능 | 설명 |
|------|------|
| PR 기반 Context 자동 생성 | PR이 생성/업데이트되면 GitHub Actions가 코드 변경을 분석하여 Context 문서 생성 |
| Codebase Context | 모듈별 파일 경로, 함수명, 의존 관계를 `.claude/context/codebase/`에 정리 |
| Business Context | 기술 변경을 비즈니스 관점으로 변환하여 `.claude/context/business/`에 정리 |
| 별도 브랜치 PR 방식 | 생성된 Context를 `{브랜치명}-generated-context` 브랜치로 분리하여 선택적 머지 가능 |

설정 후 생성되는 파일:

```
.github/workflows/
└── context-gen.yml                # Context 생성 GitHub Actions 워크플로우

.claude/
├── agents/
│   └── context-generator.md       # Context 자동 생성 Agent
├── skills/
│   └── ContextGeneration/
│       └── SKILL.md               # Context 자동 생성 Skill
└── context/
    ├── codebase/
    │   └── INDEX.md               # 코드베이스 모듈 참조 목록
    └── business/
        └── INDEX.md               # 비즈니스 도메인 참조 목록
```

> `CLAUDE_CODE_OAUTH_TOKEN`를 GitHub repository secrets에 추가해야 합니다.

## 프로젝트 구조

```
templates/
├── global/                # ~/.claude/에 설치되는 전역 설정
│   ├── CLAUDE.md          # 작업 가이드 (워크플로우, Context 절약 원칙)
│   ├── agents/            # Subagent 정의 (13종)
│   ├── skills/            # 스킬 가이드 (코딩, Git, BE, FE 등)
│   ├── hooks/             # 자동 실행 스크립트 (워크플로우 강제, 스킬 평가)
│   └── settings.json      # Claude Code 전역 설정
└── project/               # 프로젝트 .claude/에 설치되는 프로젝트별 설정
    ├── agents/            # project-task-manager, context-generator Agent
    ├── skills/            # ContextGeneration Skill
    ├── hooks/             # task-loader Hook
    ├── workflows/         # context-gen Workflow
    └── project.env.example
```

## 커스터마이징

설치 후 `~/.claude/`에서 필요에 맞게 수정할 수 있습니다. 프로젝트별로는 프로젝트 루트에 `.claude/`를 만들어 설정을 추가합니다.

```
your-project/
├── .claude/
│   ├── context/           # 프로젝트 아키텍처, 도메인 지식
│   └── skills/            # 프로젝트 전용 스킬
└── CLAUDE.md              # 프로젝트 설명
```

- **context/**: 프로젝트의 사실/배경 정보 (아키텍처, 도메인 모델, API 스펙 등)
- **skills/**: 프로젝트 고유의 작업 절차 (배포 방법, 테스트 규칙 등)

## License

MIT
