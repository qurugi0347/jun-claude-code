#!/usr/bin/env node

import { Command } from 'commander';
import { copyClaudeFiles } from './copy';

const program = new Command();

program
  .name('jun-claude-code')
  .description('Copy .claude configuration files to your home directory (~/.claude)')
  .version('1.0.0')
  .option('-d, --dry-run', 'Preview files to be copied without actually copying')
  .option('-f, --force', 'Overwrite existing files without confirmation')
  .action(async (options) => {
    try {
      await copyClaudeFiles({
        dryRun: options.dryRun,
        force: options.force,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
      } else {
        console.error('An unexpected error occurred');
      }
      process.exit(1);
    }
  });

program
  .command('init-project')
  .description('Initialize GitHub Project integration in current directory')
  .action(async () => {
    try {
      const { initProject } = await import('./init-project');
      await initProject();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
      } else {
        console.error('An unexpected error occurred');
      }
      process.exit(1);
    }
  });

program.parse();
