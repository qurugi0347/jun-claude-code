import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import chalk from 'chalk';
import { getHookKey } from './utils';

interface ProjectConfig {
  owner: string;
  projectNumber: string;
  repo: string;
}

/**
 * Prompt user for input using readline
 */
function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Get the source templates/project directory path (from package installation)
 */
function getSourceProjectDir(): string {
  return path.resolve(__dirname, '..', 'templates', 'project');
}

/**
 * Get the project .claude directory path (current working directory)
 */
function getProjectClaudeDir(): string {
  return path.join(process.cwd(), '.claude');
}

/**
 * Prompt user for GitHub Project configuration
 */
async function promptProjectConfig(): Promise<ProjectConfig> {
  console.log(chalk.cyan('\n📋 GitHub Project 설정\n'));

  const owner = await askQuestion(chalk.white('GitHub Owner (org 또는 user): '));
  if (!owner) {
    console.log(chalk.red('Owner는 필수입니다.'));
    process.exit(1);
  }

  const projectNumber = await askQuestion(chalk.white('Project Number: '));
  if (!projectNumber || isNaN(Number(projectNumber))) {
    console.log(chalk.red('유효한 Project Number를 입력하세요.'));
    process.exit(1);
  }

  const repo = await askQuestion(chalk.white(`Repository (기본값: ${owner}/): `));
  const finalRepo = repo || `${owner}/`;

  return { owner, projectNumber, repo: finalRepo };
}

/**
 * Create project.env file with GitHub Project configuration
 */
function createProjectEnv(destDir: string, config: ProjectConfig): void {
  const envPath = path.join(destDir, 'project.env');
  const content = `# GitHub Project 설정\nGITHUB_PROJECT_OWNER=${config.owner}\nGITHUB_PROJECT_NUMBER=${config.projectNumber}\nGITHUB_PROJECT_REPO=${config.repo}\n`;

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(envPath, content, 'utf-8');
  console.log(chalk.green(`  ✓ ${path.relative(process.cwd(), envPath)}`));
}

/**
 * Copy a project-specific file from package source to project directory
 */
function copyProjectFile(srcRelative: string, destDir: string): void {
  const srcPath = path.join(getSourceProjectDir(), srcRelative);
  const destPath = path.join(destDir, srcRelative);

  if (!fs.existsSync(srcPath)) {
    console.log(chalk.yellow(`  ⚠ 소스 파일 없음: ${srcRelative}`));
    return;
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  console.log(chalk.green(`  ✓ ${path.relative(process.cwd(), destPath)}`));
}

/**
 * Merge StartSession hook into settings.json.
 * Appends the task-loader hook if not already present (duplicate detection via getHookKey).
 */
export function mergeProjectSettingsJson(destDir: string): void {
  const settingsPath = path.join(destDir, 'settings.json');
  let settings: Record<string, any> = {};

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      console.log(chalk.yellow('  ⚠ 기존 settings.json 파싱 실패, 새로 생성합니다.'));
      settings = {};
    }
  }

  if (!settings.hooks) {
    settings.hooks = {};
  }

  if (!settings.hooks.StartSession) {
    settings.hooks.StartSession = [];
  }

  const newEntry = {
    hooks: [
      {
        type: 'command',
        command: 'bash .claude/hooks/task-loader.sh',
      },
    ],
  };

  const existingKeys = new Set(
    settings.hooks.StartSession.map((e: any) => getHookKey(e))
  );

  if (!existingKeys.has(getHookKey(newEntry))) {
    settings.hooks.StartSession.push(newEntry);
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  console.log(
    chalk.green(`  ✓ ${path.relative(process.cwd(), settingsPath)} (StartSession hook 추가)`)
  );
}

/**
 * Initialize GitHub Project integration in current directory
 */
export async function initProject(): Promise<void> {
  const config = await promptProjectConfig();
  const destDir = getProjectClaudeDir();

  console.log(chalk.cyan('\n🔧 프로젝트 설정 파일 생성\n'));

  // 1. project.env 생성
  createProjectEnv(destDir, config);

  // 2. 프로젝트별 파일 복사
  copyProjectFile('hooks/task-loader.sh', destDir);
  copyProjectFile('agents/project-task-manager.md', destDir);

  // 3. settings.json merge
  mergeProjectSettingsJson(destDir);

  console.log(chalk.cyan('\n✅ GitHub Project 설정 완료!'));
  console.log(chalk.gray(`   Owner: ${config.owner}`));
  console.log(chalk.gray(`   Project: #${config.projectNumber}`));
  console.log(chalk.gray(`   Repo: ${config.repo}\n`));
}
