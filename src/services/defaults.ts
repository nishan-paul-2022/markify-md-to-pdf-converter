import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export interface DefaultFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  relativePath?: string;
  batchId?: string;
  createdAt: string;
}

async function getFilesRecursively(
  dir: string,
  baseDir: string,
  batchId: string,
  folderName: string,
): Promise<DefaultFile[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: DefaultFile[] = [];

  for (const entry of entries) {
    if (entry.name === '.DS_Store') {
      continue;
    }

    const fullPath = join(dir, entry.name);
    const relativeToPublic = fullPath.split('public')[1];
    const relativeToFolder = fullPath.split(baseDir)[1].replace(/^\//, '');

    if (entry.isDirectory()) {
      const subFiles = await getFilesRecursively(fullPath, baseDir, batchId, folderName);
      files.push(...subFiles);
    } else {
      const ext = entry.name.split('.').pop()?.toLowerCase() || '';
      const validImageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

      // Strict Structure Validation Logic
      // 1. Root Level: Only .md files allowed
      if (!relativeToFolder.includes('/')) {
        if (ext !== 'md') {
          continue;
        }
      }
      // 2. Subfolder Level: Must be "images/" and contain only images
      else {
        const parts = relativeToFolder.split('/');

        // Only allow 1 level deep (images/file.png)
        // However, relativeToFolder for "content-4/images/img.png" might be just "images/img.png" if baseDir is correct

        if (parts.length > 2) {
          continue;
        } // Reject deep nesting

        // If it has subdirectory, it MUST be "images"
        if (parts.length === 2 && parts[0] !== 'images') {
          continue;
        }

        // If it is in images folder, must be image
        if (parts.length === 2 && !validImageExts.includes(ext)) {
          continue;
        }
      }

      const stats = await stat(fullPath);

      let mimeType = 'application/octet-stream';
      if (ext === 'md') {
        mimeType = 'text/markdown';
      } else if (validImageExts.includes(ext)) {
        mimeType = `image/${ext === 'svg' ? 'svg+xml' : ext}`;
      }

      files.push({
        id: `default-${batchId}-${relativeToFolder.replace(/\//g, '-')}`,
        filename: entry.name,
        originalName: entry.name,
        mimeType,
        size: stats.size,
        url: relativeToPublic.replace(/\\/g, '/'),
        relativePath: folderName
          ? `${folderName}/${relativeToFolder}`.replace(/\\/g, '/')
          : relativeToFolder.replace(/\\/g, '/'),
        batchId: batchId,
        createdAt: stats.birthtime.toISOString(),
      });
    }
  }

  return files;
}

export async function getDefaultFiles(): Promise<DefaultFile[]> {
  const publicDir = join(process.cwd(), 'public', 'samples');
  const files: DefaultFile[] = [];

  // 1. Handle sample-file.md
  try {
    const sampleFilePath = join(publicDir, 'sample-file.md');
    const sampleFileStats = await stat(sampleFilePath);
    files.push({
      id: 'default-samples-v1-sample-file.md',
      filename: 'sample-file.md',
      originalName: 'sample-file.md',
      mimeType: 'text/markdown',
      size: sampleFileStats.size,
      url: '/samples/sample-file.md',
      relativePath: 'sample-file.md',
      batchId: 'sample-file',
      createdAt: sampleFileStats.birthtime.toISOString(),
    });
  } catch {
    // Silently ignore if file doesn't exist
  }

  // 2. Handle sample-folder
  try {
    const sampleFolderDir = join(publicDir, 'sample-folder');
    // Verify it exists and is a directory
    const s = await stat(sampleFolderDir);
    if (s.isDirectory()) {
      const folderFiles = await getFilesRecursively(
        sampleFolderDir,
        sampleFolderDir,
        'v1-samples',
        'sample-folder',
      );
      files.push(...folderFiles);
    }
  } catch {
    // Silently ignore if folder doesn't exist
  }

  return files;
}
