import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import {
  getFileHash,
  getAllFiles,
  getSourceGlobalDir,
  getDestClaudeDir,
  copyFile,
  categorizeFiles,
  mergeSettingsJson,
  EXCLUDE_ALWAYS,
  EXCLUDE_FROM_PROJECT,
} from './copy';
import {
  loadMetadata,
  saveMetadata,
  mergeMetadata,
  InstalledMetadata,
} from './metadata';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MultiSelect } = require('enquirer');

export type UpdateFileStatus =
  | 'update-available'
  | 'user-modified'
  | 'conflict'
  | 'new-file'
  | 'unchanged'
  | 'removed-upstream';

export interface UpdateOptions {
  dryRun?: boolean;
  force?: boolean;
  project?: boolean;
}

interface FileUpdateInfo {
  file: string;
  status: UpdateFileStatus;
}

/**
 * Compute 3-way update status for a file.
 * Compares base (from metadata), current (on disk), and new (from template).
 */
export function computeUpdateStatus(
  file: string,
  sourceDir: string,
  destDir: string,
  metadata: InstalledMetadata | null,
): UpdateFileStatus {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);

  const newHash = getFileHash(sourcePath);
  const baseHash = metadata?.files[file]?.hash ?? null;
  const currentExists = fs.existsSync(destPath);
  const currentHash = currentExists ? getFileHash(destPath) : null;

  // No base metadata for this file
  if (!baseHash) {
    if (!currentExists) return 'new-file';
    if (currentHash === newHash) return 'unchanged';
    return 'user-modified';
  }

  // Base exists but user deleted the file
  if (!currentExists) return 'new-file';

  // All three hashes available
  if (baseHash === currentHash && currentHash === newHash) return 'unchanged';
  if (baseHash === currentHash) return 'update-available';
  if (baseHash === newHash) return 'user-modified';
  return 'conflict';
}

/**
 * Fetch latest version from npm registry
 */
async function fetchLatestVersion(packageName: string): Promise<string | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
    if (!response.ok) return null;
    const data = (await response.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

/**
 * Format update status for MultiSelect hint
 */
function updateStatusLabel(status: UpdateFileStatus): string {
  switch (status) {
    case 'update-available': return chalk.green('update');
    case 'new-file': return chalk.green('new');
    case 'user-modified': return chalk.yellow('customized');
    case 'conflict': return chalk.red('conflict');
    case 'unchanged': return chalk.gray('unchanged');
    case 'removed-upstream': return chalk.gray('removed upstream');
  }
}

/**
 * Format update status bracket for log output
 */
function updateStatusBracket(status: UpdateFileStatus): string {
  switch (status) {
    case 'update-available': return chalk.green('[update]');
    case 'new-file': return chalk.green('[new]');
    case 'user-modified': return chalk.yellow('[skip]');
    case 'conflict': return chalk.red('[conflict]');
    case 'unchanged': return chalk.gray('[unchanged]');
    case 'removed-upstream': return chalk.gray('[removed]');
  }
}

/**
 * Get aggregate update status for a skill directory
 */
function getSkillUpdateStatus(
  skillName: string,
  allStatuses: FileUpdateInfo[],
): UpdateFileStatus {
  const skillFiles = allStatuses.filter(f => f.file.startsWith(`skills/${skillName}/`));
  if (skillFiles.length === 0) return 'unchanged';

  if (skillFiles.some(f => f.status === 'conflict')) return 'conflict';
  if (skillFiles.some(f => f.status === 'update-available')) return 'update-available';
  if (skillFiles.some(f => f.status === 'new-file')) return 'new-file';
  if (skillFiles.some(f => f.status === 'user-modified')) return 'user-modified';
  return 'unchanged';
}

/**
 * MultiSelect prompt for update items
 */
async function selectUpdateItems(
  category: string,
  items: FileUpdateInfo[],
): Promise<string[]> {
  if (items.length === 0) return [];

  const choices = items.map(item => ({
    name: item.file,
    message: item.file.startsWith('agents/')
      ? path.basename(item.file, '.md')
      : item.file,
    hint: updateStatusLabel(item.status) +
      ((item.status === 'user-modified' || item.status === 'conflict')
        ? ' \u2014 will overwrite your changes' : ''),
    enabled: item.status === 'update-available' || item.status === 'new-file',
  }));

  const prompt = new MultiSelect({
    name: category,
    message: `Select ${category} to update`,
    choices,
    hint: '(\u2191\u2193 navigate, <space> toggle, <a> select all, <enter> confirm)',
  });

  try {
    return await prompt.run();
  } catch {
    console.log(chalk.yellow('\nUpdate cancelled.'));
    process.exit(0);
  }
}

/**
 * MultiSelect prompt for skill sub-files across multiple skills
 */
async function selectSkillUpdateFiles(
  skills: { skillName: string; files: FileUpdateInfo[] }[],
): Promise<string[]> {
  const choices: any[] = [];

  for (const { skillName, files } of skills) {
    const actionable = files.filter(f => f.status !== 'unchanged');
    if (actionable.length === 0) continue;

    choices.push({ role: 'separator', message: chalk.cyan(`\u2500\u2500 ${skillName} \u2500\u2500`) });
    for (const item of actionable) {
      choices.push({
        name: item.file,
        message: `  ${path.basename(item.file)}`,
        hint: updateStatusLabel(item.status) +
          ((item.status === 'user-modified' || item.status === 'conflict')
            ? ' \u2014 will overwrite' : ''),
        enabled: item.status === 'update-available' || item.status === 'new-file',
      });
    }
  }

  if (choices.filter(c => !c.role).length === 0) return [];

  const prompt = new MultiSelect({
    name: 'skill-files',
    message: 'Select skill files to update',
    choices,
    hint: '(\u2191\u2193 navigate, <space> toggle, <a> select all, <enter> confirm)',
  });

  try {
    return await prompt.run();
  } catch {
    console.log(chalk.yellow('\nUpdate cancelled.'));
    process.exit(0);
  }
}

/**
 * Update installed templates while preserving user customizations
 */
export async function updateClaudeFiles(options: UpdateOptions = {}): Promise<void> {
  const { dryRun = false, force = false, project = false } = options;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const currentVersion = require('../package.json').version;

  const sourceDir = getSourceGlobalDir();
  const destDir = project ? path.join(process.cwd(), '.claude') : getDestClaudeDir();
  const targetLabel = project ? 'project' : 'global';

  // Step 1: Version info
  const metadata = loadMetadata(destDir);
  const latestVersion = await fetchLatestVersion('jun-claude-code');

  console.log(chalk.cyan('Version Info:'));
  console.log(`  Package version: ${chalk.bold(currentVersion)}`);
  if (metadata?.version) {
    console.log(`  Installed version: ${chalk.bold(metadata.version)}`);
  } else {
    console.log(`  Installed version: ${chalk.gray('(no metadata found)')}`);
  }
  if (latestVersion && latestVersion !== currentVersion) {
    console.log(`  Latest on npm: ${chalk.bold(latestVersion)}`);
    console.log(`  ${chalk.yellow('Tip:')} npm update -g jun-claude-code`);
  }
  console.log();

  // Check source exists
  if (!fs.existsSync(sourceDir)) {
    console.error(chalk.red('Error:'), 'Source templates/global directory not found');
    process.exit(1);
  }

  // Step 2: Collect file lists
  const allFiles = getAllFiles(sourceDir);
  const files = allFiles.filter(file => {
    if (EXCLUDE_ALWAYS.includes(file)) return false;
    if (project && EXCLUDE_FROM_PROJECT.includes(file)) return false;
    return true;
  });

  if (files.length === 0) {
    console.log(chalk.yellow('No template files found.'));
    return;
  }

  // Step 3: Compute 3-way status for each file
  const fileStatuses: FileUpdateInfo[] = files.map(file => ({
    file,
    status: computeUpdateStatus(file, sourceDir, destDir, metadata),
  }));

  // Check for removed-upstream files (in metadata but not in new template)
  // Files excluded by project mode should NOT be marked as removed-upstream
  if (metadata) {
    for (const file of Object.keys(metadata.files)) {
      const excludedByProject = project && EXCLUDE_FROM_PROJECT.includes(file);
      if (!files.includes(file) && !EXCLUDE_ALWAYS.includes(file) && !excludedByProject) {
        fileStatuses.push({ file, status: 'removed-upstream' });
      }
    }
  }

  // Group by status
  const updateAvailable = fileStatuses.filter(f => f.status === 'update-available');
  const newFiles = fileStatuses.filter(f => f.status === 'new-file');
  const userModified = fileStatuses.filter(f => f.status === 'user-modified');
  const conflicts = fileStatuses.filter(f => f.status === 'conflict');
  const unchanged = fileStatuses.filter(f => f.status === 'unchanged');
  const removedUpstream = fileStatuses.filter(f => f.status === 'removed-upstream');

  // Step 4: Show summary
  const installedVer = metadata?.version ?? '(unknown)';
  console.log(chalk.cyan(`Update Summary (${installedVer} \u2192 ${currentVersion}):`));
  console.log(chalk.blue('Destination:'), `${destDir} ${chalk.gray(`(${targetLabel})`)}`);
  console.log();

  if (updateAvailable.length > 0) {
    console.log(chalk.green(`  Safe to update (${updateAvailable.length}):`));
    for (const f of updateAvailable) {
      console.log(`    ${updateStatusBracket(f.status)} ${f.file}`);
    }
  }

  if (newFiles.length > 0) {
    console.log(chalk.green(`  New files (${newFiles.length}):`));
    for (const f of newFiles) {
      console.log(`    ${updateStatusBracket(f.status)} ${f.file}`);
    }
  }

  if (userModified.length > 0) {
    console.log(chalk.yellow(`  User-modified \u2014 preserved (${userModified.length}):`));
    for (const f of userModified) {
      console.log(`    ${updateStatusBracket(f.status)} ${f.file} ${chalk.gray('(customized)')}`);
    }
  }

  if (conflicts.length > 0) {
    console.log(chalk.red(`  Conflicts (${conflicts.length}):`));
    for (const f of conflicts) {
      console.log(`    ${updateStatusBracket(f.status)} ${f.file}`);
    }
  }

  if (removedUpstream.length > 0) {
    console.log(chalk.gray(`  Removed upstream (${removedUpstream.length}):`));
    for (const f of removedUpstream) {
      console.log(`    ${updateStatusBracket(f.status)} ${f.file}`);
    }
  }

  if (unchanged.length > 0) {
    console.log(chalk.gray(`  Unchanged (${unchanged.length}): ...`));
  }

  console.log();

  // Check if there are actionable files
  const actionableStatuses: UpdateFileStatus[] = ['update-available', 'new-file', 'user-modified', 'conflict'];
  const actionableFiles = fileStatuses.filter(f => actionableStatuses.includes(f.status));

  if (actionableFiles.length === 0) {
    console.log(chalk.green('Everything is up to date!'));
    return;
  }

  // Dry run: stop here
  if (dryRun) {
    console.log(chalk.yellow('No files were changed (dry run mode)'));
    return;
  }

  // Step 5: Determine files to copy
  let filesToCopy: string[];

  if (force) {
    filesToCopy = files;
  } else {
    filesToCopy = [];

    // Legacy install warning
    if (!metadata) {
      console.log(chalk.yellow('No installation metadata found. All existing files will be treated as user-modified.'));
      console.log(chalk.yellow('Use --force to overwrite all files.'));
      console.log();
    }

    // Others: auto-include update-available and new-file
    const categorized = categorizeFiles(actionableFiles.map(f => f.file));

    for (const file of categorized.others) {
      const info = actionableFiles.find(f => f.file === file);
      if (info && (info.status === 'update-available' || info.status === 'new-file')) {
        filesToCopy.push(file);
      }
    }

    // Agents: MultiSelect
    const agentInfos = actionableFiles.filter(f => f.file.startsWith('agents/'));
    if (agentInfos.length > 0) {
      const selected = await selectUpdateItems('Agents', agentInfos);
      filesToCopy.push(...selected);
    }

    // Skills: 2-step MultiSelect
    const allSkillStatuses = fileStatuses.filter(f => f.file.startsWith('skills/'));
    const skillDirs = new Set<string>();
    for (const f of allSkillStatuses) {
      const parts = f.file.split('/');
      if (parts.length >= 2 && parts[1]) skillDirs.add(parts[1]);
    }

    // Step 1: Select skill directories
    const skillDirItems: FileUpdateInfo[] = [];
    for (const skillName of Array.from(skillDirs).sort()) {
      const status = getSkillUpdateStatus(skillName, allSkillStatuses);
      if (status !== 'unchanged') {
        skillDirItems.push({ file: skillName, status });
      }
    }

    if (skillDirItems.length > 0) {
      const selectedSkillDirs = await selectUpdateItems('Skills', skillDirItems);

      // Step 2: For selected skills, show sub-file selection
      const singleFileSkills: string[] = [];
      const multiFileSkills: { skillName: string; files: FileUpdateInfo[] }[] = [];

      for (const skillName of selectedSkillDirs) {
        const skillFiles = allSkillStatuses.filter(
          f => f.file.startsWith(`skills/${skillName}/`)
        );
        const actionableSkillFiles = skillFiles.filter(f => f.status !== 'unchanged');

        if (actionableSkillFiles.length <= 1) {
          // Auto-include single actionable file
          singleFileSkills.push(...actionableSkillFiles.map(f => f.file));
        } else {
          multiFileSkills.push({ skillName, files: skillFiles });
        }
      }

      filesToCopy.push(...singleFileSkills);

      if (multiFileSkills.length > 0) {
        const selectedSubFiles = await selectSkillUpdateFiles(multiFileSkills);
        filesToCopy.push(...selectedSubFiles);
      }
    }
  }

  // Step 6: Copy files
  let copiedCount = 0;

  for (const file of filesToCopy) {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);
    const exists = fs.existsSync(destPath);
    copyFile(sourcePath, destPath);
    const label = exists ? chalk.yellow('[overwritten]') : chalk.green('[created]');
    console.log(`  ${label} ${file}`);
    copiedCount++;
  }

  // Merge settings.json
  mergeSettingsJson(sourceDir, destDir, { project });

  // Update metadata
  const updatedMeta = mergeMetadata(metadata, filesToCopy, sourceDir, currentVersion);
  // Refresh hashes for unchanged files
  for (const fi of unchanged) {
    const sourcePath = path.join(sourceDir, fi.file);
    if (fs.existsSync(sourcePath)) {
      updatedMeta.files[fi.file] = { hash: getFileHash(sourcePath) };
    }
  }
  saveMetadata(destDir, updatedMeta);

  // Step 7: Summary
  console.log();
  const newCount = filesToCopy.filter(f => {
    const info = fileStatuses.find(i => i.file === f);
    return info?.status === 'new-file';
  }).length;
  const updateCount = copiedCount - newCount;
  const preservedCount = userModified.length + conflicts.length -
    filesToCopy.filter(f => {
      const info = fileStatuses.find(i => i.file === f);
      return info && (info.status === 'user-modified' || info.status === 'conflict');
    }).length;

  const parts: string[] = [];
  if (updateCount > 0) parts.push(`updated ${updateCount} files`);
  if (newCount > 0) parts.push(`added ${newCount} new files`);
  if (preservedCount > 0) parts.push(`preserved ${preservedCount} customized files`);

  if (parts.length > 0) {
    console.log(chalk.green(`Done! ${parts.join(', ')}.`));
  } else {
    console.log(chalk.green('Done! No files were updated.'));
  }
}
