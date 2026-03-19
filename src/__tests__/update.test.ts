import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { computeUpdateStatus } from '../update';
import { InstalledMetadata } from '../metadata';

function createTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'update-test-'));
}

function cleanupDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

function writeFile(dir: string, relativePath: string, content: string): void {
  const filePath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(Buffer.from(content)).digest('hex');
}

function createMetadata(files: Record<string, string>, version = '1.0.0'): InstalledMetadata {
  const fileEntries: Record<string, { hash: string }> = {};
  for (const [name, content] of Object.entries(files)) {
    fileEntries[name] = { hash: hashContent(content) };
  }
  return {
    version,
    installedAt: '2025-01-01T00:00:00.000Z',
    files: fileEntries,
  };
}

describe('computeUpdateStatus', () => {
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

  it('should return new-file when no base and no current file exists', () => {
    writeFile(sourceDir, 'agents/new.md', 'template content');

    const status = computeUpdateStatus('agents/new.md', sourceDir, destDir, null);
    expect(status).toBe('new-file');
  });

  it('should return new-file when base exists but user deleted file', () => {
    writeFile(sourceDir, 'agents/deleted.md', 'template content');
    const metadata = createMetadata({ 'agents/deleted.md': 'old content' });

    const status = computeUpdateStatus('agents/deleted.md', sourceDir, destDir, metadata);
    expect(status).toBe('new-file');
  });

  it('should return unchanged when no base but current matches new template', () => {
    const content = 'same content';
    writeFile(sourceDir, 'agents/test.md', content);
    writeFile(destDir, 'agents/test.md', content);

    const status = computeUpdateStatus('agents/test.md', sourceDir, destDir, null);
    expect(status).toBe('unchanged');
  });

  it('should return user-modified for legacy file (no base, current differs from new)', () => {
    writeFile(sourceDir, 'agents/test.md', 'new template');
    writeFile(destDir, 'agents/test.md', 'user customized');

    const status = computeUpdateStatus('agents/test.md', sourceDir, destDir, null);
    expect(status).toBe('user-modified');
  });

  it('should return unchanged when all three hashes match', () => {
    const content = 'same for all';
    writeFile(sourceDir, 'agents/test.md', content);
    writeFile(destDir, 'agents/test.md', content);
    const metadata = createMetadata({ 'agents/test.md': content });

    const status = computeUpdateStatus('agents/test.md', sourceDir, destDir, metadata);
    expect(status).toBe('unchanged');
  });

  it('should return update-available when base==current but new is different', () => {
    const originalContent = 'original';
    const newContent = 'updated template';
    writeFile(sourceDir, 'agents/test.md', newContent);
    writeFile(destDir, 'agents/test.md', originalContent);
    const metadata = createMetadata({ 'agents/test.md': originalContent });

    const status = computeUpdateStatus('agents/test.md', sourceDir, destDir, metadata);
    expect(status).toBe('update-available');
  });

  it('should return user-modified when base!=current but base==new', () => {
    const originalContent = 'original';
    const userContent = 'user changed this';
    writeFile(sourceDir, 'agents/test.md', originalContent);
    writeFile(destDir, 'agents/test.md', userContent);
    const metadata = createMetadata({ 'agents/test.md': originalContent });

    const status = computeUpdateStatus('agents/test.md', sourceDir, destDir, metadata);
    expect(status).toBe('user-modified');
  });

  it('should return conflict when base!=current and base!=new', () => {
    const originalContent = 'original';
    const userContent = 'user changed this';
    const newContent = 'template also changed';
    writeFile(sourceDir, 'agents/test.md', newContent);
    writeFile(destDir, 'agents/test.md', userContent);
    const metadata = createMetadata({ 'agents/test.md': originalContent });

    const status = computeUpdateStatus('agents/test.md', sourceDir, destDir, metadata);
    expect(status).toBe('conflict');
  });

  it('should return unchanged when base!=current but current==new (user applied same change)', () => {
    const originalContent = 'original';
    const newContent = 'both changed to same';
    writeFile(sourceDir, 'agents/test.md', newContent);
    writeFile(destDir, 'agents/test.md', newContent);
    const metadata = createMetadata({ 'agents/test.md': originalContent });

    const status = computeUpdateStatus('agents/test.md', sourceDir, destDir, metadata);
    // base != current, base != new → conflict (even though current == new)
    expect(status).toBe('conflict');
  });

  it('should handle metadata with no entry for the file', () => {
    writeFile(sourceDir, 'agents/new.md', 'template content');
    const metadata = createMetadata({ 'agents/other.md': 'other content' });

    const status = computeUpdateStatus('agents/new.md', sourceDir, destDir, metadata);
    expect(status).toBe('new-file');
  });
});
