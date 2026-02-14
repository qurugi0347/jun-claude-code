import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto';
import chalk from 'chalk';

/**
 * Get the templates/project directory path (from package installation)
 */
function getTemplatesDir(): string {
  return path.resolve(__dirname, '..', 'templates', 'project');
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
 * Initialize context auto-generation with GitHub Actions
 */
export async function initContext(): Promise<void> {
  const cwd = process.cwd();

  console.log(chalk.bold('\n📄 Initializing Context Auto-Generation...\n'));

  // 1. templates/project/workflows/context-gen.yml → .github/workflows/context-gen.yml 복사
  const templateSrc = path.join(getTemplatesDir(), 'workflows', 'context-gen.yml');
  const workflowDest = path.join(cwd, '.github', 'workflows', 'context-gen.yml');

  fs.mkdirSync(path.dirname(workflowDest), { recursive: true });

  if (fs.existsSync(workflowDest)) {
    const sourceHash = getFileHash(templateSrc);
    const destHash = getFileHash(workflowDest);

    if (sourceHash === destHash) {
      console.log(chalk.gray('  [unchanged] .github/workflows/context-gen.yml'));
    } else {
      const shouldOverwrite = await askConfirmation(
        chalk.yellow('  ⚠ .github/workflows/context-gen.yml has changes. Overwrite? (y/N): ')
      );
      if (shouldOverwrite) {
        fs.copyFileSync(templateSrc, workflowDest);
        console.log(chalk.green('  ✓ Replaced .github/workflows/context-gen.yml'));
      } else {
        console.log(chalk.gray('  Skipped: .github/workflows/context-gen.yml'));
      }
    }
  } else {
    fs.copyFileSync(templateSrc, workflowDest);
    console.log(chalk.green('  ✓ Created .github/workflows/context-gen.yml'));
  }

  // 2. context-generator Agent 복사
  const agentSrc = path.join(getTemplatesDir(), 'agents', 'context-generator.md');
  const agentDest = path.join(cwd, '.claude', 'agents', 'context-generator.md');

  fs.mkdirSync(path.dirname(agentDest), { recursive: true });

  if (fs.existsSync(agentDest)) {
    const sourceHash = getFileHash(agentSrc);
    const destHash = getFileHash(agentDest);

    if (sourceHash === destHash) {
      console.log(chalk.gray('  [unchanged] .claude/agents/context-generator.md'));
    } else {
      const shouldOverwrite = await askConfirmation(
        chalk.yellow('  ⚠ .claude/agents/context-generator.md has changes. Overwrite? (y/N): ')
      );
      if (shouldOverwrite) {
        fs.copyFileSync(agentSrc, agentDest);
        console.log(chalk.green('  ✓ Replaced .claude/agents/context-generator.md'));
      } else {
        console.log(chalk.gray('  Skipped: .claude/agents/context-generator.md'));
      }
    }
  } else {
    fs.copyFileSync(agentSrc, agentDest);
    console.log(chalk.green('  ✓ Created .claude/agents/context-generator.md'));
  }

  // 3. ContextGeneration Skill 복사
  const skillSrc = path.join(getTemplatesDir(), 'skills', 'ContextGeneration', 'SKILL.md');
  const skillDest = path.join(cwd, '.claude', 'skills', 'ContextGeneration', 'SKILL.md');

  fs.mkdirSync(path.dirname(skillDest), { recursive: true });

  if (fs.existsSync(skillDest)) {
    const sourceHash = getFileHash(skillSrc);
    const destHash = getFileHash(skillDest);

    if (sourceHash === destHash) {
      console.log(chalk.gray('  [unchanged] .claude/skills/ContextGeneration/SKILL.md'));
    } else {
      const shouldOverwrite = await askConfirmation(
        chalk.yellow('  ⚠ .claude/skills/ContextGeneration/SKILL.md has changes. Overwrite? (y/N): ')
      );
      if (shouldOverwrite) {
        fs.copyFileSync(skillSrc, skillDest);
        console.log(chalk.green('  ✓ Replaced .claude/skills/ContextGeneration/SKILL.md'));
      } else {
        console.log(chalk.gray('  Skipped: .claude/skills/ContextGeneration/SKILL.md'));
      }
    }
  } else {
    fs.copyFileSync(skillSrc, skillDest);
    console.log(chalk.green('  ✓ Created .claude/skills/ContextGeneration/SKILL.md'));
  }

  // 4. .claude/context/codebase/ 디렉토리 + stub INDEX.md
  const codebaseDirPath = path.join(cwd, '.claude', 'context', 'codebase');
  const codebaseIndex = path.join(codebaseDirPath, 'INDEX.md');

  fs.mkdirSync(codebaseDirPath, { recursive: true });

  if (fs.existsSync(codebaseIndex)) {
    console.log(chalk.yellow('  ⚠ .claude/context/codebase/INDEX.md already exists, skipping'));
  } else {
    fs.writeFileSync(codebaseIndex, `---
name: Codebase Index
description: 코드베이스 모듈 참조 목록
---

# Codebase Context Index

## 모듈 목록

| 모듈 | 설명 | 문서 |
|------|------|------|
`);
    console.log(chalk.green('  ✓ Created .claude/context/codebase/INDEX.md'));
  }

  // 5. .claude/context/business/ 디렉토리 + stub INDEX.md
  const businessDirPath = path.join(cwd, '.claude', 'context', 'business');
  const businessIndex = path.join(businessDirPath, 'INDEX.md');

  fs.mkdirSync(businessDirPath, { recursive: true });

  if (fs.existsSync(businessIndex)) {
    console.log(chalk.yellow('  ⚠ .claude/context/business/INDEX.md already exists, skipping'));
  } else {
    fs.writeFileSync(businessIndex, `---
name: Business Index
description: 비즈니스 도메인 참조 목록
---

# Business Context Index

## 프로젝트 개요

<!-- 프로젝트가 해결하는 문제와 대상 사용자를 작성하세요 -->

## 도메인 목록

| 도메인 | 설명 | 문서 |
|--------|------|------|
`);
    console.log(chalk.green('  ✓ Created .claude/context/business/INDEX.md'));
  }

  // 6. 안내 메시지
  console.log(chalk.bold('\n✅ Context auto-generation setup complete!\n'));
  console.log(chalk.cyan('Next steps:'));
  console.log(chalk.cyan('  1. Enable GitHub Actions permissions:'));
  console.log(chalk.cyan('     → Repository > Settings > Actions > General'));
  console.log(chalk.cyan('     → Workflow permissions: "Read and write permissions"'));
  console.log(chalk.cyan('     → ✅ "Allow GitHub Actions to create and approve pull requests"'));
  console.log(chalk.cyan('  2. Add CLAUDE_CODE_OAUTH_TOKEN to your repository secrets'));
  console.log(chalk.cyan('     → Settings > Secrets and variables > Actions > New repository secret'));
  console.log(chalk.cyan('  3. Create a PR to trigger context auto-generation'));
  console.log('');
}
