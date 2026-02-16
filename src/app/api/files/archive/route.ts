import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';

import { randomUUID } from 'crypto';
import { mkdir, readdir, rm, stat, writeFile } from 'fs/promises';
import JSZip from 'jszip';
import { join, relative } from 'path';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let tempDir = '';
  try {
    const session = await auth();
    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const archiveFile = formData.get('file') as File | null;
    const source = formData.get('source') as string | null; // 'editor' or 'converter'

    if (!archiveFile) {
      return NextResponse.json({ error: 'No archive provided' }, { status: 400 });
    }

    // Validate that it's a .zip file
    if (!archiveFile.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ error: 'Only .zip files are supported' }, { status: 400 });
    }

    // 1. Create a unique temp directory for extraction
    const batchId = randomUUID();
    tempDir = join(process.cwd(), 'tmp', batchId);
    await mkdir(tempDir, { recursive: true });

    // 2. Extract using JSZip
    const extractDir = join(tempDir, 'extracted');
    await mkdir(extractDir, { recursive: true });

    try {
      const buffer = Buffer.from(await archiveFile.arrayBuffer());
      const zip = await JSZip.loadAsync(buffer);

      // Extract all files
      const extractPromises: Promise<void>[] = [];
      zip.forEach((relativePath, file) => {
        if (!file.dir) {
          const promise = (async () => {
            const content = await file.async('nodebuffer');
            const filePath = join(extractDir, relativePath);
            const fileDir = join(filePath, '..');
            await mkdir(fileDir, { recursive: true });
            await writeFile(filePath, content);
          })();
          extractPromises.push(promise);
        }
      });

      await Promise.all(extractPromises);
    } catch (extractError) {
      logger.error('Extraction error:', extractError);
      return NextResponse.json(
        { error: 'Failed to extract archive. Ensure it is a valid .zip file.' },
        { status: 400 },
      );
    }

    // 4. Recursively find all files
    const RAW_FILES: { name: string; relativePath: string; fullPath: string; size: number }[] = [];

    async function walk(dir: string, base: string) {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = relative(base, fullPath).replace(/\\/g, '/');
        if (entry.isDirectory()) {
          // Skip system directories like __MACOSX
          if (entry.name === '__MACOSX' || entry.name.startsWith('.')) {
            continue;
          }
          await walk(fullPath, base);
        } else {
          // Skip system files like .DS_Store or files starting with .
          if (entry.name.startsWith('.')) {
            continue;
          }

          const stats = await stat(fullPath);
          RAW_FILES.push({
            name: entry.name,
            relativePath: relPath,
            fullPath,
            size: stats.size,
          });
        }
      }
    }
    await walk(extractDir, extractDir);

    // Filtered list of files for logic processing
    const allFiles = RAW_FILES;

    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: 'Archive is empty or only contains invalid files.' },
        { status: 400 },
      );
    }

    // 5. Apply Zero Tolerance Validation Rules
    
    // Rule: Must contain at least one .md file
    const mdFiles = allFiles.filter((f) => f.name.toLowerCase().endsWith('.md'));
    if (mdFiles.length === 0) {
      return NextResponse.json(
        { error: 'Upload failed — archive must contain at least one .md file.' },
        { status: 400 },
      );
    }

    // Determine if there's a common wrapper folder to strip
    const firstSegments = new Set(allFiles.map((f) => f.relativePath.split('/')[0]));
    const hasWrapper =
      firstSegments.size === 1 &&
      ![...firstSegments][0].toLowerCase().endsWith('.md') &&
      [...firstSegments][0].toLowerCase() !== 'images';

    const allowedImageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const validFiles: typeof allFiles = [];
    
    // Helper to find all image references in markdown content with relative path resolution
    async function getReferencedImages(
      mdFiles: { fullPath: string; relativePath: string }[],
      hasWrapper: boolean,
    ): Promise<Set<string>> {
      const { readFile } = await import('fs/promises');
      const allReferences = new Set<string>();

      // Support both ![]() and <img> tags
      const mdImageRegex = /!\[.*?\]\((.*?)\)|<img.*?src=["'](.*?)["']/gi;

      for (const mdFile of mdFiles) {
        const content = await readFile(mdFile.fullPath, 'utf-8');
        const actualParts = mdFile.relativePath.split('/');
        const effectiveParts = hasWrapper ? actualParts.slice(1) : actualParts;
        const mdFolder = effectiveParts.length > 1 ? effectiveParts[0] : '';

        let match;
        while ((match = mdImageRegex.exec(content)) !== null) {
          const ref = (match[1] || match[2]).split(/[?#]/)[0]; // Remove query/hash
          const normalized = ref.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

          // Add raw
          allReferences.add(normalized);

          // Add filename
          const filename = normalized.split('/').pop();
          if (filename) allReferences.add(filename);

          if (!mdFolder) {
            allReferences.add(normalized);
            if (!normalized.startsWith('images/')) {
              allReferences.add(`images/${normalized}`);
            }
          } else {
            allReferences.add(normalized);
            if (!normalized.startsWith(mdFolder + '/')) {
              allReferences.add(`${mdFolder}/${normalized}`);
            }
            if (!normalized.startsWith('images/')) {
              allReferences.add(`images/${normalized}`);
              allReferences.add(`${mdFolder}/images/${normalized}`);
            }
            if (normalized.includes('images/')) {
              const imagesIndex = normalized.indexOf('images/');
              const fromImages = normalized.substring(imagesIndex);
              allReferences.add(fromImages);
              allReferences.add(`${mdFolder}/${fromImages}`);
            }
          }
        }
      }
      return allReferences;
    }

    const referencedImages = await getReferencedImages(mdFiles, hasWrapper);
    const providedImages = new Set<string>();

    for (const file of allFiles) {
      const actualParts = file.relativePath.split('/');
      const effectiveParts = hasWrapper ? actualParts.slice(1) : actualParts;

      if (effectiveParts.length === 0) continue;

      const fileName = file.name.toLowerCase();
      const isMd = fileName.endsWith('.md');
      const isImage = allowedImageExtensions.some((ext) => fileName.endsWith(ext));
      const effectiveRelPath = effectiveParts.join('/');

      if (isImage) {
        providedImages.add(effectiveRelPath);
      }

      // Rule: Hidden files are already skipped in walk()
      
      // Zip acts as a batch of Section 1 (Files) and Section 2 (Folders)
      const depth = effectiveParts.length;
      const parentFolder = depth > 1 ? effectiveParts[depth - 2].toLowerCase() : null;
      const isInsideImages = parentFolder === 'images';

      // Rule: Strict Depth (Zero Tolerance for messy nesting)
      if (depth > 3) {
        return NextResponse.json(
          { error: `Upload failed — directory structure too deep (max 3 levels): ${file.relativePath}` },
          { status: 400 },
        );
      }

      // Rule Check based on position
      if (isMd) {
        // MDs allowed at Root (L1) or Folder Root (L2). No MDs allowed inside images/ or deeper.
        if (depth > 2 || isInsideImages) {
           return NextResponse.json(
            { error: `Upload failed — Markdown files must be at a project root, not in subfolders: ${file.relativePath}` },
            { status: 400 },
          );
        }
        validFiles.push(file);
      } 
      else if (isImage) {
        // Images MUST be inside a folder named 'images/'
        if (!isInsideImages) {
          return NextResponse.json(
            { error: `Upload failed — images must be inside an 'images/' subfolder: ${file.relativePath}` },
            { status: 400 },
          );
        }
        validFiles.push(file);
      }
      else {
        // Anything else is forbidden baggage (unless ignored hidden files)
        const fileName = effectiveParts[depth - 1].toLowerCase();
        if (!fileName.startsWith('.')) {
          return NextResponse.json(
            { error: `Upload failed — invalid file type found: ${file.relativePath}` },
            { status: 400 },
          );
        }
      }
    }

    // FINAL CHECK: Orphaned Assets (Zero Tolerance)
    for (const imagePath of providedImages) {
      // We check if the image path (relative to effective root) is referenced in ANY md file
      // e.g. "images/pic.png" or "Folder/images/pic.png"
      if (!referencedImages.has(imagePath)) {
        return NextResponse.json(
          { error: `Upload failed — Orphaned asset found: '${imagePath}' is not referenced in any Markdown file.` },
          { status: 400 },
        );
      }
    }

    // 6. Save valid files
    const uploadResults = [];
    const userDir = join(process.cwd(), 'public', 'uploads', userId, batchId);
    await mkdir(userDir, { recursive: true });

    for (const file of validFiles) {
      // Normalize the relative path for saving (remove wrapper if any)
      const actualParts = file.relativePath.split('/');
      const savedRelPath = hasWrapper ? actualParts.slice(1).join('/') : file.relativePath;

      const storageKey = `uploads/${userId}/${batchId}/${savedRelPath}`;
      const destinationPath = join(process.cwd(), 'public', storageKey);

      // Ensure subdirectories exist
      if (savedRelPath.includes('/')) {
        await mkdir(join(userDir, savedRelPath.substring(0, savedRelPath.lastIndexOf('/'))), {
          recursive: true,
        });
      }

      // Move file
      const { readFile } = await import('fs/promises');
      const fileContent = await readFile(file.fullPath);
      await writeFile(destinationPath, fileContent);

      const isMd = file.name.toLowerCase().endsWith('.md');

      const fileRecord = await prisma.file.create({
        data: {
          userId,
          batchId,
          filename: randomUUID() + '.' + (file.name.split('.').pop() || 'file'),
          originalName: file.name,
          relativePath: savedRelPath,
          mimeType: isMd ? 'text/markdown' : 'image/octet-stream',
          size: file.size,
          storageKey,
          url: `/api/${storageKey}`,
          metadata: source ? { source } : undefined,
        },
      });
      uploadResults.push(fileRecord);
    }

    return NextResponse.json({
      success: true,
      batchId,
      files: uploadResults,
    });
  } catch (error: unknown) {
    logger.error('Archive upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  } finally {
    // 7. Cleanup temp directory
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        logger.error('Cleanup error:', e);
      }
    }
  }
}
