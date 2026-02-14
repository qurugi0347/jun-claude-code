import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto';
import chalk from 'chalk';
import { getHookKey } from './utils';

export interface CopyOptions {
  dryRun?: boolean;
  force?: boolean;
}

/**
 * Prompt user for confirmation using readline
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.toLowerCase().trim();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

/**
 * Calculate SHA-256 hash of a file
 */
function getFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get all files recursively from a directory
 */
function getAllFiles(dirPath: string, basePath: string = dirPath): string[] {
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
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copy a single file
 */
function copyFile(src: string, dest: string): void {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

/**
 * Get the source templates/global directory path (from package installation)
 */
function getSourceGlobalDir(): string {
  // When installed as npm package, __dirname is in dist/
  // templates/global folder is at package root
  return path.resolve(__dirname, '..', 'templates', 'global');
}

/**
 * Get the destination .claude directory path (user's home)
 */
function getDestClaudeDir(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  if (!homeDir) {
    throw new Error('Could not determine home directory');
  }
  return path.join(homeDir, '.claude');
}

/**
 * Merge settings.json from source into destination.
 * Hooks are merged per event key; duplicate hook entries (by deep equality) are skipped.
 * Non-hook keys are shallow-merged (source wins for new keys, dest preserved for existing).
 */
export function mergeSettingsJson(sourceDir: string, destDir: string): void {
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

  // Merge top-level keys (source fills in missing keys, dest's existing keys preserved)
  for (const key of Object.keys(sourceSettings)) {
    if (key === 'hooks') {
      continue; // hooks are merged separately below
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

    // Build a Set of command keys from existing entries for fast duplicate detection
    const existingKeys = new Set(destEntries.map((entry) => getHookKey(entry)));

    for (const entry of sourceEntries) {
      const key = getHookKey(entry);
      if (!existingKeys.has(key)) {
        destEntries.push(entry);
        existingKeys.add(key);
      }
    }
  }

  ensureDir(destDir);
  fs.writeFileSync(destPath, JSON.stringify(destSettings, null, 2) + '\n', 'utf-8');

  console.log(`  ${chalk.blue('[merged]')} settings.json`);
}

/**
 * Copy .claude files to user's home directory
 */
export async function copyClaudeFiles(options: CopyOptions = {}): Promise<void> {
  const { dryRun = false, force = false } = options;

  const sourceDir = getSourceGlobalDir();
  const destDir = getDestClaudeDir();

  console.log(chalk.blue('Source:'), sourceDir);
  console.log(chalk.blue('Destination:'), destDir);
  console.log();

  // Check if source exists
  if (!fs.existsSync(sourceDir)) {
    console.error(chalk.red('Error:'), 'Source templates/global directory not found');
    process.exit(1);
  }

  // Files to exclude from global copy (merge-handled separately)
  const EXCLUDE_FROM_GLOBAL = [
    'settings.json',
  ];

  // Get all files to copy
  const allFiles = getAllFiles(sourceDir);
  const files = allFiles.filter((file) => {
    return !EXCLUDE_FROM_GLOBAL.includes(file);
  });

  if (files.length === 0) {
    console.log(chalk.yellow('No files found in templates/global directory'));
    return;
  }

  console.log(chalk.cyan(`Found ${files.length} files to copy:`));
  console.log();

  // Dry run mode - just show what would be copied
  if (dryRun) {
    console.log(chalk.yellow('[DRY RUN] Files that would be copied:'));
    console.log();
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);
      const exists = fs.existsSync(destPath);
      if (exists) {
        const sourceHash = getFileHash(sourcePath);
        const destHash = getFileHash(destPath);
        const status = sourceHash === destHash ? chalk.gray('[unchanged]') : chalk.yellow('[overwrite]');
        console.log(`  ${status} ${file}`);
      } else {
        console.log(`  ${chalk.green('[new]')} ${file}`);
      }
    }
    // settings.json merge indicator
    const sourceSettingsExists = fs.existsSync(path.join(sourceDir, 'settings.json'));
    if (sourceSettingsExists) {
      console.log(`  ${chalk.blue('[merge]')} settings.json`);
    }
    console.log();
    console.log(chalk.yellow('No files were copied (dry run mode)'));
    return;
  }

  // Copy files
  let copiedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);
    const exists = fs.existsSync(destPath);

    if (exists && !force) {
      const sourceHash = getFileHash(sourcePath);
      const destHash = getFileHash(destPath);

      if (sourceHash === destHash) {
        console.log(`  ${chalk.gray('[unchanged]')} ${file}`);
        skippedCount++;
        continue;
      }

      // Hash differs - ask for confirmation
      const shouldOverwrite = await askConfirmation(
        chalk.yellow(`File changed: ${file}. Overwrite? (y/N): `)
      );

      if (!shouldOverwrite) {
        console.log(chalk.gray(`  Skipped: ${file}`));
        skippedCount++;
        continue;
      }
    }

    copyFile(sourcePath, destPath);
    const status = exists ? chalk.yellow('[overwritten]') : chalk.green('[created]');
    console.log(`  ${status} ${file}`);
    copiedCount++;
  }

  // Merge settings.json (hooks are merged, not overwritten)
  mergeSettingsJson(sourceDir, destDir);

  console.log();
  console.log(chalk.green(`Done! Copied ${copiedCount} files, skipped ${skippedCount} files.`));
}
