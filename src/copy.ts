import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import chalk from 'chalk';
import { loadMetadata, saveMetadata, mergeMetadata } from './metadata';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MultiSelect } = require('enquirer');

export interface CopyOptions {
  dryRun?: boolean;
  force?: boolean;
  project?: boolean;
}

export type FileStatus = 'new' | 'changed' | 'unchanged';

export interface CategorizedFiles {
  agents: string[];
  commands: string[];
  skills: string[];
  others: string[];
}

// Files to exclude from all copies (merge-handled separately)
export const EXCLUDE_ALWAYS = [
  'settings.json',
  'statusline-command.sh',
];

// Files to exclude only when installing to project
export const EXCLUDE_FROM_PROJECT = [
  'hooks/_dedup.sh',
];

/**
 * Calculate SHA-256 hash of a file
 */
export function getFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get all files recursively from a directory
 */
export function getAllFiles(dirPath: string, basePath: string = dirPath): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, basePath));
    } else {
      files.push(path.relative(basePath, fullPath));
    }
  }

  return files;
}

/**
 * Ensure directory exists
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copy a single file
 */
export function copyFile(src: string, dest: string): void {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

/**
 * Get the source templates/global directory path (from package installation)
 */
export function getSourceGlobalDir(): string {
  // When installed as npm package, __dirname is in dist/
  // templates/global folder is at package root
  return path.resolve(__dirname, '..', 'templates', 'global');
}

/**
 * Get the destination .claude directory path (user's home)
 */
export function getDestClaudeDir(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  if (!homeDir) {
    throw new Error('Could not determine home directory');
  }
  return path.join(homeDir, '.claude');
}

/**
 * Categorize files into agents, skills (top-level dirs), and others
 */
export function categorizeFiles(files: string[]): CategorizedFiles {
  const agents: string[] = [];
  const commands: string[] = [];
  const skillDirs = new Set<string>();
  const others: string[] = [];

  for (const file of files) {
    if (file.startsWith('agents/')) {
      agents.push(file);
    } else if (file.startsWith('commands/')) {
      commands.push(file);
    } else if (file.startsWith('skills/')) {
      const parts = file.split('/');
      if (parts.length >= 2 && parts[1]) {
        skillDirs.add(parts[1]);
      }
    } else {
      others.push(file);
    }
  }

  return {
    agents: agents.sort(),
    commands: commands.sort(),
    skills: Array.from(skillDirs).sort(),
    others: others.sort(),
  };
}

/**
 * Get file status (new/changed/unchanged)
 */
function getFileStatus(sourcePath: string, destPath: string): FileStatus {
  if (!fs.existsSync(destPath)) return 'new';
  return getFileHash(sourcePath) === getFileHash(destPath) ? 'unchanged' : 'changed';
}

/**
 * Get skill directory status by checking all files within
 */
function getSkillStatus(skillName: string, sourceDir: string, destDir: string): FileStatus {
  const sourceSkillDir = path.join(sourceDir, 'skills', skillName);
  const destSkillDir = path.join(destDir, 'skills', skillName);

  if (!fs.existsSync(destSkillDir)) return 'new';

  const sourceFiles = getAllFiles(sourceSkillDir, sourceSkillDir);
  for (const file of sourceFiles) {
    const src = path.join(sourceSkillDir, file);
    const dst = path.join(destSkillDir, file);
    if (!fs.existsSync(dst) || getFileHash(src) !== getFileHash(dst)) {
      return 'changed';
    }
  }

  return 'unchanged';
}

/**
 * Format status label for display
 */
function statusLabel(status: FileStatus): string {
  switch (status) {
    case 'new': return chalk.green('new');
    case 'changed': return chalk.yellow('changed');
    case 'unchanged': return chalk.gray('unchanged');
  }
}

/**
 * Format status label with brackets for log output
 */
function statusBracket(status: FileStatus): string {
  switch (status) {
    case 'new': return chalk.green('[new]');
    case 'changed': return chalk.yellow('[changed]');
    case 'unchanged': return chalk.gray('[unchanged]');
  }
}

/**
 * Show MultiSelect prompt for a category
 */
async function selectItems(
  category: string,
  items: { name: string; displayName: string; status: FileStatus }[]
): Promise<string[]> {
  if (items.length === 0) return [];

  const choices = items.map(item => ({
    name: item.name,
    message: item.displayName,
    hint: statusLabel(item.status),
    enabled: item.status !== 'unchanged',
  }));

  const prompt = new MultiSelect({
    name: category,
    message: `Select ${category} to install`,
    choices,
    hint: '(↑↓ navigate, <space> toggle, <a> select all, <enter> confirm)',
  });

  try {
    return await prompt.run();
  } catch {
    console.log(chalk.yellow('\nInstallation cancelled.'));
    process.exit(0);
  }
}

/**
 * Show MultiSelect prompt for skill sub-files across multiple skills.
 * Groups files by skill with separators.
 */
async function selectSkillSubFiles(
  skills: { skillName: string; subFiles: string[] }[],
  sourceDir: string,
  destDir: string
): Promise<string[]> {
  const choices: any[] = [];

  for (const { skillName, subFiles } of skills) {
    choices.push({ role: 'separator', message: chalk.cyan(`── ${skillName} ──`) });

    for (const file of subFiles) {
      const status = getFileStatus(path.join(sourceDir, file), path.join(destDir, file));
      choices.push({
        name: file,
        message: `  ${path.basename(file)}`,
        hint: statusLabel(status),
        enabled: status !== 'unchanged',
      });
    }
  }

  const prompt = new MultiSelect({
    name: 'skill-files',
    message: 'Select skill files to install',
    choices,
    hint: '(↑↓ navigate, <space> toggle, <a> select all, <enter> confirm)',
  });

  try {
    return await prompt.run();
  } catch {
    console.log(chalk.yellow('\nInstallation cancelled.'));
    process.exit(0);
  }
}

/**
 * Merge settings.json from source into destination.
 * Hooks are merged per event key; duplicate hook entries (by deep equality) are skipped.
 * Non-hook keys are shallow-merged (source wins for new keys, dest preserved for existing).
 */
/**
 * Replace ~/.claude/ paths with .claude/ in all command fields (deep traverse).
 */
function replaceClaudePaths(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'command' && typeof value === 'string') {
      result[key] = value.replace(/~\/\.claude\//g, '.claude/');
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'object' && item !== null ? replaceClaudePaths(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = replaceClaudePaths(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Merge settings.json from source into destination.
 * Hooks are merged per event key; duplicate hook entries (by deep equality) are skipped.
 * Non-hook keys are shallow-merged (source wins for new keys, dest preserved for existing).
 * statusLine is always excluded from merge (personal environment setting).
 * When project=true, ~/.claude/ paths in command fields are converted to .claude/.
 */
export function mergeSettingsJson(
  sourceDir: string,
  destDir: string,
  options?: { project?: boolean }
): void {
  const sourcePath = path.join(sourceDir, 'settings.json');
  const destPath = path.join(destDir, 'settings.json');

  if (!fs.existsSync(sourcePath)) {
    return;
  }

  let sourceSettings: Record<string, any>;
  try {
    sourceSettings = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
  } catch {
    console.log(chalk.yellow('  Warning: Could not parse source settings.json, skipping merge.'));
    return;
  }

  let destSettings: Record<string, any> = {};
  if (fs.existsSync(destPath)) {
    try {
      destSettings = JSON.parse(fs.readFileSync(destPath, 'utf-8'));
    } catch {
      console.log(chalk.yellow('  Warning: Could not parse destination settings.json, creating fresh.'));
      destSettings = {};
    }
  }

  // Convert ~/.claude/ → .claude/ paths in source BEFORE merge (for dedup key matching)
  if (options?.project) {
    sourceSettings = replaceClaudePaths(sourceSettings) as Record<string, any>;
  }

  // Merge top-level keys (source fills in missing keys, dest's existing keys preserved)
  for (const key of Object.keys(sourceSettings)) {
    if (key === 'hooks' || key === 'statusLine') {
      continue; // hooks are merged separately below; statusLine is excluded
    }
    if (!(key in destSettings)) {
      destSettings[key] = sourceSettings[key];
    }
  }

  // Merge hooks
  const sourceHooks: Record<string, any[]> = sourceSettings.hooks || {};
  if (!destSettings.hooks) {
    destSettings.hooks = {};
  }
  const destHooks: Record<string, any[]> = destSettings.hooks;

  for (const event of Object.keys(sourceHooks)) {
    const sourceEntries: any[] = sourceHooks[event] || [];
    if (!destHooks[event]) {
      destHooks[event] = [];
    }
    const destEntries: any[] = destHooks[event];

    // Collect all individual commands from dest entries, grouped by matcher
    const destCommandsByMatcher = new Map<string, Set<string>>();
    for (const entry of destEntries) {
      const matcher = entry.matcher || '';
      if (!destCommandsByMatcher.has(matcher)) {
        destCommandsByMatcher.set(matcher, new Set());
      }
      const cmds = destCommandsByMatcher.get(matcher)!;
      if (entry.hooks && Array.isArray(entry.hooks)) {
        for (const h of entry.hooks) {
          if (h.command) cmds.add(h.command);
        }
      } else if (entry.command) {
        cmds.add(entry.command);
      }
    }

    for (const entry of sourceEntries) {
      const matcher = entry.matcher || '';
      const existingCmds = destCommandsByMatcher.get(matcher) || new Set<string>();

      // Extract all commands from this source entry
      const sourceCommands: string[] = [];
      if (entry.hooks && Array.isArray(entry.hooks)) {
        for (const h of entry.hooks) {
          if (h.command) sourceCommands.push(h.command);
        }
      } else if (entry.command) {
        sourceCommands.push(entry.command);
      }

      // Skip if all source commands already exist in dest for the same matcher
      const allExist =
        sourceCommands.length > 0 && sourceCommands.every((cmd) => existingCmds.has(cmd));

      if (!allExist) {
        destEntries.push(entry);
        // Track newly added commands for subsequent source entries
        if (!destCommandsByMatcher.has(matcher)) {
          destCommandsByMatcher.set(matcher, existingCmds);
        }
        for (const cmd of sourceCommands) {
          existingCmds.add(cmd);
        }
      }
    }
  }

  // Convert ~/.claude/ → ./.claude/ paths for project mode
  if (options?.project) {
    destSettings = replaceClaudePaths(destSettings);
  }

  ensureDir(destDir);
  fs.writeFileSync(destPath, JSON.stringify(destSettings, null, 2) + '\n', 'utf-8');

  console.log(`  ${chalk.blue('[merged]')} settings.json`);
}

/**
 * Copy .claude files to user's home directory
 */
export async function copyClaudeFiles(options: CopyOptions = {}): Promise<void> {
  const { dryRun = false, force = false, project = false } = options;

  const sourceDir = getSourceGlobalDir();
  const destDir = project ? path.join(process.cwd(), '.claude') : getDestClaudeDir();
  const targetLabel = project ? 'project' : 'global';

  console.log(chalk.blue('Source:'), sourceDir);
  console.log(chalk.blue('Destination:'), `${destDir} ${chalk.gray(`(${targetLabel})`)}`);
  console.log();

  // Check if source exists
  if (!fs.existsSync(sourceDir)) {
    console.error(chalk.red('Error:'), 'Source templates/global directory not found');
    process.exit(1);
  }

  // Get all files to copy
  const allFiles = getAllFiles(sourceDir);
  const files = allFiles.filter((file) => {
    if (EXCLUDE_ALWAYS.includes(file)) return false;
    if (project && EXCLUDE_FROM_PROJECT.includes(file)) return false;
    return true;
  });

  if (files.length === 0) {
    console.log(chalk.yellow('No files found in templates/global directory'));
    return;
  }

  const categorized = categorizeFiles(files);

  console.log(chalk.cyan(`Found ${files.length} files (${categorized.agents.length} agents, ${categorized.commands.length} commands, ${categorized.skills.length} skills, ${categorized.others.length} others)`));
  console.log();

  // Dry run mode - show categorized status
  if (dryRun) {
    console.log(chalk.yellow('[DRY RUN] Files that would be copied:'));
    console.log();

    if (categorized.agents.length > 0) {
      console.log(chalk.cyan('  Agents:'));
      for (const file of categorized.agents) {
        const status = getFileStatus(path.join(sourceDir, file), path.join(destDir, file));
        console.log(`    ${statusBracket(status)} ${path.basename(file, '.md')}`);
      }
      console.log();
    }

    if (categorized.commands.length > 0) {
      console.log(chalk.cyan('  Commands:'));
      for (const file of categorized.commands) {
        const status = getFileStatus(path.join(sourceDir, file), path.join(destDir, file));
        console.log(`    ${statusBracket(status)} ${path.basename(file, '.md')}`);
      }
      console.log();
    }

    if (categorized.skills.length > 0) {
      console.log(chalk.cyan('  Skills:'));
      for (const skill of categorized.skills) {
        const status = getSkillStatus(skill, sourceDir, destDir);
        console.log(`    ${statusBracket(status)} ${skill}`);
      }
      console.log();
    }

    if (categorized.others.length > 0) {
      console.log(chalk.cyan('  Others (auto-install):'));
      for (const file of categorized.others) {
        const status = getFileStatus(path.join(sourceDir, file), path.join(destDir, file));
        console.log(`    ${statusBracket(status)} ${file}`);
      }
      console.log();
    }

    const sourceSettingsExists = fs.existsSync(path.join(sourceDir, 'settings.json'));
    if (sourceSettingsExists) {
      console.log(`  ${chalk.blue('[merge]')} settings.json`);
    }
    console.log();
    console.log(chalk.yellow('No files were copied (dry run mode)'));
    return;
  }

  // Determine files to copy per category
  let agentFiles: string[] = [];
  let commandFiles: string[] = [];
  let skillFiles: string[] = [];
  let otherFiles: string[] = [];

  if (force) {
    agentFiles = categorized.agents;
    commandFiles = categorized.commands;
    skillFiles = files.filter(f => f.startsWith('skills/'));
    otherFiles = categorized.others;
  } else {
    // Others: auto-copy new/changed files
    for (const file of categorized.others) {
      const status = getFileStatus(path.join(sourceDir, file), path.join(destDir, file));
      if (status !== 'unchanged') {
        otherFiles.push(file);
      }
    }

    // Agents: MultiSelect
    if (categorized.agents.length > 0) {
      const agentItems = categorized.agents.map(file => ({
        name: file,
        displayName: path.basename(file, '.md'),
        status: getFileStatus(path.join(sourceDir, file), path.join(destDir, file)),
      }));
      agentFiles = await selectItems('Agents', agentItems);
    }

    // Commands: MultiSelect
    if (categorized.commands.length > 0) {
      const commandItems = categorized.commands.map(file => ({
        name: file,
        displayName: path.basename(file, '.md'),
        status: getFileStatus(path.join(sourceDir, file), path.join(destDir, file)),
      }));
      commandFiles = await selectItems('Commands', commandItems);
    }

    // Skills: MultiSelect (2-step)
    if (categorized.skills.length > 0) {
      const skillItems = categorized.skills.map(skill => ({
        name: skill,
        displayName: skill,
        status: getSkillStatus(skill, sourceDir, destDir),
      }));
      const selectedSkills = await selectItems('Skills', skillItems);

      // Step 2: 선택된 스킬의 하위 파일 선택
      const multiFileSkills: { skillName: string; subFiles: string[] }[] = [];

      for (const skillName of selectedSkills) {
        const skillSubFiles = files.filter(f =>
          f.startsWith(`skills/${skillName}/`)
        );

        if (skillSubFiles.length > 1) {
          multiFileSkills.push({ skillName, subFiles: skillSubFiles });
        } else {
          // 파일이 1개뿐이면 자동 포함
          skillFiles.push(...skillSubFiles);
        }
      }

      // 하위 파일 선택이 필요한 스킬이 있으면 한 번의 프롬프트로 표시
      if (multiFileSkills.length > 0) {
        const selectedSubFiles = await selectSkillSubFiles(multiFileSkills, sourceDir, destDir);
        skillFiles.push(...selectedSubFiles);
      }
    }
  }

  // Copy all selected files
  const allFilesToCopy = [...otherFiles, ...agentFiles, ...commandFiles, ...skillFiles];
  let copiedCount = 0;

  if (otherFiles.length > 0 || categorized.others.length > 0) {
    // Show unchanged others for context
    for (const file of categorized.others) {
      if (!otherFiles.includes(file)) {
        console.log(`  ${chalk.gray('[unchanged]')} ${file}`);
      }
    }
  }

  for (const file of allFilesToCopy) {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);
    const exists = fs.existsSync(destPath);
    copyFile(sourcePath, destPath);
    const label = exists ? chalk.yellow('[overwritten]') : chalk.green('[created]');
    console.log(`  ${label} ${file}`);
    copiedCount++;
  }

  const skippedCount = files.length - copiedCount;

  // Merge settings.json (hooks are merged, not overwritten)
  mergeSettingsJson(sourceDir, destDir, { project });

  // Save installation metadata
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const currentVersion = require('../package.json').version;
  const existingMeta = loadMetadata(destDir);
  const updatedMeta = mergeMetadata(existingMeta, allFilesToCopy, sourceDir, currentVersion);
  saveMetadata(destDir, updatedMeta);

  console.log();
  console.log(chalk.green(`Done! Copied ${copiedCount} files, skipped ${skippedCount} files.`));
}
