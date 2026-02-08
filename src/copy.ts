import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import chalk from 'chalk';

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
 * Get the source .claude directory path (from package installation)
 */
function getSourceClaudeDir(): string {
  // When installed as npm package, __dirname is in dist/
  // .claude folder is at package root (sibling to dist/)
  return path.resolve(__dirname, '..', '.claude');
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
 * Copy .claude files to user's home directory
 */
export async function copyClaudeFiles(options: CopyOptions = {}): Promise<void> {
  const { dryRun = false, force = false } = options;

  const sourceDir = getSourceClaudeDir();
  const destDir = getDestClaudeDir();

  console.log(chalk.blue('Source:'), sourceDir);
  console.log(chalk.blue('Destination:'), destDir);
  console.log();

  // Check if source exists
  if (!fs.existsSync(sourceDir)) {
    console.error(chalk.red('Error:'), 'Source .claude directory not found');
    process.exit(1);
  }

  // Files to exclude from global copy (project-specific files)
  const EXCLUDE_FROM_GLOBAL = [
    'hooks/task-loader.sh',
    'agents/project-task-manager.md',
    'project.env.example',
  ];

  // Get all files to copy
  const allFiles = getAllFiles(sourceDir);
  const files = allFiles.filter((file) => {
    return !EXCLUDE_FROM_GLOBAL.includes(file);
  });

  if (files.length === 0) {
    console.log(chalk.yellow('No files found in .claude directory'));
    return;
  }

  console.log(chalk.cyan(`Found ${files.length} files to copy:`));
  console.log();

  // Dry run mode - just show what would be copied
  if (dryRun) {
    console.log(chalk.yellow('[DRY RUN] Files that would be copied:'));
    console.log();
    for (const file of files) {
      const destPath = path.join(destDir, file);
      const exists = fs.existsSync(destPath);
      const status = exists ? chalk.yellow('[overwrite]') : chalk.green('[new]');
      console.log(`  ${status} ${file}`);
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
      // Ask for confirmation
      const shouldOverwrite = await askConfirmation(
        chalk.yellow(`File exists: ${file}. Overwrite? (y/N): `)
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

  console.log();
  console.log(chalk.green(`Done! Copied ${copiedCount} files, skipped ${skippedCount} files.`));
}
