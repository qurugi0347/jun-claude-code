import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FileMetadata {
  hash: string;
}

export interface InstalledMetadata {
  version: string;
  installedAt: string;
  files: Record<string, FileMetadata>;
}

const METADATA_FILENAME = '.jun-installed.json';

/**
 * Compute SHA-256 hash of a file
 */
function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get metadata file path for a destination directory
 */
export function getMetadataPath(destDir: string): string {
  return path.join(destDir, METADATA_FILENAME);
}

/**
 * Load installation metadata. Returns null if not found or invalid.
 */
export function loadMetadata(destDir: string): InstalledMetadata | null {
  const metaPath = getMetadataPath(destDir);
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Save installation metadata
 */
export function saveMetadata(destDir: string, metadata: InstalledMetadata): void {
  const metaPath = getMetadataPath(destDir);
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2) + '\n', 'utf-8');
}

/**
 * Build metadata from a list of files in the source directory
 */
export function buildMetadata(
  files: string[],
  sourceDir: string,
  version: string,
): InstalledMetadata {
  const fileEntries: Record<string, FileMetadata> = {};
  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    if (fs.existsSync(filePath)) {
      fileEntries[file] = { hash: computeFileHash(filePath) };
    }
  }
  return {
    version,
    installedAt: new Date().toISOString(),
    files: fileEntries,
  };
}

/**
 * Merge new file entries into existing metadata.
 * Existing entries are preserved; new entries override matching keys.
 */
export function mergeMetadata(
  existing: InstalledMetadata | null,
  newFiles: string[],
  sourceDir: string,
  version: string,
): InstalledMetadata {
  const newMeta = buildMetadata(newFiles, sourceDir, version);
  if (!existing) return newMeta;
  return {
    version,
    installedAt: new Date().toISOString(),
    files: {
      ...existing.files,
      ...newMeta.files,
    },
  };
}
