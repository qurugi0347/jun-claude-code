import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import {
  getMetadataPath,
  loadMetadata,
  saveMetadata,
  buildMetadata,
  mergeMetadata,
} from '../metadata';

function createTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'metadata-test-'));
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

describe('metadata', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTmpDir();
  });

  afterEach(() => {
    cleanupDir(tmpDir);
  });

  describe('getMetadataPath', () => {
    it('should return correct path', () => {
      expect(getMetadataPath('/home/user/.claude')).toBe('/home/user/.claude/.jun-installed.json');
    });
  });

  describe('loadMetadata', () => {
    it('should return null when file does not exist', () => {
      expect(loadMetadata(tmpDir)).toBeNull();
    });

    it('should return null when file is invalid JSON', () => {
      fs.writeFileSync(path.join(tmpDir, '.jun-installed.json'), 'not json', 'utf-8');
      expect(loadMetadata(tmpDir)).toBeNull();
    });

    it('should return metadata when valid', () => {
      const meta = {
        version: '1.0.0',
        installedAt: '2025-01-01T00:00:00.000Z',
        files: { 'agents/test.md': { hash: 'abc123' } },
      };
      fs.writeFileSync(
        path.join(tmpDir, '.jun-installed.json'),
        JSON.stringify(meta),
        'utf-8',
      );
      expect(loadMetadata(tmpDir)).toEqual(meta);
    });
  });

  describe('saveMetadata', () => {
    it('should write metadata as formatted JSON', () => {
      const meta = {
        version: '1.0.0',
        installedAt: '2025-01-01T00:00:00.000Z',
        files: { 'agents/test.md': { hash: 'abc123' } },
      };
      saveMetadata(tmpDir, meta);

      const content = fs.readFileSync(path.join(tmpDir, '.jun-installed.json'), 'utf-8');
      expect(JSON.parse(content)).toEqual(meta);
      expect(content.endsWith('\n')).toBe(true);
    });
  });

  describe('buildMetadata', () => {
    it('should create metadata with correct hashes', () => {
      const sourceDir = createTmpDir();
      try {
        writeFile(sourceDir, 'agents/test.md', 'hello');
        writeFile(sourceDir, 'skills/Git/SKILL.md', 'world');

        const meta = buildMetadata(
          ['agents/test.md', 'skills/Git/SKILL.md'],
          sourceDir,
          '1.0.0',
        );

        expect(meta.version).toBe('1.0.0');
        expect(meta.files['agents/test.md'].hash).toBe(hashContent('hello'));
        expect(meta.files['skills/Git/SKILL.md'].hash).toBe(hashContent('world'));
      } finally {
        cleanupDir(sourceDir);
      }
    });

    it('should skip non-existent files', () => {
      const sourceDir = createTmpDir();
      try {
        writeFile(sourceDir, 'agents/test.md', 'hello');

        const meta = buildMetadata(
          ['agents/test.md', 'agents/missing.md'],
          sourceDir,
          '1.0.0',
        );

        expect(Object.keys(meta.files)).toHaveLength(1);
        expect(meta.files['agents/test.md']).toBeDefined();
        expect(meta.files['agents/missing.md']).toBeUndefined();
      } finally {
        cleanupDir(sourceDir);
      }
    });
  });

  describe('mergeMetadata', () => {
    it('should create new metadata when existing is null', () => {
      const sourceDir = createTmpDir();
      try {
        writeFile(sourceDir, 'agents/test.md', 'hello');

        const meta = mergeMetadata(null, ['agents/test.md'], sourceDir, '1.0.0');

        expect(meta.version).toBe('1.0.0');
        expect(meta.files['agents/test.md'].hash).toBe(hashContent('hello'));
      } finally {
        cleanupDir(sourceDir);
      }
    });

    it('should preserve existing entries and add new ones', () => {
      const sourceDir = createTmpDir();
      try {
        writeFile(sourceDir, 'agents/new.md', 'new content');

        const existing = {
          version: '0.9.0',
          installedAt: '2025-01-01T00:00:00.000Z',
          files: { 'agents/old.md': { hash: 'oldhash' } },
        };

        const meta = mergeMetadata(existing, ['agents/new.md'], sourceDir, '1.0.0');

        expect(meta.version).toBe('1.0.0');
        expect(meta.files['agents/old.md'].hash).toBe('oldhash');
        expect(meta.files['agents/new.md'].hash).toBe(hashContent('new content'));
      } finally {
        cleanupDir(sourceDir);
      }
    });

    it('should override existing entries for the same file', () => {
      const sourceDir = createTmpDir();
      try {
        writeFile(sourceDir, 'agents/test.md', 'updated content');

        const existing = {
          version: '0.9.0',
          installedAt: '2025-01-01T00:00:00.000Z',
          files: { 'agents/test.md': { hash: 'oldhash' } },
        };

        const meta = mergeMetadata(existing, ['agents/test.md'], sourceDir, '1.0.0');

        expect(meta.files['agents/test.md'].hash).toBe(hashContent('updated content'));
        expect(meta.files['agents/test.md'].hash).not.toBe('oldhash');
      } finally {
        cleanupDir(sourceDir);
      }
    });
  });
});
