import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface TemplateRule {
  name: string;
  dir: string;
  required: string[];
}

/**
 * Get the templates directory path (from package installation)
 */
function getTemplatesDir(): string {
  return path.resolve(__dirname, '..', 'templates');
}

/**
 * Validate that all required items exist in a template directory
 */
function validateTemplate(rule: TemplateRule): string[] {
  const missing: string[] = [];
  const baseDir = path.join(getTemplatesDir(), rule.dir);

  for (const item of rule.required) {
    const itemPath = path.join(baseDir, item);
    if (!fs.existsSync(itemPath)) {
      missing.push(item);
    }
  }

  return missing;
}

/**
 * Validate template directory structure
 */
export async function validateTemplates(): Promise<void> {
  const templatesDir = getTemplatesDir();

  console.log(chalk.cyan('\nValidating template directory structure...\n'));

  if (!fs.existsSync(templatesDir)) {
    console.error(chalk.red('Error:'), 'templates/ directory not found');
    process.exit(1);
  }

  const rules: TemplateRule[] = [
    {
      name: 'Global',
      dir: 'global',
      required: ['CLAUDE.md', 'settings.json', 'agents', 'skills'],
    },
    {
      name: 'Project',
      dir: 'project',
      required: ['workflows'],
    },
  ];

  let hasErrors = false;

  for (const rule of rules) {
    const missing = validateTemplate(rule);

    if (missing.length === 0) {
      console.log(chalk.green(`  [PASS] ${rule.name} template (templates/${rule.dir}/)`));
    } else {
      hasErrors = true;
      console.log(chalk.red(`  [FAIL] ${rule.name} template (templates/${rule.dir}/)`));
      for (const item of missing) {
        console.log(chalk.yellow(`    - missing: ${item}`));
      }
    }
  }

  console.log();

  if (hasErrors) {
    console.error(chalk.red('Validation failed: some required items are missing.'));
    process.exit(1);
  }

  console.log(chalk.green('All templates are valid.'));
}
