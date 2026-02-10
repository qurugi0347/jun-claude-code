import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

/**
 * Get the templates/project directory path (from package installation)
 */
function getTemplatesDir(): string {
  return path.resolve(__dirname, '..', 'templates', 'project');
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
    console.log(chalk.yellow('  ⚠ .github/workflows/context-gen.yml already exists, skipping'));
  } else {
    fs.copyFileSync(templateSrc, workflowDest);
    console.log(chalk.green('  ✓ Created .github/workflows/context-gen.yml'));
  }

  // 2. .claude/context/codebase/ 디렉토리 + stub INDEX.md
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

  // 3. .claude/context/business/ 디렉토리 + stub INDEX.md
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

  // 4. 안내 메시지
  console.log(chalk.bold('\n✅ Context auto-generation setup complete!\n'));
  console.log(chalk.cyan('Next steps:'));
  console.log(chalk.cyan('  1. Add ANTHROPIC_API_KEY to your repository secrets'));
  console.log(chalk.cyan('     → Settings > Secrets and variables > Actions > New repository secret'));
  console.log(chalk.cyan('  2. Create a PR to trigger context auto-generation'));
  console.log('');
}
