import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getHookKey } from '../utils';
import { mergeSettingsJson as mergeGlobalSettings } from '../copy';
import { mergeProjectSettingsJson as mergeProjectSettings } from '../init-project';

function createTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'merge-settings-test-'));
}

function cleanupDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

function readJson(filePath: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath: string, data: Record<string, any>): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ─── getHookKey ───

describe('getHookKey', () => {
  it('should generate key for flat hook entry', () => {
    const entry = { type: 'command', command: 'echo hello' };
    expect(getHookKey(entry)).toBe('command:echo hello');
  });

  it('should generate key for nested hooks entry without matcher', () => {
    const entry = {
      hooks: [
        { type: 'command', command: 'cmd-a' },
        { type: 'command', command: 'cmd-b' },
      ],
    };
    const key = getHookKey(entry);
    expect(key).toBe('command:cmd-a\ncommand:cmd-b');
  });

  it('should sort nested hooks for consistent key', () => {
    const entry1 = {
      hooks: [
        { type: 'command', command: 'cmd-b' },
        { type: 'command', command: 'cmd-a' },
      ],
    };
    const entry2 = {
      hooks: [
        { type: 'command', command: 'cmd-a' },
        { type: 'command', command: 'cmd-b' },
      ],
    };
    expect(getHookKey(entry1)).toBe(getHookKey(entry2));
  });

  it('should include matcher in key when present', () => {
    const entry = {
      matcher: 'Bash',
      hooks: [{ type: 'command', command: 'blocker.sh' }],
    };
    expect(getHookKey(entry)).toBe('[Bash]command:blocker.sh');
  });

  it('should generate different keys for same hooks with different matchers', () => {
    const entryBash = {
      matcher: 'Bash',
      hooks: [{ type: 'command', command: 'blocker.sh' }],
    };
    const entryWrite = {
      matcher: 'Write',
      hooks: [{ type: 'command', command: 'blocker.sh' }],
    };
    expect(getHookKey(entryBash)).not.toBe(getHookKey(entryWrite));
  });

  it('should generate different keys for same hooks with vs without matcher', () => {
    const withMatcher = {
      matcher: 'Bash',
      hooks: [{ type: 'command', command: 'blocker.sh' }],
    };
    const withoutMatcher = {
      hooks: [{ type: 'command', command: 'blocker.sh' }],
    };
    expect(getHookKey(withMatcher)).not.toBe(getHookKey(withoutMatcher));
  });

  it('should handle empty matcher as no matcher', () => {
    const entry = {
      matcher: '',
      hooks: [{ type: 'command', command: 'test.sh' }],
    };
    const entryNoMatcher = {
      hooks: [{ type: 'command', command: 'test.sh' }],
    };
    expect(getHookKey(entry)).toBe(getHookKey(entryNoMatcher));
  });
});

// ─── copy.ts mergeSettingsJson (global) ───

describe('copy.ts mergeSettingsJson', () => {
  let sourceDir: string;
  let destDir: string;

  beforeEach(() => {
    sourceDir = createTmpDir();
    destDir = createTmpDir();
  });

  afterEach(() => {
    cleanupDir(sourceDir);
    cleanupDir(destDir);
  });

  it('should create settings.json on fresh install', () => {
    const sourceSettings = {
      statusLine: { type: 'command', command: 'echo test' },
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [{ type: 'command', command: 'skill-forced.sh' }],
          },
        ],
      },
    };
    writeJson(path.join(sourceDir, 'settings.json'), sourceSettings);

    mergeGlobalSettings(sourceDir, destDir);

    const result = readJson(path.join(destDir, 'settings.json'));
    expect(result.statusLine).toBeUndefined();
    expect(result.hooks.UserPromptSubmit).toHaveLength(1);
    expect(result.hooks.UserPromptSubmit[0].hooks[0].command).toBe('skill-forced.sh');
  });

  it('should skip duplicate hooks on re-run', () => {
    const sourceSettings = {
      hooks: {
        UserPromptSubmit: [
          { hooks: [{ type: 'command', command: 'skill-forced.sh' }] },
        ],
      },
    };
    writeJson(path.join(sourceDir, 'settings.json'), sourceSettings);

    // First run
    mergeGlobalSettings(sourceDir, destDir);
    // Second run (re-install)
    mergeGlobalSettings(sourceDir, destDir);

    const result = readJson(path.join(destDir, 'settings.json'));
    expect(result.hooks.UserPromptSubmit).toHaveLength(1);
  });

  it('should distinguish entries with different matchers', () => {
    const sourceSettings = {
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [{ type: 'command', command: 'blocker.sh' }],
          },
          {
            matcher: 'Write',
            hooks: [{ type: 'command', command: 'blocker.sh' }],
          },
        ],
      },
    };
    writeJson(path.join(sourceDir, 'settings.json'), sourceSettings);

    mergeGlobalSettings(sourceDir, destDir);

    const result = readJson(path.join(destDir, 'settings.json'));
    expect(result.hooks.PreToolUse).toHaveLength(2);
    expect(result.hooks.PreToolUse[0].matcher).toBe('Bash');
    expect(result.hooks.PreToolUse[1].matcher).toBe('Write');
  });

  it('should not add duplicate when matcher-entry already exists in dest', () => {
    const sourceSettings = {
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [{ type: 'command', command: 'blocker.sh' }],
          },
        ],
      },
    };
    writeJson(path.join(sourceDir, 'settings.json'), sourceSettings);

    const destSettings = {
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [{ type: 'command', command: 'blocker.sh' }],
          },
        ],
      },
    };
    writeJson(path.join(destDir, 'settings.json'), destSettings);

    mergeGlobalSettings(sourceDir, destDir);

    const result = readJson(path.join(destDir, 'settings.json'));
    expect(result.hooks.PreToolUse).toHaveLength(1);
  });

  it('should preserve existing hooks in dest that are not in source', () => {
    const sourceSettings = {
      hooks: {
        UserPromptSubmit: [
          { hooks: [{ type: 'command', command: 'new-hook.sh' }] },
        ],
      },
    };
    writeJson(path.join(sourceDir, 'settings.json'), sourceSettings);

    const destSettings = {
      hooks: {
        StartSession: [
          { hooks: [{ type: 'command', command: 'existing-hook.sh' }] },
        ],
      },
    };
    writeJson(path.join(destDir, 'settings.json'), destSettings);

    mergeGlobalSettings(sourceDir, destDir);

    const result = readJson(path.join(destDir, 'settings.json'));
    // Source hook merged in
    expect(result.hooks.UserPromptSubmit).toHaveLength(1);
    // Existing hook preserved
    expect(result.hooks.StartSession).toHaveLength(1);
    expect(result.hooks.StartSession[0].hooks[0].command).toBe('existing-hook.sh');
  });

  it('should preserve existing top-level keys in dest', () => {
    const sourceSettings = {
      statusLine: { type: 'command', command: 'source-status' },
      hooks: {},
    };
    writeJson(path.join(sourceDir, 'settings.json'), sourceSettings);

    const destSettings = {
      statusLine: { type: 'command', command: 'dest-status' },
      customKey: 'preserved',
    };
    writeJson(path.join(destDir, 'settings.json'), destSettings);

    mergeGlobalSettings(sourceDir, destDir);

    const result = readJson(path.join(destDir, 'settings.json'));
    // Dest's existing key is preserved (not overwritten)
    expect(result.statusLine.command).toBe('dest-status');
    expect(result.customKey).toBe('preserved');
  });

  it('should skip merge when source settings.json does not exist', () => {
    // No settings.json in sourceDir
    const destSettings = { hooks: { StartSession: [] } };
    writeJson(path.join(destDir, 'settings.json'), destSettings);

    mergeGlobalSettings(sourceDir, destDir);

    const result = readJson(path.join(destDir, 'settings.json'));
    expect(result).toEqual(destSettings);
  });

  it('should exclude statusLine from source even on fresh install', () => {
    const sourceSettings = {
      statusLine: { type: 'command', command: '~/.claude/statusline-command.sh' },
      hooks: {},
    };
    writeJson(path.join(sourceDir, 'settings.json'), sourceSettings);

    mergeGlobalSettings(sourceDir, destDir);

    const result = readJson(path.join(destDir, 'settings.json'));
    expect(result.statusLine).toBeUndefined();
  });

  it('should preserve existing statusLine in dest when source also has statusLine', () => {
    const sourceSettings = {
      statusLine: { type: 'command', command: 'source-status' },
      hooks: {},
    };
    writeJson(path.join(sourceDir, 'settings.json'), sourceSettings);

    const destSettings = {
      statusLine: { type: 'command', command: 'dest-status' },
    };
    writeJson(path.join(destDir, 'settings.json'), destSettings);

    mergeGlobalSettings(sourceDir, destDir);

    const result = readJson(path.join(destDir, 'settings.json'));
    expect(result.statusLine.command).toBe('dest-status');
  });

  it('should convert ~/.claude/ to ./.claude/ in command fields when project=true', () => {
    const sourceSettings = {
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [
              { type: 'command', command: '~/.claude/hooks/skill-forced.sh' },
            ],
          },
        ],
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [
              { type: 'command', command: '~/.claude/hooks/blocker.sh' },
            ],
          },
        ],
      },
    };
    writeJson(path.join(sourceDir, 'settings.json'), sourceSettings);

    mergeGlobalSettings(sourceDir, destDir, { project: true });

    const result = readJson(path.join(destDir, 'settings.json'));
    expect(result.hooks.UserPromptSubmit[0].hooks[0].command).toBe(
      './.claude/hooks/skill-forced.sh'
    );
    expect(result.hooks.PreToolUse[0].hooks[0].command).toBe(
      './.claude/hooks/blocker.sh'
    );
  });

  it('should keep ~/.claude/ paths unchanged when project option is not set', () => {
    const sourceSettings = {
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [
              { type: 'command', command: '~/.claude/hooks/skill-forced.sh' },
            ],
          },
        ],
      },
    };
    writeJson(path.join(sourceDir, 'settings.json'), sourceSettings);

    mergeGlobalSettings(sourceDir, destDir);

    const result = readJson(path.join(destDir, 'settings.json'));
    expect(result.hooks.UserPromptSubmit[0].hooks[0].command).toBe(
      '~/.claude/hooks/skill-forced.sh'
    );
  });
});

// ─── init-project.ts mergeSettingsJson (project) ───

describe('init-project.ts mergeSettingsJson', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTmpDir();
  });

  afterEach(() => {
    cleanupDir(tmpDir);
  });

  it('should create settings.json with StartSession hook on fresh init', () => {
    mergeProjectSettings(tmpDir);

    const result = readJson(path.join(tmpDir, 'settings.json'));
    expect(result.hooks.StartSession).toHaveLength(1);
    expect(result.hooks.StartSession[0].hooks[0].command).toBe(
      'bash .claude/hooks/task-loader.sh'
    );
  });

  it('should skip duplicate StartSession hook on re-run', () => {
    // First run
    mergeProjectSettings(tmpDir);
    // Second run
    mergeProjectSettings(tmpDir);

    const result = readJson(path.join(tmpDir, 'settings.json'));
    expect(result.hooks.StartSession).toHaveLength(1);
  });

  it('should preserve existing StartSession hooks while adding new one', () => {
    const existingSettings = {
      hooks: {
        StartSession: [
          {
            hooks: [{ type: 'command', command: 'existing-session-hook.sh' }],
          },
        ],
      },
    };
    writeJson(path.join(tmpDir, 'settings.json'), existingSettings);

    mergeProjectSettings(tmpDir);

    const result = readJson(path.join(tmpDir, 'settings.json'));
    expect(result.hooks.StartSession).toHaveLength(2);
    expect(result.hooks.StartSession[0].hooks[0].command).toBe('existing-session-hook.sh');
    expect(result.hooks.StartSession[1].hooks[0].command).toBe(
      'bash .claude/hooks/task-loader.sh'
    );
  });

  it('should preserve other hook events', () => {
    const existingSettings = {
      hooks: {
        UserPromptSubmit: [
          { hooks: [{ type: 'command', command: 'prompt-hook.sh' }] },
        ],
      },
    };
    writeJson(path.join(tmpDir, 'settings.json'), existingSettings);

    mergeProjectSettings(tmpDir);

    const result = readJson(path.join(tmpDir, 'settings.json'));
    // Existing event preserved
    expect(result.hooks.UserPromptSubmit).toHaveLength(1);
    expect(result.hooks.UserPromptSubmit[0].hooks[0].command).toBe('prompt-hook.sh');
    // New hook added
    expect(result.hooks.StartSession).toHaveLength(1);
  });

  it('should preserve non-hook settings', () => {
    const existingSettings = {
      statusLine: { type: 'command', command: 'echo status' },
      hooks: {},
    };
    writeJson(path.join(tmpDir, 'settings.json'), existingSettings);

    mergeProjectSettings(tmpDir);

    const result = readJson(path.join(tmpDir, 'settings.json'));
    expect(result.statusLine.command).toBe('echo status');
    expect(result.hooks.StartSession).toHaveLength(1);
  });
});
