---
name: PromptStructuring-hook-context
description: Hook 작성 시 stdin으로 전달되는 HookContext JSON 스키마와 파싱 패턴 가이드
keywords: [hook, HookContext, JSON, stdin, PreToolUse, PostToolUse, Stop, jq, 파싱]
user-invocable: false
---

# HookContext JSON 스키마

Hook은 stdin으로 JSON 형식의 HookContext를 수신한다. 이벤트 타입에 따라 필드가 달라진다.

## 이벤트별 stdin JSON 구조

### PreToolUse / PostToolUse

| 필드 | 타입 | 설명 | PreToolUse | PostToolUse |
|------|------|------|:----------:|:-----------:|
| `tool_name` | string | 도구 이름 (Bash, Edit, Write 등) | O | O |
| `tool_input` | object | 도구 입력 파라미터 | O | O |
| `tool_output` | string/null | 도구 실행 결과 | null | O |
| `session_id` | string | 현재 세션 ID | O | O |

### tool_input 주요 구조 (도구별)

| 도구 | tool_input 주요 필드 |
|------|---------------------|
| Bash | `{ "command": "..." }` |
| Edit | `{ "file_path": "...", "old_string": "...", "new_string": "..." }` |
| Write | `{ "file_path": "...", "content": "..." }` |
| Read | `{ "file_path": "..." }` |
| Glob | `{ "pattern": "..." }` |
| Grep | `{ "pattern": "...", "path": "..." }` |

### UserPromptSubmit

| 필드 | 타입 | 설명 |
|------|------|------|
| `user_message` | string | 사용자가 입력한 메시지 |
| `session_id` | string | 현재 세션 ID |

### Stop

Agent 턴 완료 후 실행. 계속 진행 여부를 제어할 수 있음.

| 필드 | 타입 | 설명 |
|------|------|------|
| `session_id` | string | 현재 세션 ID |
| `stop_hook_active` | boolean | Stop hook 실행 중 여부 (무한 루프 방지용) |

## 표준 파싱 패턴

jq 우선, sed fallback으로 환경 호환성을 보장한다.

````bash
INPUT=$(cat)

if command -v jq &>/dev/null; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
else
  COMMAND=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
fi
````

### 여러 필드 추출 예시

````bash
INPUT=$(cat)

if command -v jq &>/dev/null; then
  TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
  OUTPUT=$(echo "$INPUT" | jq -r '.tool_output // empty')
else
  TOOL_NAME=$(echo "$INPUT" | sed -n 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  FILE_PATH=$(echo "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  OUTPUT=$(echo "$INPUT" | sed -n 's/.*"tool_output"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
fi
````

## Hook 반환 규칙

| 이벤트 | stdout | stderr | exit code |
|--------|--------|--------|:---------:|
| PreToolUse (허용) | 빈 출력 또는 정보 메시지 | - | 0 |
| PreToolUse (차단) | - | 차단 사유 메시지 | 0 |
| PostToolUse | 정보 메시지 (선택) | - | 0 |
| UserPromptSubmit | 정보 메시지 (선택) | - | 0 |
| Stop (계속) | 빈 출력 | - | 0 |
| Stop (중단) | - | 중단 사유 메시지 | 0 |
| 에러 발생 | - | - | 1 (도구 실행 무관) |

## 주의사항

- PreToolUse에서 **stderr로 출력하면 도구 실행이 차단**됨. stdout은 차단하지 않음.
- PostToolUse/UserPromptSubmit는 관찰 전용이며 도구 실행을 차단할 수 없음.
- sed fallback은 JSON이 한 줄일 때만 안정적. 다중 줄 JSON은 jq 필수.
- `// empty`로 null/undefined 안전 처리 권장.
